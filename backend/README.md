# Backend pro dotační kalkulačku Enermio

Tento backend slouží k propojení frontendové aplikace dotační kalkulačky s OpenAI asistentem. Poskytuje API endpoint, který přijímá data z formuláře, odesílá je na OpenAI API a vrací výsledek zpracování.

## Požadavky

- Node.js (verze 14 nebo novější)
- npm (Node Package Manager)
- OpenAI API klíč

## Instalace

1. Naklonujte repozitář nebo zkopírujte soubory do vaší pracovní složky
2. Přejděte do složky `backend`
3. Nainstalujte závislosti příkazem:
   ```
   npm install
   ```
4. Vytvořte soubor `.env` v kořenové složce projektu s následujícím obsahem:
   ```
   OPENAI_API_KEY=vas-openai-api-klic
   PORT=3000
   ```
   Nahraďte `vas-openai-api-klic` skutečným API klíčem z vašeho OpenAI účtu.

## Spuštění serveru

Pro vývoj (s automatickým restartem při změnách):
```
npm run dev
```

Pro produkční prostředí:
```
npm start
```

Server bude spuštěn na portu definovaném v `.env` souboru (nebo na portu 3000, pokud není port specifikován).

## API Endpoints

### `GET /api/health`
Kontrolní endpoint pro ověření, že server běží.

### `POST /api/submit-dotace`
Endpoint pro odeslání dat formuláře k vyhodnocení asistentem.

#### Požadovaná struktura:
```json
{
  "typ_nemovitosti": "rodinny-dum",
  "rok_vystavby": 1975,
  "opatreni": ["zatepleni-sten", "fotovoltaika", "tepelne-cerpadlo"],
  "lokalita": {
    "adresa": "Příkladová 123",
    "mesto": "Brno",
    "psc": "60200"
  }
}
```

#### Odpověď:
```json
{
  "success": true,
  "data": {
    "intro_text": "Pro váš rodinný dům postavený v roce 1975 v Brně máte nárok na dotace až 385 000 Kč.",
    "doporučene_dotace": [
      {
        "název": "Zateplení fasády",
        "částka": "170 000 Kč",
        "program": "Nová zelená úsporám",
        "podmínky": "Minimálně 10 cm izolace, plocha 120 m², nutný odborný posudek.",
        "kombinovatelné_bonusy": ["Kombinační bonus", "Projektový bonus"],
        "zalohova_dotace": true
      },
      ...
    ],
    "celková_dotace": "385 000 Kč",
    "další_informace": {
      "nárok_na_zálohu": true,
      "možnosti_bonusu": ["Bonus za kombinaci více opatření", "Bonus za elektronické podání"]
    }
  }
}
```

V případě chyby:
```json
{
  "success": false,
  "error": "Došlo k chybě při zpracování výpočtu, zkuste to prosím znovu"
}
```

## Integrace s frontendem

Frontend by měl posílat POST požadavky na endpoint `/api/submit-dotace` a zpracovávat odpověď pro zobrazení výsledků v šabloně. 