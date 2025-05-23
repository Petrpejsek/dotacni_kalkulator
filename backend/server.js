const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const app = express();

// Načtení proměnných prostředí ze souboru .env
dotenv.config();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Seznam povolených domén
        const allowedOrigins = [
            'http://localhost:8888',
            'http://localhost:8000', 
            'http://localhost:3000',
            'http://127.0.0.1:8888',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:3000'
        ];
        
        // Povolí domény Netlify a Vercel (které obsahují tyto vzory)
        const isDevelopment = !origin || allowedOrigins.includes(origin);
        const isNetlify = origin && origin.includes('netlify.app');
        const isVercel = origin && origin.includes('vercel.app');
        const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
        
        if (isDevelopment || isNetlify || isVercel || isLocalhost) {
            callback(null, true);
        } else {
            console.log('CORS blokoval origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));
app.use(express.json());

// Inicializace OpenAI klienta
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Konstanta s ID asistenta
const ASSISTANT_ID = 'asst_TND8x7S6HXvVWTTWRhAPfp75';

// Časový limit pro zpracování odpovědi (15 minut)
const TIMEOUT_MS = 15 * 60 * 1000;

// Funkce pro čištění citačních značek z OpenAI odpovědi
function cleanOpenAIResponse(text) {
  // Odstranění citačních značek ve formátu 【číslo†source】
  return text.replace(/【\d+†[^】]*】/g, '');
}

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
        
        // Extrakce JSON z odpovědi - vylepšené zpracování
        let jsonContent;
        
        console.log("Raw odpověď asistenta:", latestMessage);
        
        // Vyčištění citačních značek z odpovědi
        const cleanedMessage = cleanOpenAIResponse(latestMessage);
        console.log("Vyčištěná odpověď:", cleanedMessage);
        
        // Pokus o extrakci JSON z markdown bloku
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const match = jsonBlockRegex.exec(cleanedMessage);
        
        if (match && match[1]) {
          // Našli jsme JSON v markdown bloku
          const jsonText = match[1].trim();
          console.log("Extrahovaný JSON text:", jsonText);
          
          try {
            jsonContent = JSON.parse(jsonText);
            console.log("✅ Úspěšně parsován JSON z markdown bloku");
          } catch (parseError) {
            console.error("❌ Chyba při parsování JSON z markdown bloku:", parseError.message);
            console.log("Problematický JSON text:", jsonText);
            throw new Error("Odpověď asistenta obsahuje neplatný JSON v markdown bloku");
          }
        } else {
          // Pokus o přímé parsování čistého JSON
          try {
            jsonContent = JSON.parse(cleanedMessage);
            console.log("✅ Úspěšně parsován čistý JSON");
          } catch (parseError) {
            console.error("❌ Odpověď asistenta není platný JSON:", parseError.message);
            console.log("Problematická odpověď:", cleanedMessage);
            throw new Error("Odpověď asistenta není ve formátu JSON ani v markdown bloku");
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