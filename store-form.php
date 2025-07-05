<?php
// Načtení konfigurace a databázové třídy
$config = require_once 'config.php';
require_once 'database_handler.php';

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

// Načtení konfigurace
$openai_api_key = $config['openai']['api_key'];
$assistant_id = $config['openai']['assistant_id'];

// Funkce pro komunikaci s OpenAI API
function callOpenAI($url, $data, $api_key) {
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
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        throw new Exception("OpenAI API error: HTTP $http_code - $response");
    }

    return json_decode($response, true);
}

// Funkce pro GET request na OpenAI API
function getOpenAI($url, $api_key) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $api_key,
        'OpenAI-Beta: assistants=v2'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        throw new Exception("OpenAI API error: HTTP $http_code - $response");
    }

    return json_decode($response, true);
}

// Funkce pro čekání na dokončení běhu asistenta
function waitForRunCompletion($thread_id, $run_id, $api_key) {
    $timeout = 15 * 60; // 15 minut
    $start_time = time();

    while (time() - $start_time < $timeout) {
        $run_status = getOpenAI("https://api.openai.com/v1/threads/$thread_id/runs/$run_id", $api_key);

        error_log("Stav běhu asistenta: " . $run_status['status']);

        if ($run_status['status'] === 'completed') {
            return $run_status;
        }

        if ($run_status['status'] === 'failed') {
            throw new Exception("Asistent selhal: " . json_encode($run_status));
        }

        if ($run_status['status'] === 'requires_action') {
            throw new Exception("Asistent vyžaduje další akci, což není podporováno");
        }

        sleep(1);
    }

    throw new Exception("Vypršel časový limit pro zpracování odpovědi asistenta");
}

// Funkce pro zpracování formulářových dat s asistentem
function processWithAssistant($form_data, $api_key, $assistant_id) {
    try {
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

                    return $parsed_data;
                }
            }

            throw new Exception("Nenalezena odpověď asistenta");
        } else {
            throw new Exception("Asistent neskončil úspěšně. Status: " . $run_status['status']);
        }

    } catch (Exception $e) {
        error_log("Chyba při komunikaci s asistentem: " . $e->getMessage());
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
        throw new Exception('Neplatná JSON data');
    }

    error_log('Přijata data formuláře: ' . json_encode($form_data));

    // Validace dat
    validateFormData($form_data);

    // Inicializace databáze (pokud je povolena)
    $db = null;
    $zadost_id = null;

    if ($config['app']['enable_database_logging']) {
        try {
            $db = new DotacniKalkulatorDB($config['database']);

            // Uložení formulářových dat do databáze
            $db_result = $db->ulozitFormularData($form_data);
            $zadost_id = $db_result['zadost_id'];

            error_log("✅ Data uložena do databáze s ID: $zadost_id, UUID: {$db_result['uuid']}");
        } catch (Exception $e) {
            error_log("⚠️ Chyba při ukládání do databáze: " . $e->getMessage());
            // Pokračujeme i bez databáze
        }
    }

    // Zpracování s asistentem
    $result = processWithAssistant($form_data, $openai_api_key, $assistant_id);

    // Aktualizace celkové dotace v databázi
    if ($db && $zadost_id && isset($result['celková_dotace'])) {
        try {
            $db->aktualizovatCelkouDotaci($zadost_id, $result['celková_dotace']);
            error_log("✅ Aktualizována celková dotace v databázi: {$result['celková_dotace']}");
        } catch (Exception $e) {
            error_log("⚠️ Chyba při aktualizaci celkové dotace: " . $e->getMessage());
        }
    }

    // Odeslání odpovědi s přidaným UUID pro tracking
    $response = [
        'success' => true,
        'data' => $result
    ];

    if ($db && isset($db_result['uuid'])) {
        $response['tracking_uuid'] = $db_result['uuid'];
    }

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log('Chyba: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>