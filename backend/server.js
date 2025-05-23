const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const app = express();

// Načtení proměnných prostředí ze souboru .env
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Inicializace OpenAI klienta
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Konstanta s ID asistenta
const ASSISTANT_ID = 'asst_TND8x7S6HXvVWTTWRhAPfp75';

// Časový limit pro zpracování odpovědi (15 minut)
const TIMEOUT_MS = 15 * 60 * 1000;

// Funkce pro čekání na dokončení běhu asistenta
async function waitForRunCompletion(threadId, runId) {
  const startTime = Date.now();
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
  
  while (runStatus.status !== 'completed' && runStatus.status !== 'failed' && Date.now() - startTime < TIMEOUT_MS) {
    // Čekání před dalším dotazem na stav
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    console.log(`Stav běhu asistenta: ${runStatus.status}`);
    
    // Kontrola, zda nepotřebujeme poskytnout další vstupy (např. při použití funkcí)
    if (runStatus.status === 'requires_action') {
      console.log('Asistent vyžaduje další akci - toto řešení zatím nepodporuje interaktivní funkce');
      await openai.beta.threads.runs.cancel(threadId, runId);
      throw new Error('Asistent vyžaduje další akci, což není podporováno');
    }
  }
  
  // Kontrola dokončení běhu nebo timeout
  if (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
    if (Date.now() - startTime >= TIMEOUT_MS) {
      console.error('Vypršel časový limit pro zpracování odpovědi asistenta');
      await openai.beta.threads.runs.cancel(threadId, runId);
      throw new Error('Vypršel časový limit pro zpracování odpovědi asistenta');
    }
  }
  
  return runStatus;
}

// Funkce pro vytvoření a zpracování konverzace s asistentem
async function processWithAssistant(formData) {
  try {
    // 1. Vytvoření nového vlákna
    const thread = await openai.beta.threads.create();
    console.log(`Vytvořeno nové vlákno s ID: ${thread.id}`);

    // 2. Přidání zprávy do vlákna s daty formuláře
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: JSON.stringify(formData)
    });
    console.log("Zpráva s daty formuláře byla přidána do vlákna");

    // 3. Spuštění asistenta na vláknu
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });
    console.log(`Spuštěn asistent s ID: ${run.id}`);

    // 4. Polling pro získání stavu běhu asistenta
    let runStatus = await waitForRunCompletion(thread.id, run.id);

    if (runStatus.status === "completed") {
      // 5. Získání odpovědi od asistenta
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
      
      if (assistantMessages.length > 0) {
        const latestMessage = assistantMessages[0].content[0].text.value;
        console.log("Získána odpověď od asistenta");
        
        // Extrakce JSON z odpovědi - opravené zpracování s podporou markdown code blocks
        let jsonContent;
        
        try {
          // Pokus o přímé parsování pro případ, že odpověď je čistý JSON
          jsonContent = JSON.parse(latestMessage);
        } catch (e) {
          // Pokus o extrakci JSON z markdown code blocks
          let jsonText = latestMessage;
          
          // Odstranění markdown značek z odpovědi
          const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
          const match = jsonRegex.exec(latestMessage);
          
          if (match && match[1]) {
            jsonText = match[1].trim();
            try {
              jsonContent = JSON.parse(jsonText);
            } catch (innerError) {
              console.log("Nelze parsovat extrahovaný JSON:", jsonText);
              console.log("Původní odpověď:", latestMessage);
              throw new Error("Nelze extrahovat platný JSON z odpovědi asistenta");
            }
          } else {
            // Pokud neexistuje žádný JSON codeblock, vyhodit chybu
            console.log("Obsah odpovědi (bez JSON bloku):", latestMessage);
            throw new Error("Odpověď asistenta neobsahuje validní JSON blok");
          }
        }
        
        return {
          success: true,
          data: jsonContent
        };
      } else {
        throw new Error("Asistent neodpověděl žádnou zprávou");
      }
    } else {
      throw new Error(`Běh asistenta selhal se statusem: ${runStatus.status}`);
    }
  } catch (error) {
    console.error("Chyba při komunikaci s asistentem:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Validace vstupních dat z formuláře
function validateFormData(data) {
  // Kontrola, zda data existují
  if (!data) {
    throw new Error('Nebyla poskytnuta žádná data');
  }
  
  // Základní povinná pole
  const requiredFields = ['typ_nemovitosti', 'opatreni'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Chybí povinné pole: ${field}`);
    }
  }

  // Kontrola typu pole "opatreni" (musí být pole)
  if (!Array.isArray(data.opatreni)) {
    throw new Error('Pole "opatreni" musí být seznam');
  }
  
  // Kontrola, že je vybráno alespoň jedno opatření
  if (data.opatreni.length === 0) {
    throw new Error('Musí být vybráno alespoň jedno opatření');
  }

  // Prošla všechny kontroly
  return true;
}

// Endpoint pro odeslání dat do OpenAI asistenta
app.post('/api/submit-dotace', async (req, res) => {
  try {
    const formData = req.body;
    console.log('Přijata data formuláře:', formData);

    // Validace dat
    try {
      validateFormData(formData);
    } catch (error) {
      console.error('Validační chyba:', error.message);
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    // Zpracování dat pomocí OpenAI asistenta
    try {
      const assistantResponse = await processWithAssistant(formData);
      return res.json(assistantResponse);
    } catch (error) {
      console.error('Chyba při zpracování asistentem:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Došlo k chybě při zpracování výpočtu, zkuste to prosím znovu'
      });
    }
  } catch (error) {
    console.error('Neočekávaná chyba:', error);
    return res.status(500).json({
      success: false,
      error: 'Došlo k neočekávané chybě, zkuste to prosím znovu'
    });
  }
});

// Základní endpoint pro kontrolu funkčnosti serveru
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server běží' });
});

// Nastavení portu
const PORT = process.env.PORT || 3000;

// Spuštění serveru
app.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
  console.log(`OpenAI API klíč ${process.env.OPENAI_API_KEY ? 'JE' : 'NENÍ'} nastaven`);
}); 