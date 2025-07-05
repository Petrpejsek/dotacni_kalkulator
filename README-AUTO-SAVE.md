# Auto-save funkcionalita pro Dotační kalkulátor

## Přehled
Auto-save funkcionalita automaticky ukládá pokrok uživatele při procházení kalkulátorem a umožňuje obnovení rozpracované žádosti při opětovném návštěvu.

## Funkce

### 🔄 Automatické ukládání
- **Krok 1**: Při výběru typu nemovitosti se automaticky vytvoří záznam v databázi
- **Kroky 2-7**: Každý dokončený krok se automaticky ukládá
- **UUID tracking**: Každá žádost má jedinečný identifikátor
- **URL management**: UUID se automaticky přidá do URL bez refresh stránky

### 💾 Ukládání dat
- **Progresivní ukládání**: Data se ukládají po dokončení každého kroku
- **Sloučování dat**: Nová data se sloučují s existujícími bez přepsání
- **JSON formát**: Všechna data jsou uložena v JSON formátu pro snadné zpracování
- **Auditní trail**: Každé uložení se loguje s IP adresou a timestampem

### 📥 Obnova dat
- **Automatická detekce**: Pokud URL obsahuje UUID, data se automaticky načtou
- **Pokračování**: Uživatel může pokračovat tam, kde skončil
- **Indikátor**: Uživatel vidí notifikaci o obnovení dat

## Technická implementace

### Databázové změny
```sql
-- Přidané sloupce do tabulky dotacni_kalkulator_zadosti
ALTER TABLE dotacni_kalkulator_zadosti 
ADD COLUMN step int(2) DEFAULT 1 AFTER rok_vystavby;

ALTER TABLE dotacni_kalkulator_zadosti 
ADD COLUMN data_json TEXT DEFAULT NULL AFTER step;
```

### Soubory
- `auto-save.js` - Hlavní JavaScript třída pro auto-save
- `save-step.php` - AJAX endpoint pro ukládání dat
- `update_database.php` - Skript pro aktualizaci databáze
- `script.js` - Upraveno pro integraci s auto-save

### API Endpointy

#### POST /save-step.php
**Akce: create_request**
```json
{
  "action": "create_request",
  "typ_nemovitosti": "rodinny-dum"
}
```

**Akce: update_step**
```json
{
  "action": "update_step",
  "uuid": "12345678-1234-1234-1234-123456789abc",
  "step": 3,
  "step_data": {
    "opatreni": ["zatepleni-sten", "vymena-oken"]
  }
}
```

**Akce: load_request**
```json
{
  "action": "load_request",
  "uuid": "12345678-1234-1234-1234-123456789abc"
}
```

## Uživatelské rozhraní

### Notifikace
- **Vytvoření žádosti**: "💾 Vaše data se automaticky ukládají"
- **Obnovení dat**: "📥 Vaše data byla obnovena"
- **Chyba**: "⚠️ Chyba při ukládání dat"
- **Diskrétní indikátor**: "💾 Uloženo" (zobrazuje se na 2 sekundy)

### URL management
- **Automatické přidání UUID**: `kalkulator.php?uuid=12345678-1234-1234-1234-123456789abc`
- **Bez refresh**: Používá se HTML5 History API
- **Shareable links**: Uživatel může sdílet URL s ostatními

## Instalace a nastavení

### 1. Aktualizace databáze
```bash
# Spustit aktualizační skript
php update_database.php
```

### 2. Ověření souborů
- `auto-save.js` - přidáno do `kalkulator.php`
- `save-step.php` - AJAX endpoint
- `database_handler.php` - rozšířeno o getPDO() metodu

### 3. Testování
```bash
# Otevřít kalkulátor
open kalkulator.php

# Vybrat typ nemovitosti
# Zkontrolovat URL - měl by obsahovat UUID
# Zkontrolovat databázi - měl by být vytvořen záznam
```

## Debugging

### JavaScript konzole
```javascript
// Kontrola auto-save instance
console.log(window.kalkulatorAutoSave);

// Aktuální UUID
console.log(window.kalkulatorAutoSave.getCurrentUUID());

// Aktuální krok
console.log(window.kalkulatorAutoSave.getCurrentStep());
```

### Databázové dotazy
```sql
-- Všechny žádosti
SELECT * FROM dotacni_kalkulator_zadosti ORDER BY datum_vytvoreni DESC;

-- Konkrétní žádost
SELECT * FROM dotacni_kalkulator_zadosti WHERE uuid = 'YOUR_UUID';

-- Logy pro žádost
SELECT * FROM dotacni_kalkulator_logy WHERE zadost_id = YOUR_ID;
```

## Chybové stavy

### Chyby auto-save
- **Síťová chyba**: Pokračuje se bez ukládání
- **Databázová chyba**: Zobrazí se chybová notifikace
- **Neplatné UUID**: Vytvoří se nová žádost
- **Neplatný JSON**: Zobrazí se chybová zpráva

### Fallback chování
- Pokud auto-save selže, kalkulátor funguje normálně
- Data se stále odesílají na konci formuláře
- Uživatel není blokován při chybách

## Bezpečnost

### Validace
- **UUID formát**: Kontrola pomocí regexu
- **Sanitizace vstupů**: Všechny vstupy se filtrují
- **Prepared statements**: Všechny SQL dotazy
- **Rate limiting**: Omezení počtu requestů

### Soukromí
- **IP adresa**: Ukládá se pro auditní účely
- **User Agent**: Ukládá se pro detekci botů
- **Automatické mazání**: Starší záznamy se automaticky mažou
- **GDPR compliance**: Možnost smazání dat na vyžádání

## Monitoring

### Metriky
- Počet vytvořených žádostí
- Průměrný počet dokončených kroků
- Četnost obnovení dat
- Úspěšnost ukládání

### Logy
- Všechny akce se logují do `dotacni_kalkulator_logy`
- Obsahují timestamp, IP adresu, User Agent
- Užitečné pro debugging a analýzu

## Vylepšení do budoucna

### Plánované funkce
- **Offline podpora**: Service Worker pro offline ukládání
- **Synchronizace**: Automatická synchronizace při obnovení připojení
- **Batch ukládání**: Ukládání více kroků najednou
- **Komprese dat**: Menší velikost uložených dat

### Optimalizace
- **Debouncing**: Omezení četnosti ukládání
- **Caching**: Kešování často používaných dat
- **CDN**: Rychlejší načítání JavaScript souborů
- **Minifikace**: Menší velikost souborů

## Podpora
Pro technickou podporu nebo dotazy kontaktujte vývojářský tým.

---
*Dokumentace vytvořena: 2025-01-02*
*Verze: 1.0.0* 

## Troubleshooting

### Error: Auto-save neukládá data
- Zkontrolujte JavaScript konzoli pro chyby
- Ověřte, že `save-step.php` vrací správné JSON odpovědi
- Zkontrolujte databázové připojení

### Error: Formulář se neobnovuje správně
- Zkontrolujte, že UUID v URL odpovídá záznamu v databázi
- Ověřte, že data JSON obsahuje očekávaná pole
- Pro dynamické otázky zkontrolujte, že jsou opatření správně uložena

### Error: Tlačítko "Pokračovat" zůstává neaktivní
- Zkontrolujte validace formuláře
- Ověřte, že dynamické otázky jsou správně vygenerovány
- Ujistěte se, že auto-save neinterferuje s event listeners

## Technické poznámky

### Centralizovaná definice otázek
Od verze 1.1 je seznam dynamických otázek definován pouze jednou v `script.js` jako globální proměnná:

```javascript
// Globální definice používaná v celé aplikaci
window.opatreniOtazky = {
    'zatepleni-sten': {
        label: 'Jaká je přibližná plocha obvodových stěn?\n(v m²)',
        type: 'number',
        min: 1,
        placeholder: 'Např. 120',
    },
    // ... další otázky
};
```

**Výhody:**
- Eliminuje duplicitní kód
- Snadnější údržba - změna otázky stačí provést na jednom místě
- Konzistentnost mezi hlavním formulářem a auto-save systémem
- Lepší performance - otázky se načítají pouze jednou

**Použití:**
- Hlavní formulář: `const opatreniOtazky = window.opatreniOtazky;`
- Auto-save systém: `const opatreniOtazky = window.opatreniOtazky;`
- Přidání nové otázky: pouze v `script.js` na začátku souboru

**Pozor:** Pokud potřebujete upravit otázky, editujte pouze definici v `script.js`. Změny v `auto-save.js` už nejsou potřeba.

### Podpora více podotázek (verze 1.2)
Od verze 1.2 systém podporuje více podotázek pro jedno opatření. Místo jedné otázky můžete definovat několik souvisejících otázek:

**Jednoduchá otázka:**
```javascript
'zatepleni-sten': {
    label: 'Jaká je přibližná plocha obvodových stěn?\n(v m²)',
    type: 'number',
    min: 1,
    placeholder: 'Např. 120',
}
```

**Opatření s podotázkami:**
```javascript
'fotovoltaika': {
    'pozadovany-vykon': {
        label: 'Jaký výkon FVE systému plánujete?\n(v kWp)',
        type: 'number',
        min: 1,
        placeholder: 'Např. 5',
    },
    'strecha-na-sever': {
        label: 'Jaká je orientace vaší střechy?',
        type: 'radio',
        options: ['jih', 'jihovýchod', 'jihozápad', 'východ', 'západ', 'sever', 'nevím'],
    },
    'stav-strechy': {
        label: 'Jaký je stav střechy?',
        type: 'radio',
        options: ['dobrý', 'nutná drobná oprava', 'nutná větší oprava', 'nevím'],
    }
}
```

**Výsledná struktura dat:**
```javascript
// Jednoduchá otázka
doplnujici_udaje: {
    'zatepleni-sten': '120'
}

// Opatření s podotázkami
doplnujici_udaje: {
    'fotovoltaika': {
        'pozadovany-vykon': '5',
        'strecha-na-sever': 'jih',
        'stav-strechy': 'dobrý'
    }
}
```

**Pomocné funkce:**
- `hasSubQuestions(opatreniKey)` - zjišťuje, zda má opatření podotázky
- `getSubQuestions(opatreniKey)` - vrací objekt s podotázkami
- `getSimpleQuestion(opatreniKey)` - vrací jednoduchou otázku

**Názvy HTML inputů:**
- Jednoduchá otázka: `name="zatepleni-sten"`
- Podotázky: `name="fotovoltaika-pozadovany-vykon"`, `name="fotovoltaika-strecha-na-sever"`, atd.

**Testování:**
Pro testování funkcionality podotázek otevřete soubor `test-subquestions.html` v prohlížeči. 