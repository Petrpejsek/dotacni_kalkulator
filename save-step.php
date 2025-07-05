<?php
/**
 * AJAX endpoint pro ukládání průběžných dat z kalkulátoru
 * Ukládá data po každém dokončeném kroku
 */

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

try {
    // Získání dat z POST requestu
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Neplatná JSON data');
    }
    
    // Validace povinných polí
    if (!isset($data['action'])) {
        throw new Exception('Chybí pole "action"');
    }
    
    $action = $data['action'];
    
    // Inicializace databáze
    $db = new DotacniKalkulatorDB($config['database']);
    
    switch ($action) {
        case 'create_request':
            // Vytvoření nové žádosti při prvním kroku
            $result = createNewRequest($db, $data);
            break;
            
        case 'update_step':
            // Aktualizace dat pro konkrétní krok
            $result = updateStepData($db, $data);
            break;
            
        case 'load_request':
            // Načtení existující žádosti podle UUID
            $result = loadRequestData($db, $data);
            break;
            
        default:
            throw new Exception('Neznámá akce: ' . $action);
    }
    
    // Úspěšná odpověď
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
    
} catch (Exception $e) {
    error_log('Chyba v save-step.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Vytvoření nové žádosti při prvním kroku
 */
function createNewRequest($db, $data) {
    if (!isset($data['typ_nemovitosti'])) {
        throw new Exception('Chybí typ nemovitosti');
    }
    
    // Získání IP adresy a User Agent
    $ip_address = getClientIP();
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';

    $utm_zdroj = NULL;
    if (isset($_SESSION["sledovac"])) {
        $utm_zdroj = $_SESSION["sledovac"];
    }

    // Vytvoření UUID
    $uuid = generateUUID();
    
    // Vložení základního záznamu
    $pdo = $db->getPDO();
    $sql = "INSERT INTO dotacni_kalkulator_zadosti 
            (uuid, typ_nemovitosti, step, data_json, ip_adresa, user_agent, utm_zdroj) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $initial_data = [
        'typ_nemovitosti' => $data['typ_nemovitosti'],
        'step' => 1
    ];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $uuid,
        $data['typ_nemovitosti'],
        1,
        json_encode($initial_data, JSON_UNESCAPED_UNICODE),
        $ip_address,
        $user_agent,
        $utm_zdroj
    ]);
    
    $zadost_id = $pdo->lastInsertId();
    
    // Zápis do logu
    $log_sql = "INSERT INTO dotacni_kalkulator_logy 
                (zadost_id, akce, popis, ip_adresa, user_agent) 
                VALUES (?, ?, ?, ?, ?)";
    $log_stmt = $pdo->prepare($log_sql);
    $log_stmt->execute([
        $zadost_id,
        'zadost_vytvorena',
        'Vytvořena nová žádost v kroku 1: ' . $data['typ_nemovitosti'],
        $ip_address,
        $user_agent
    ]);
    
    return [
        'uuid' => $uuid,
        'zadost_id' => $zadost_id,
        'step' => 1,
        'message' => 'Žádost úspěšně vytvořena'
    ];
}

/**
 * Aktualizace dat pro konkrétní krok
 */
function updateStepData($db, $data) {
    if (!isset($data['uuid']) || !isset($data['step']) || !isset($data['step_data'])) {
        throw new Exception('Chybí povinná pole: uuid, step, step_data');
    }
    
    $uuid = $data['uuid'];
    $step = intval($data['step']);
    $step_data = $data['step_data'];
    
    $pdo = $db->getPDO();
    
    // Načtení současných dat
    $select_sql = "SELECT id, data_json FROM dotacni_kalkulator_zadosti WHERE uuid = ?";
    $select_stmt = $pdo->prepare($select_sql);
    $select_stmt->execute([$uuid]);
    $zadost = $select_stmt->fetch();
    
    if (!$zadost) {
        throw new Exception('Žádost s UUID ' . $uuid . ' nebyla nalezena');
    }
    
    // Sloučení současných dat s novými daty
    $current_data = json_decode($zadost['data_json'], true) ?? [];
    $current_data = array_merge($current_data, $step_data);
    $current_data['step'] = $step;
    $current_data['last_update'] = date('Y-m-d H:i:s');
    
    // Aktualizace záznamu
    $update_sql = "UPDATE dotacni_kalkulator_zadosti 
                   SET step = ?, data_json = ?, datum_aktualizace = CURRENT_TIMESTAMP 
                   WHERE uuid = ?";
    $update_stmt = $pdo->prepare($update_sql);
    $update_stmt->execute([
        $step,
        json_encode($current_data, JSON_UNESCAPED_UNICODE),
        $uuid
    ]);
    
    // Zápis do logu
    $log_sql = "INSERT INTO dotacni_kalkulator_logy 
                (zadost_id, akce, popis, ip_adresa, user_agent) 
                VALUES (?, ?, ?, ?, ?)";
    $log_stmt = $pdo->prepare($log_sql);
    $log_stmt->execute([
        $zadost['id'],
        'krok_aktualizovan',
        "Aktualizován krok $step",
        getClientIP(),
        $_SERVER['HTTP_USER_AGENT'] ?? ''
    ]);
    
    return [
        'uuid' => $uuid,
        'step' => $step,
        'data' => $current_data,
        'message' => "Krok $step úspěšně uložen"
    ];
}

/**
 * Načtení existující žádosti podle UUID
 */
function loadRequestData($db, $data) {
    if (!isset($data['uuid'])) {
        throw new Exception('Chybí UUID');
    }
    
    $uuid = $data['uuid'];
    $pdo = $db->getPDO();
    
    $sql = "SELECT * FROM dotacni_kalkulator_zadosti WHERE uuid = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$uuid]);
    $zadost = $stmt->fetch();
    
    if (!$zadost) {
        throw new Exception('Žádost s UUID ' . $uuid . ' nebyla nalezena');
    }
    
    $form_data = json_decode($zadost['data_json'], true) ?? [];
    
    return [
        'uuid' => $uuid,
        'step' => $zadost['step'],
        'typ_nemovitosti' => $zadost['typ_nemovitosti'],
        'data' => $form_data,
        'created' => $zadost['datum_vytvoreni'],
        'updated' => $zadost['datum_aktualizace']
    ];
}

/**
 * Získání IP adresy klienta
 */
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

/**
 * Generování UUID
 */
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
?> 