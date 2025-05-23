# Dotační kalkulátor

Webová aplikace pro výpočet dotací na energetické úspory.

**Posledná aktualizace**: 23.5.2025 16:43

## Popis projektu

Dotační kalkulátor umožňuje uživatelům zadat informace o své nemovitosti a plánovaných renovacích, a následně jim zobrazí přehled dostupných dotací, na které mají nárok. Aplikace zahrnuje:

- Interaktivní formulář pro sběr informací o nemovitosti a plánovaných opatřeních
- Propojení s OpenAI asistentem pro vyhodnocení nároku na dotace
- Přehlednou výsledkovou stránku s detaily o dostupných dotacích

## Technologie

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- AI: OpenAI API

## Instalace a spuštění

### Požadavky
- Node.js (v14 nebo vyšší)
- NPM

### Nastavení
1. Naklonujte repozitář:
   ```
   git clone https://github.com/VASE_UZIVATELSKE_JMENO/dotacni-kalkulator.git
   cd dotacni-kalkulator
   ```

2. Nainstalujte závislosti:
   ```
   cd backend
   npm install
   ```

3. Vytvořte soubor `.env` v adresáři `backend` s následujícím obsahem:
   ```
   OPENAI_API_KEY=váš_openai_api_klíč
   PORT=3000
   ```

4. Spusťte backend server:
   ```
   npm start
   ```

5. V jiném terminálu spusťte jednoduchý HTTP server pro frontend:
   ```
   cd ..
   python3 -m http.server 8000
   ```

6. Aplikace je nyní dostupná na `http://localhost:8000`

## Nasazení na Vercel

1. Nejprve vytvořte repozitář na GitHubu a nahrajte váš kód
2. Přihlaste se na [Vercel](https://vercel.com)
3. Klikněte na "New Project"
4. Importujte váš GitHub repozitář
5. Nastavte Environment Variables (OPENAI_API_KEY)
6. Klikněte na "Deploy"

## Struktura projektu

- `index.html` - Hlavní stránka s formulářem
- `styles.css` - Hlavní styly
- `script.js` - Frontend JavaScript
- `results.html` - Stránka s výsledky kalkulace
- `results-styles.css` - Styly pro výsledkovou stránku
- `results-script.js` - JavaScript pro výsledkovou stránku
- `backend/` - Backend server
  - `server.js` - Express server a API endpoint pro zpracování dat

## Autor

Vytvořeno pro Enermio 