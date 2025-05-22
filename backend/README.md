# Backend pro dotační kalkulátor Enermio

Node.js Express API pro zpracování dat z dotačního kalkulátoru a komunikaci s OpenAI asistentem.

## Instalace a spuštění

1. Nainstalujte závislosti:
   ```
   npm install
   ```

2. Vytvořte soubor `.env` s následujícím obsahem:
   ```
   OPENAI_API_KEY=váš_openai_api_klíč
   PORT=3000
   ASSISTANT_ID=asst_TND8x7S6HXvVWTTWRhAPfp75
   ```

3. Spusťte server:
   ```
   npm start
   ```

Server běží na portu 3000 (nebo hodnota z proměnné prostředí PORT).

## API Endpointy

### `POST /api/submit-dotace`

Zpracuje data formuláře, odešle je do OpenAI asistenta a vrátí výsledky kalkulace dotací.

**Vstupní data**:
```json
{
  "typ_nemovitosti": "rodinny-dum",
  "rok_vystavby": "before-1950",
  "opatreni": ["zatepleni-sten"],
  "detaily_opatreni": {},
  "lokalita": {
    "adresa": "Příkladová 123",
    "mesto": "Praha",
    "psc": "11000"
  },
  "doplnujici_udaje": {},
  "kontakt": {
    "jmeno": "Jan Novák",
    "email": "example@example.com",
    "telefon": "777123456",
    "souhlas": true
  }
}
```

**Úspěšná odpověď**:
```json
{
  "success": true,
  "data": {
    "intro_text": "Pro váš rodinný dům postavený před rokem 1950 v Praze máte nárok na dotace až 130 000 Kč.",
    "doporučene_dotace": [
      {
        "název": "Zateplení vnějších stěn",
        "částka": "130 000 Kč",
        "program": "Nová zelená úsporám",
        "podmínky": "Minimální tloušťka zateplení 200 mm, kompletace projektové dokumentace a posudku.",
        "kombinovatelné_bonusy": [
          "Kombinační bonus",
          "Projektový bonus"
        ],
        "zalohova_dotace": false
      }
    ],
    "celková_dotace": "130 000 Kč",
    "další_informace": {
      "nárok_na_zálohu": false,
      "možnosti_bonusu": [
        "Bonus za kombinaci více opatření",
        "Možnost navýšení celkové dotace o 5 % v znevýhodněných regionech"
      ]
    }
  }
}
```

### `GET /api/health`

Pro kontrolu, zda API běží.

**Odpověď**:
```json
{
  "status": "OK",
  "message": "Server běží"
}
```

## Nasazení na Vercel

1. Přihlaste se na [Vercel](https://vercel.com)
2. Vytvořte nový projekt z GitHub repozitáře
3. Nastavte Environment Variables:
   - `OPENAI_API_KEY`: Váš OpenAI API klíč
   - `ASSISTANT_ID`: ID asistenta OpenAI pro výpočet dotací
4. V nastavení projektu určete:
   - Build Command: `cd backend && npm install`
   - Output Directory: `backend`
   - Install Command: `npm install`
   - Development Command: `cd backend && npm run dev`

5. Klikněte na Deploy 