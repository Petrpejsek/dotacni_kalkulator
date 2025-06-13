<?php
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

// Načtení OpenAI API klíče z environment nebo config
$openai_api_key = getenv('OPENAI_API_KEY') ?: 'your-openai-api-key-here';
$assistant_id = 'asst_TND8x7S6HXvVWTTWRhAPfp75';

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
    
    $required_fields = ['typ_nemovitosti', 'opatreni'];
    
    foreach ($required_fields as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Chybí povinné pole: $field");
        }
    }
    
    if (!is_array($data['opatreni'])) {
        throw new Exception('Pole "opatreni" musí být seznam');
    }
    
    if (count($data['opatreni']) === 0) {
        throw new Exception('Musí být vybráno alespoň jedno opatření');
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
    
    // Zpracování s asistentem
    $result = processWithAssistant($form_data, $openai_api_key, $assistant_id);
    
    // Odeslání odpovědi
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
    
} catch (Exception $e) {
    error_log('Chyba: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 