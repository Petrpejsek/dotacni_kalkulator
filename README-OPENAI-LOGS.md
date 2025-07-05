# OpenAI Logování - Dokumentace

## Přehled

Systém automaticky loguje všechnu komunikaci s OpenAI API do databázové tabulky `dotacni_kalkulator_logy`. Toto umožňuje sledování, debugging a analýzu komunikace s OpenAI asistentem.

## Databázová struktura

### Nové sloupce v tabulce `dotacni_kalkulator_logy`:

```sql
-- JSON request poslaný do OpenAI
openai_request TEXT DEFAULT NULL

-- JSON response z OpenAI  
openai_response TEXT DEFAULT NULL

-- ID vlákna OpenAI (thread_id)
openai_thread_id VARCHAR(100) DEFAULT NULL

-- ID spuštění OpenAI (run_id) 
openai_run_id VARCHAR(100) DEFAULT NULL

-- Status komunikace (success/error/info)
openai_status VARCHAR(20) DEFAULT NULL

-- Doba trvání v milisekundách
openai_duration INT DEFAULT NULL
```

## Typy logovaných akcí

### 🔄 Základní OpenAI operace
- `openai_create_thread` - Vytvoření nového vlákna
- `openai_create_message` - Přidání zprávy do vlákna
- `openai_create_run` - Spuštění asistenta
- `openai_request` - Obecný API request

### 📊 Proces operace
- `process_start` - Začátek zpracování formuláře
- `process_complete` - Úspěšné dokončení zpracování
- `process_error` - Chyba při zpracování

## Instalace

### 1. Aktualizace databáze
```bash
php update_database_openai.php
```

### 2. Ověření logování
```bash
# Otevřít test endpoint
open test-openai-logs.php

# Nebo přes curl
curl "test-openai-logs.php?action=stats"
```

## Použití

### 📋 Prohlížení logů

**Web interface:**
```
test-openai-logs.php
```

**API endpoints:**
```bash
# Statistiky
GET test-openai-logs.php?action=stats

# Seznam posledních logů
GET test-openai-logs.php?action=list&limit=20

# Detail konkrétního logu
GET test-openai-logs.php?action=detail&id=123

# Logy pro konkrétní žádost
GET test-openai-logs.php?action=list&zadost_id=456
```

### 🔍 SQL dotazy

```sql
-- Všechny OpenAI logy
SELECT * FROM dotacni_kalkulator_logy 
WHERE openai_request IS NOT NULL 
ORDER BY datum_akce DESC;

-- Chybné requesty
SELECT * FROM dotacni_kalkulator_logy 
WHERE openai_status = 'error'
ORDER BY datum_akce DESC;

-- Pomalé requesty (>5 sekund)
SELECT *, openai_duration/1000 as duration_seconds
FROM dotacni_kalkulator_logy 
WHERE openai_duration > 5000
ORDER BY openai_duration DESC;

-- Statistiky podle akce
SELECT akce, COUNT(*) as count, 
       AVG(openai_duration) as avg_duration_ms,
       COUNT(CASE WHEN openai_status = 'success' THEN 1 END) as success_count,
       COUNT(CASE WHEN openai_status = 'error' THEN 1 END) as error_count
FROM dotacni_kalkulator_logy 
WHERE openai_request IS NOT NULL
GROUP BY akce;
```

## Monitored Metriky

### 📊 Dostupné statistiky
- **Celkový počet requestů** - Všechny OpenAI API volání
- **Úspěšnost (%)** - Poměr úspěšných ku celkovým requestům
- **Průměrná doba trvání** - Rychlost OpenAI odpovědí
- **Nejčastější akce** - Které operace se používají nejčastěji
- **Chybovost** - Počet a typy chyb

### 🔔 Alarmy a monitoring
```sql
-- Vysoká chybovost (>10% za posledních 24 hodin)
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN openai_status = 'error' THEN 1 END) as errors,
    (COUNT(CASE WHEN openai_status = 'error' THEN 1 END) * 100.0 / COUNT(*)) as error_rate
FROM dotacni_kalkulator_logy 
WHERE openai_request IS NOT NULL 
AND datum_akce >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Pomalé requesty (>10 sekund)
SELECT COUNT(*) as slow_requests
FROM dotacni_kalkulator_logy 
WHERE openai_duration > 10000
AND datum_akce >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

## Debugging

### 🐛 Časté problémy

**1. Chybějící OpenAI API klíč**
```
Log: openai_status = 'error'
Response: {"error": "Unauthorized"}
```

**2. Překročený timeout**
```
Log: openai_status = 'error' 
Duration: > 60000ms
```

**3. Neplatný JSON v response**
```
Log: akce = 'process_error'
Response: {"error": "Nelze parsovat JSON z odpovědi"}
```

### 🔧 Debug příkazy

```php
// Kontrola logování v PHP
error_log("OpenAI request logged: " . json_encode($request_data));

// Kontrola databázového připojení
if (!$db_connection) {
    error_log("Database connection missing for OpenAI logging");
}
```

## Bezpečnost a soukromí

### 🔒 Citlivá data
- **Osobní údaje** - Kontaktní informace se logují jako součást requestu
- **API klíče** - Nikdy se nelogují (jsou v HTTP hlavičkách)
- **Thread/Run IDs** - Logují se pro debugging

### 🗑️ Automatické mazání
```sql
-- Nastavení automatického mazání starých logů (>90 dní)
DELETE FROM dotacni_kalkulator_logy 
WHERE datum_akce < DATE_SUB(NOW(), INTERVAL 90 DAY)
AND openai_request IS NOT NULL;
```

### 📋 GDPR compliance
```php
// Funkce pro smazání dat konkrétního uživatele
function deleteUserOpenAILogs($email) {
    global $pdo;
    
    // Najdi všechny žádosti uživatele
    $zadosti = $pdo->prepare("
        SELECT z.id FROM dotacni_kalkulator_zadosti z
        JOIN dotacni_kalkulator_kontakty k ON z.id = k.zadost_id  
        WHERE k.email = ?
    ");
    $zadosti->execute([$email]);
    
    // Smaž OpenAI logy pro tyto žádosti
    foreach ($zadosti->fetchAll() as $zadost) {
        $pdo->prepare("
            DELETE FROM dotacni_kalkulator_logy 
            WHERE zadost_id = ? AND openai_request IS NOT NULL
        ")->execute([$zadost['id']]);
    }
}
```

## Performance optimalizace

### 📈 Doporučení
- **Indexy** - Automaticky vytvořeny pro `openai_thread_id` a `openai_status`
- **Partition** - Zvažte rozdělení tabulky podle data pro velké objemy
- **Archivace** - Pravidelně přesouvejte staré logy do archivní tabulky

### ⚡ Optimalizace dotazů
```sql
-- Index pro rychlé vyhledávání podle data a statusu
CREATE INDEX idx_openai_date_status ON dotacni_kalkulator_logy (datum_akce, openai_status);

-- Index pro vyhledávání podle thread_id
CREATE INDEX idx_openai_thread ON dotacni_kalkulator_logy (openai_thread_id);
```

## API Reference

### LogOpenAIRequest()
```php
function logOpenAIRequest(
    $url,              // string - OpenAI API URL
    $request_data,     // array|string - Request data
    $response_data,    // array|string - Response data  
    $thread_id = null, // string - OpenAI thread ID
    $run_id = null,    // string - OpenAI run ID
    $status = 'success', // string - success|error|info
    $duration = null   // int - Duration in milliseconds
)
```

### Test Endpoints
```php
// Základní statistiky
GET test-openai-logs.php?action=stats

// Seznam logů s limitem
GET test-openai-logs.php?action=list&limit=50

// Detail logu
GET test-openai-logs.php?action=detail&id=123

// Logy pro žádost
GET test-openai-logs.php?action=list&zadost_id=456

// Smazání starých logů
GET test-openai-logs.php?action=clear&days=30
```

## Troubleshooting

### ❌ Běžné chyby

**Chyba: "Databáze není dostupná pro logování OpenAI"**
```
Řešení: Zkontrolujte databázové připojení v config.php
```

**Chyba: "Unknown column 'openai_request'"**
```
Řešení: Spusťte update_database_openai.php
```

**Chyba: "Data too long for column"**
```
Řešení: Request/response jsou automaticky zkráceny na 65000 znaků
```

## Příklady použití

### 📊 Monitoring dashboard
```javascript
// Načtení statistik pro dashboard
fetch('test-openai-logs.php?action=stats')
  .then(response => response.json())
  .then(data => {
    console.log('Success rate:', data.stats.success_rate + '%');
    console.log('Avg duration:', data.stats.avg_duration_ms + 'ms');
  });
```

### 🔍 Analýza chyb
```sql
-- Top 10 nejčastějších chyb
SELECT 
    JSON_EXTRACT(openai_response, '$.error.message') as error_message,
    COUNT(*) as count
FROM dotacni_kalkulator_logy 
WHERE openai_status = 'error'
AND datum_akce >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY error_message
ORDER BY count DESC
LIMIT 10;
```

---
*Dokumentace vytvořena: 2025-01-02*  
*Verze: 1.0.0*  
*Autor: AI Assistant* 