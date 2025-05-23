const { OpenAI } = require('openai');

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

    if (runStatus.status === 'completed') {
      // 5. Získání zpráv z vlákna
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      
      if (assistantMessage) {
        const rawText = assistantMessage.content[0].text.value;
        console.log("Získána odpověď od asistenta");
        console.log("RAW odpověď:", rawText);

        // ULTRA ROBUSTNÍ JSON PARSING - zkusí všechny možné formáty
        let parsedData;
        
        try {
          // Pokus 1: Přímý JSON parsing
          parsedData = JSON.parse(rawText);
          console.log("✅ JSON parsován přímo");
        } catch (error) {
          console.log("❌ Přímý JSON parsing selhal, zkouším extrakci z markdown");
          
          // Pokus 2: Extrakce z markdown code block
          const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            try {
              parsedData = JSON.parse(jsonMatch[1].trim());
              console.log("✅ JSON extrahovány z markdown bloku");
            } catch (markdownError) {
              console.log("❌ JSON v markdown bloku je neplatný");
              throw new Error(`Neplatný JSON v markdown: ${markdownError.message}`);
            }
          } else {
            // Pokus 3: Hledání JSON objektu v textu
            const jsonStart = rawText.indexOf('{');
            const jsonEnd = rawText.lastIndexOf('}');
            
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              try {
                const jsonString = rawText.substring(jsonStart, jsonEnd + 1);
                parsedData = JSON.parse(jsonString);
                console.log("✅ JSON nalezen a parsován z textu");
              } catch (extractError) {
                throw new Error(`Nelze parsovat JSON z odpovědi. Původní text: ${rawText}`);
              }
            } else {
              throw new Error(`Žádný JSON obsah nalezen v odpovědi: ${rawText}`);
            }
          }
        }

        // Validace struktury odpovědi
        if (!parsedData || typeof parsedData !== 'object') {
          throw new Error('Parsovaná data nejsou validní objekt');
        }

        // Validace požadovaných polí
        const requiredFields = ['intro_text', 'doporučene_dotace', 'celková_dotace'];
        const missingFields = requiredFields.filter(field => !parsedData[field]);
        
        if (missingFields.length > 0) {
          console.log(`⚠️ Chybí povinná pole: ${missingFields.join(', ')}`);
          // Přidáme výchozí hodnoty pro chybějící pole
          if (!parsedData.intro_text) parsedData.intro_text = "Výsledky dotačního kalkulátoru";
          if (!parsedData.doporučene_dotace) parsedData.doporučene_dotace = [];
          if (!parsedData.celková_dotace) parsedData.celková_dotace = "0 Kč";
        }

        console.log("✅ Úspěšně zpracována odpověď asistenta:", JSON.stringify(parsedData, null, 2));
        return parsedData;
        
      } else {
        throw new Error('Nenalezena odpověď asistenta');
      }
    } else {
      throw new Error(`Asistent neskončil úspěšně. Status: ${runStatus.status}`);
    }
    
  } catch (error) {
    console.error('Chyba při komunikaci s asistentem:', error);
    throw new Error(`Chyba při komunikaci s asistentem: ${error.message}`);
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

// Hlavní serverless funkce pro Vercel
export default async function handler(req, res) {
  // Nastavení CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Zpracování OPTIONS požadavku (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Pouze POST metoda je povolená
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      return res.json({
        success: true,
        data: assistantResponse
      });
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
} 