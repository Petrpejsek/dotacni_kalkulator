<?php
/**
 * Konfigurační soubor pro dotační kalkulátor
 */

// Konfigurace databáze
$db_config = [
    'host' => 'localhost',
    'username' => 'root',
    'password' => '',
    'database' => 'dotacni_kalkulator_db',
    'charset' => 'utf8mb4'
];

// OpenAI konfigurace
$openai_config = [
    'api_key' => getenv('OPENAI_API_KEY') ?: 'your-openai-api-key-here',
    'assistant_id' => 'asst_TND8x7S6HXvVWTTWRhAPfp75'
];

// Obecné nastavení
$app_config = [
    'environment' => 'development', // production, development
    'debug_mode' => true,
    'enable_database_logging' => true
];

return [
    'database' => $db_config,
    'openai' => $openai_config,
    'app' => $app_config
];
?> 