<?php
/**
 * Zpracování formuláře dotačního kalkulátoru
 * Přijímá data z formuláře a vrací výsledky od OpenAI asistenta
 */

// HTTP hlavičky
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Zpracování OPTIONS požadavku (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Pouze POST metoda je povolená
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Načtení konfigurace a databázové třídy
$config = require_once 'config.php';
require_once 'database_handler.php';

// Získání konfigurací
$db_config = $config['database'];
$openai_api_key = $config['openai']['api_key'];
$assistant_id = $config['openai']['assistant_id'];

// Globální proměnné pro logování
$db_connection = null;
$current_zadost_id = null;

try {
    // Inicializace databáze
    $db_handler = new DotacniKalkulatorDB($db_config);
    $db_connection = $db_handler->getPDO();
} catch (Exception $e) {
    error_log("Chyba připojení k databázi: " . $e->getMessage());
}

// Funkce pro logování OpenAI komunikace
function logOpenAIRequest($url, $request_data, $response_data, $thread_id = null, $run_id = null, $status = 'success', $duration = null) {
    global $db_connection, $current_zadost_id;
    
    if (!$db_connection) {
        error_log("Databáze není dostupná pro logování OpenAI");
        return;
    }
    
    try {
        // Získání IP adresy a User Agent
        $ip_address = getClientIP();
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // Určení akce podle URL
        $action = 'openai_request';
        if (strpos($url, '/threads/') !== false && strpos($url, '/messages') !== false) {
            $action = 'openai_create_message';
        } elseif (strpos($url, '/threads/') !== false && strpos($url, '/runs') !== false) {
            $action = 'openai_create_run';
        } elseif (strpos($url, '/threads') !== false && strpos($url, '/messages') === false) {
            $action = 'openai_create_thread';
        }
        
        // Příprava dat pro logování
        $request_json = is_string($request_data) ? $request_data : json_encode($request_data, JSON_UNESCAPED_UNICODE);
        $response_json = is_string($response_data) ? $response_data : json_encode($response_data, JSON_UNESCAPED_UNICODE);
        
        // Zkrácení příliš dlouhých dat pro databázi
        if (strlen($request_json) > 65000) {
            $request_json = substr($request_json, 0, 65000) . '... [zkráceno]';
        }
        if (strlen($response_json) > 65000) {
            $response_json = substr($response_json, 0, 65000) . '... [zkráceno]';
        }
        
        // Vložení do databáze
        $sql = "INSERT INTO dotacni_kalkulator_logy 
                (zadost_id, akce, popis, ip_adresa, user_agent, openai_request, openai_response, openai_thread_id, openai_run_id, openai_status, openai_duration) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db_connection->prepare($sql);
        $stmt->execute([
            $current_zadost_id,
            $action,
            "OpenAI API call: $url",
            $ip_address,
            $user_agent,
            $request_json,
            $response_json,
            $thread_id,
            $run_id,
            $status,
            $duration
        ]);
        
        error_log("🗃️ OpenAI komunikace zalogována: $action");
        
    } catch (Exception $e) {
        error_log("Chyba při logování OpenAI komunikace: " . $e->getMessage());
    }
}

// Funkce pro komunikaci s OpenAI API
function callOpenAI($url, $data, $api_key) {
    $start_time = microtime(true);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $api_key,
        'OpenAI-Beta: assistants=v2'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $duration = (microtime(true) - $start_time) * 1000; // v milisekundách
    
    curl_close($ch);
    
    if ($response === false) {
        $error_data = ['error' => 'cURL error', 'code' => $http_code];
        logOpenAIRequest($url, $data, $error_data, null, null, 'error', $duration);
        throw new Exception("cURL error occurred");
    }
    
    $decoded_response = json_decode($response, true);
    
    if ($http_code !== 200) {
        logOpenAIRequest($url, $data, $decoded_response, null, null, 'error', $duration);
        throw new Exception("OpenAI API error: HTTP $http_code - $response");
    }
    
    // Úspěšné logování
    $thread_id = $decoded_response['id'] ?? null;
    $run_id = $decoded_response['id'] ?? null;
    logOpenAIRequest($url, $data, $decoded_response, $thread_id, $run_id, 'success', $duration);
    
    return $decoded_response;
}

// Funkce pro GET request na OpenAI API
function getOpenAI($url, $api_key) {
    $start_time = microtime(true);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $api_key,
        'OpenAI-Beta: assistants=v2'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $duration = (microtime(true) - $start_time) * 1000; // v milisekundách
    
    curl_close($ch);
    
    if ($response === false) {
        $error_data = ['error' => 'cURL error', 'code' => $http_code];
        logOpenAIRequest($url, 'GET', $error_data, null, null, 'error', $duration);
        throw new Exception("cURL error occurred");
    }
    
    $decoded_response = json_decode($response, true);
    
    if ($http_code !== 200) {
        logOpenAIRequest($url, 'GET', $decoded_response, null, null, 'error', $duration);
        throw new Exception("OpenAI API error: HTTP $http_code - $response");
    }
    
    // Úspěšné logování
    $thread_id = null;
    $run_id = null;
    
    // Extrakce ID z URL pro lepší logování
    if (preg_match('/\/threads\/([^\/]+)/', $url, $matches)) {
        $thread_id = $matches[1];
    }
    if (preg_match('/\/runs\/([^\/]+)/', $url, $matches)) {
        $run_id = $matches[1];
    }
    
    logOpenAIRequest($url, 'GET', $decoded_response, $thread_id, $run_id, 'success', $duration);
    
    return $decoded_response;
}

// Funkce pro čekání na dokončení běhu
function waitForRunCompletion($thread_id, $run_id, $api_key) {
    $max_wait_time = 180; // 3 minuty
    $start_time = time();
    
    while (time() - $start_time < $max_wait_time) {
        $run_status = getOpenAI("https://api.openai.com/v1/threads/$thread_id/runs/$run_id", $api_key);
        
        if ($run_status['status'] === 'completed') {
            return $run_status;
        }
        
        if (in_array($run_status['status'], ['failed', 'cancelled', 'expired'])) {
            throw new Exception("OpenAI run failed with status: " . $run_status['status']);
        }
        
        sleep(2);
    }
    
    throw new Exception("Vypršel časový limit pro zpracování odpovědi asistenta");
}

// Funkce pro zpracování formulářových dat s asistentem
function processWithAssistant($form_data, $api_key, $assistant_id) {
    global $current_zadost_id;
    
    $process_start_time = microtime(true);
    
    try {
        // Logování začátku procesu
        if ($current_zadost_id) {
            logOpenAIRequest('process_start', $form_data, ['status' => 'starting'], null, null, 'info', null);
        }
        
        // 1. Vytvoření nového vlákna
        $thread = callOpenAI('https://api.openai.com/v1/threads', [], $api_key);
        error_log("Vytvořeno nové vlákno s ID: " . $thread['id']);

        // 2. Přidání zprávy do vlákna
        $message_data = [
            'role' => 'user',
            'content' => json_encode($form_data)
        ];

        callOpenAI("https://api.openai.com/v1/threads/{$thread['id']}/messages", $message_data, $api_key);
        error_log("Zpráva s daty formuláře byla přidána do vlákna");

        // 3. Spuštění asistenta
        $run_data = ['assistant_id' => $assistant_id];
        $run = callOpenAI("https://api.openai.com/v1/threads/{$thread['id']}/runs", $run_data, $api_key);
        error_log("Spuštěn asistent s ID: " . $run['id']);

        // 4. Čekání na dokončení
        $run_status = waitForRunCompletion($thread['id'], $run['id'], $api_key);

        if ($run_status['status'] === 'completed') {
            // 5. Získání zpráv z vlákna
            $messages = getOpenAI("https://api.openai.com/v1/threads/{$thread['id']}/messages", $api_key);

            foreach ($messages['data'] as $message) {
                if ($message['role'] === 'assistant') {
                    $raw_text = $message['content'][0]['text']['value'];
                    error_log("Získána odpověď od asistenta");

                    // Parsování JSON z odpovědi
                    $parsed_data = parseAssistantResponse($raw_text);
                    
                    // Logování úspěšného dokončení
                    $total_duration = (microtime(true) - $process_start_time) * 1000;
                    if ($current_zadost_id) {
                        logOpenAIRequest('process_complete', $form_data, $parsed_data, $thread['id'], $run['id'], 'success', $total_duration);
                    }

                    return $parsed_data;
                }
            }

            throw new Exception("Nenalezena odpověď asistenta");
        } else {
            throw new Exception("Asistent neskončil úspěšně. Status: " . $run_status['status']);
        }

    } catch (Exception $e) {
        error_log("Chyba při komunikaci s asistentem: " . $e->getMessage());
        
        // Logování chyby
        $total_duration = (microtime(true) - $process_start_time) * 1000;
        if ($current_zadost_id) {
            logOpenAIRequest('process_error', $form_data, ['error' => $e->getMessage()], null, null, 'error', $total_duration);
        }
        
        throw new Exception("Chyba při komunikaci s asistentem: " . $e->getMessage());
    }
}

// Funkce pro parsování odpovědi asistenta
function parseAssistantResponse($raw_text) {
    // Pokus 1: Přímý JSON parsing
    $parsed_data = json_decode($raw_text, true);
    if ($parsed_data !== null) {
        error_log("✅ JSON parsován přímo");
        return validateAndFixResponse($parsed_data);
    }

    // Pokus 2: Extrakce z markdown code block
    if (preg_match('/```(?:json)?\s*(.*?)\s*```/s', $raw_text, $matches)) {
        $parsed_data = json_decode(trim($matches[1]), true);
        if ($parsed_data !== null) {
            error_log("✅ JSON extrahovány z markdown bloku");
            return validateAndFixResponse($parsed_data);
        }
    }

    // Pokus 3: Hledání JSON objektu v textu
    $json_start = strpos($raw_text, '{');
    $json_end = strrpos($raw_text, '}');

    if ($json_start !== false && $json_end !== false && $json_end > $json_start) {
        $json_string = substr($raw_text, $json_start, $json_end - $json_start + 1);
        $parsed_data = json_decode($json_string, true);
        if ($parsed_data !== null) {
            error_log("✅ JSON nalezen a parsován z textu");
            return validateAndFixResponse($parsed_data);
        }
    }

    throw new Exception("Nelze parsovat JSON z odpovědi. Původní text: " . $raw_text);
}

// Funkce pro validaci a opravu odpovědi
function validateAndFixResponse($data) {
    if (!is_array($data)) {
        throw new Exception('Parsovaná data nejsou validní objekt');
    }

    // Validace požadovaných polí
    $required_fields = ['intro_text', 'doporučene_dotace', 'celková_dotace'];

    foreach ($required_fields as $field) {
        if (!isset($data[$field])) {
            error_log("⚠️ Chybí povinné pole: $field");
            // Přidáme výchozí hodnoty
            switch ($field) {
                case 'intro_text':
                    $data[$field] = "Výsledky dotačního kalkulátoru";
                    break;
                case 'doporučene_dotace':
                    $data[$field] = [];
                    break;
                case 'celková_dotace':
                    $data[$field] = "0 Kč";
                    break;
            }
        }
    }

    error_log("✅ Úspěšně zpracována odpověď asistenta: " . json_encode($data));
    return $data;
}

// Funkce pro získání IP adresy klienta
function getClientIP() {
    $ip_fields = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 
                 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
    
    foreach ($ip_fields as $field) {
        if (!empty($_SERVER[$field])) {
            $ip = $_SERVER[$field];
            if (strpos($ip, ',') !== false) {
                $ip = trim(explode(',', $ip)[0]);
            }
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

// Validace vstupních dat
function validateFormData($data) {
    if (!$data) {
        throw new Exception('Nebyla poskytnuta žádná data');
    }

    // Kontrola povinných polí
    $required_fields = ['typ_nemovitosti', 'rok_vystavby', 'opatreni', 'lokalita', 'kontakt'];

    foreach ($required_fields as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Chybí povinné pole: $field");
        }
    }

    // Kontrola typu nemovitosti
    if (empty($data['typ_nemovitosti'])) {
        throw new Exception('Musí být vybrán typ nemovitosti');
    }

    // Kontrola roku výstavby
    if (empty($data['rok_vystavby'])) {
        throw new Exception('Musí být vybrán rok výstavby');
    }

    // Kontrola opatření
    if (!is_array($data['opatreni'])) {
        throw new Exception('Pole "opatreni" musí být seznam');
    }

    if (count($data['opatreni']) === 0) {
        throw new Exception('Musí být vybráno alespoň jedno opatření');
    }

    // Kontrola lokality
    if (!is_array($data['lokalita'])) {
        throw new Exception('Lokalita musí být objekt s adresou, městem a PSČ');
    }

    $locality_fields = ['adresa', 'mesto', 'psc'];
    foreach ($locality_fields as $field) {
        if (!isset($data['lokalita'][$field]) || empty(trim($data['lokalita'][$field]))) {
            throw new Exception("Chybí nebo je prázdné pole lokality: $field");
        }
    }

    // Kontrola kontaktních údajů
    if (!is_array($data['kontakt'])) {
        throw new Exception('Kontaktní údaje musí být objekt');
    }

    $contact_fields = ['jmeno', 'email'];
    foreach ($contact_fields as $field) {
        if (!isset($data['kontakt'][$field]) || empty(trim($data['kontakt'][$field]))) {
            throw new Exception("Chybí nebo je prázdné kontaktní pole: $field");
        }
    }

    // Kontrola e-mailu
    if (!filter_var($data['kontakt']['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Neplatný formát e-mailové adresy');
    }

    // Kontrola souhlasu
    if (!isset($data['kontakt']['souhlas']) || $data['kontakt']['souhlas'] !== true) {
        throw new Exception('Musí být udělen souhlas se zpracováním osobních údajů');
    }

    // Kontrola sociální situace (volitelné, ale pokud existuje, musí být pole)
    if (isset($data['socialni_situace']) && !is_array($data['socialni_situace'])) {
        throw new Exception('Sociální situace musí být seznam hodnot');
    }

    return true;
}

// Hlavní zpracování
try {
    // Získání dat z POST requestu
    $input = file_get_contents('php://input');
    $form_data = json_decode($input, true);

    if (!$form_data) {
        throw new Exception('Neplatné JSON data');
    }

    // Validace dat
    validateFormData($form_data);

    // Uložení dat do databáze
    $zadost_id = $db_handler->storeFormData($form_data);
    $current_zadost_id = $zadost_id; // Nastavení pro logování
    
    // Zpracování dat pomocí OpenAI asistenta
    $result = processWithAssistant($form_data, $openai_api_key, $assistant_id);

    // Aktualizace celkové dotace v databázi
    $db_handler->updateTotalDotace($zadost_id, $result['celková_dotace'] ?? '0 Kč');

    // Úspěšná odpověď
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);

} catch (Exception $e) {
    error_log('Chyba v store-form.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>