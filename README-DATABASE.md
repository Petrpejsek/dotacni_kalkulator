# Databáze pro Dotační Kalkulátor

## Popis
Tento systém umožňuje ukládání všech dat z formuláře dotačního kalkulátoru do MySQL databáze pro další analýzy a správu žádostí.

## 🚀 Rychlá instalace

### 1. Příprava databáze
```bash
# Spuštění inicializačního skriptu
php init_database.php
```

### 2. Konfigurace databáze
Upravte soubor `config.php` podle vašeho prostředí:

```php
$db_config = [
    'host' => 'localhost',        // váš databázový server
    'username' => 'root',         // uživatelské jméno
    'password' => '',             // heslo
    'database' => 'dotacni_kalkulator_db',
    'charset' => 'utf8mb4'
];
```

## 📊 Struktura databáze

### Vytvořené tabulky (prefix: `dotacni_kalkulator_`)

1. **`dotacni_kalkulator_zadosti`** - hlavní tabulka žádostí
   - `id` - unikátní ID žádosti
   - `uuid` - UUID pro tracking
   - `typ_nemovitosti` - typ nemovitosti
   - `rok_vystavby` - rok výstavby
   - `stav` - stav zpracování (nova/zpracovana/odeslana)
   - `celkova_dotace` - výsledná dotace
   - `datum_vytvoreni` - datum vytvoření

2. **`dotacni_kalkulator_opatreni`** - vybraná opatření
   - `zadost_id` - odkaz na žádost
   - `nazev_opatreni` - název opatření
   - `detail_hodnota` - detailní hodnoty (JSON)

3. **`dotacni_kalkulator_lokality`** - informace o lokalitě
   - `zadost_id` - odkaz na žádost
   - `adresa` - ulice a čp
   - `mesto` - město/obec
   - `psc` - PSČ

4. **`dotacni_kalkulator_socialni_situace`** - sociální situace ✅
   - `zadost_id` - odkaz na žádost
   - `typ_situace` - typ (duchod/bydleni/pridavek/nic)

5. **`dotacni_kalkulator_kontakty`** - kontaktní údaje
   - `zadost_id` - odkaz na žádost
   - `jmeno` - jméno a příjmení
   - `email` - e-mailová adresa
   - `telefon` - telefonní číslo
   - `souhlas_gdpr` - souhlas s GDPR

6. **`dotacni_kalkulator_doplnujici_udaje`** - další údaje
   - Key-value struktura pro libovolné dodatečné informace

7. **`dotacni_kalkulator_logy`** - auditní log
   - Záznamy všech akcí pro sledování a debugging

## 🔧 Použití

### Automatické ukládání
Systém automaticky ukládá všechna data z formuláře po odeslání. Pokud chcete zakázat ukládání do databáze, změňte v `config.php`:

```php
'enable_database_logging' => false
```

### Načítání dat
```php
// Vytvoření instance
$db = new DotacniKalkulatorDB($config['database']);

// Načtení žádosti podle UUID
$zadost = $db->nacistZadost('uuid-zadosti');

// Zobrazení dat
print_r($zadost);
```

## 📈 Analýzy a reporty

### Nejčastější opatření
```sql
SELECT nazev_opatreni, COUNT(*) as pocet
FROM dotacni_kalkulator_opatreni 
GROUP BY nazev_opatreni 
ORDER BY pocet DESC;
```

### Žádosti podle měst
```sql
SELECT mesto, COUNT(*) as pocet_zadosti
FROM dotacni_kalkulator_lokality 
GROUP BY mesto 
ORDER BY pocet_zadosti DESC;
```

### Sociální situace statistiky ✅
```sql
SELECT typ_situace, COUNT(*) as pocet
FROM dotacni_kalkulator_socialni_situace 
GROUP BY typ_situace 
ORDER BY pocet DESC;
```

### Průměrná výše dotací
```sql
SELECT 
    AVG(CAST(REPLACE(REPLACE(celkova_dotace, ' Kč', ''), ' ', '') AS UNSIGNED)) as prumerna_dotace
FROM dotacni_kalkulator_zadosti 
WHERE celkova_dotace IS NOT NULL;
```

## ✅ Opravené problémy

### 1. **Formulář "social" se nyní ukládá ✅**
- Přidáno sběr dat z kroku 6 (sociální situace) v `script.js`
- Vytvořena tabulka `dotacni_kalkulator_socialni_situace`
- Implementováno ukládání sociálních údajů

### 2. **Vylepšené validace ✅**
- Kontrola všech povinných sekcí formuláře
- Validace e-mailových adres
- Kontrola souhlasu s GDPR
- Validace lokality (adresa, město, PSČ)

### 3. **Kompletní databázové řešení ✅**
- 7 tabulek s prefixem `dotacni_kalkulator_`
- Relační struktura s foreign keys
- Auditní logy pro sledování
- UUID tracking systém

## 🛡️ Bezpečnost

- Všechny SQL dotazy používají prepared statements
- Validace všech vstupních dat
- Logování všech akcí
- IP adresa a User Agent tracking
- GDPR compliance (explicitní souhlas)

## 🐛 Debugging

Pro zapnutí detailního logování:
```php
$app_config = [
    'debug_mode' => true,
    'enable_database_logging' => true
];
```

Logy najdete v PHP error logu nebo v tabulce `dotacni_kalkulator_logy`.

## 📞 Podpora

Pokud narazíte na problémy:
1. Zkontrolujte PHP error log
2. Ověřte konfiguraci databáze v `config.php`  
3. Spusťte znovu `php init_database.php`
4. Zkontrolujte tabulku `dotacni_kalkulator_logy` pro chybové záznamy 