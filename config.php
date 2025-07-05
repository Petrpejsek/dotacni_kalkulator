<?php
/**
 * Konfigurační soubor pro dotační kalkulátor
 */

session_start();


if (!(isset($_SERVER['HTTPS']) && ($_SERVER['HTTPS'] == 'on' ||
        $_SERVER['HTTPS'] == 1) ||
    isset($_SERVER['HTTP_X_FORWARDED_PROTO']) &&
    $_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https'))
{
    $redirect = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    header('HTTP/1.1 301 Moved Permanently');
    header('Location: ' . $redirect);
    exit();
}


if (substr($_SERVER['HTTP_HOST'], 0, 4) !== 'www.' && substr($_SERVER['HTTP_HOST'], 0, 8) !== 'gluster.') {
    header('Location: https://www.' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    exit;
}

if (!isset($_SESSION["sledovac"]) && isset($_GET["utm_source"])) {
    $_SESSION["sledovac"] = $_GET["utm_source"];
    if (isset($_GET["utm_medium"])) {
        $_SESSION["sledovac"] .= "--" . $_GET["utm_medium"];
    }
    if (isset($_GET["utm_campaign"])) {
        $_SESSION["sledovac"] .= "--" . $_GET["utm_campaign"];
    }
}

if (!isset($_SESSION["sledovac"]) && isset($_GET["custom_source"])) {
    $_SESSION["sledovac"] = $_GET["custom_source"];
    if (isset($_GET["custom_medium"])) {
        $_SESSION["sledovac"] .= "--" . $_GET["custom_medium"];
    }
    if (isset($_GET["custom_campaign"])) {
        $_SESSION["sledovac"] .= "--" . $_GET["custom_campaign"];
    }
}


// Konfigurace databáze
$db_config = [
    'host' => 'localhost',
    'username' => 'enermio_cz',
    'password' => 'cucqKsaOkiXuz2kg',
    'database' => 'enermio_cz',
    'charset' => 'utf8mb4'
];


// OpenAI konfigurace
$openai_config = [
    'api_key' => getenv('OPENAI_API_KEY') ?: '',
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