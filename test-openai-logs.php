<?php
/**
 * Test endpoint pro prohlížení OpenAI logů
 * Slouží k ověření, že se logování OpenAI komunikace ukládá správně
 */

// Načtení konfigurace
$config = require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Připojení k databázi
    $pdo = new PDO(
        "mysql:host={$config['database']['host']};dbname={$config['database']['database']};charset={$config['database']['charset']}", 
        $config['database']['username'], 
        $config['database']['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    // Parametry
    $action = $_GET['action'] ?? 'list';
    $limit = intval($_GET['limit'] ?? 20);
    $zadost_id = $_GET['zadost_id'] ?? null;
    
    switch ($action) {
        case 'list':
            // Seznam všech OpenAI logů
            $where_clause = '';
            $params = [];
            
            if ($zadost_id) {
                $where_clause = 'WHERE zadost_id = ?';
                $params[] = $zadost_id;
            }
            
            $sql = "SELECT * FROM dotacni_kalkulator_logy 
                    $where_clause
                    ORDER BY datum_akce DESC 
                    LIMIT $limit";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $logs = $stmt->fetchAll();
            
            // Zkrácení příliš dlouhých requestů/responsů pro přehlednost
            foreach ($logs as &$log) {
                if (strlen($log['openai_request']) > 500) {
                    $log['openai_request_preview'] = substr($log['openai_request'], 0, 500) . '... [zkráceno]';
                    unset($log['openai_request']); // Odebereme celý request pro úsporu místa
                }
                if (strlen($log['openai_response']) > 500) {
                    $log['openai_response_preview'] = substr($log['openai_response'], 0, 500) . '... [zkráceno]';
                    unset($log['openai_response']); // Odebereme celou response pro úsporu místa
                }
            }
            
            echo json_encode([
                'success' => true,
                'count' => count($logs),
                'logs' => $logs
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;
            
        case 'detail':
            // Detail konkrétního logu
            $log_id = $_GET['id'] ?? null;
            
            if (!$log_id) {
                throw new Exception('Chybí ID logu');
            }
            
            $sql = "SELECT * FROM dotacni_kalkulator_logy WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$log_id]);
            $log = $stmt->fetch();
            
            if (!$log) {
                throw new Exception('Log nenalezen');
            }
            
            // Parsování JSON dat pro lepší zobrazení
            if ($log['openai_request']) {
                $log['openai_request_parsed'] = json_decode($log['openai_request'], true);
            }
            if ($log['openai_response']) {
                $log['openai_response_parsed'] = json_decode($log['openai_response'], true);
            }
            
            echo json_encode([
                'success' => true,
                'log' => $log
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;
            
        case 'stats':
            // Statistiky OpenAI logování
            
            // Celkový počet logů
            $total_logs = $pdo->query("SELECT COUNT(*) as count FROM dotacni_kalkulator_logy WHERE openai_request IS NOT NULL")->fetch()['count'];
            
            // Počet úspěšných/chybných requestů
            $success_count = $pdo->query("SELECT COUNT(*) as count FROM dotacni_kalkulator_logy WHERE openai_status = 'success'")->fetch()['count'];
            $error_count = $pdo->query("SELECT COUNT(*) as count FROM dotacni_kalkulator_logy WHERE openai_status = 'error'")->fetch()['count'];
            
            // Průměrná doba trvání
            $avg_duration = $pdo->query("SELECT AVG(openai_duration) as avg FROM dotacni_kalkulator_logy WHERE openai_duration IS NOT NULL")->fetch()['avg'];
            
            // Nejčastější akce
            $common_actions = $pdo->query("
                SELECT akce, COUNT(*) as count 
                FROM dotacni_kalkulator_logy 
                WHERE openai_request IS NOT NULL
                GROUP BY akce 
                ORDER BY count DESC 
                LIMIT 10
            ")->fetchAll();
            
            // Posledních 10 requestů
            $recent_logs = $pdo->query("
                SELECT id, akce, openai_status, openai_duration, datum_akce
                FROM dotacni_kalkulator_logy 
                WHERE openai_request IS NOT NULL
                ORDER BY datum_akce DESC 
                LIMIT 10
            ")->fetchAll();
            
            echo json_encode([
                'success' => true,
                'stats' => [
                    'total_logs' => $total_logs,
                    'success_count' => $success_count,
                    'error_count' => $error_count,
                    'success_rate' => $total_logs > 0 ? round(($success_count / $total_logs) * 100, 2) : 0,
                    'avg_duration_ms' => $avg_duration ? round($avg_duration, 2) : null,
                    'common_actions' => $common_actions,
                    'recent_logs' => $recent_logs
                ]
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;
            
        case 'clear':
            // Smazání starých logů (starších než 30 dní)
            $days = intval($_GET['days'] ?? 30);
            
            $sql = "DELETE FROM dotacni_kalkulator_logy 
                    WHERE datum_akce < DATE_SUB(NOW(), INTERVAL ? DAY)
                    AND openai_request IS NOT NULL";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$days]);
            $deleted_count = $stmt->rowCount();
            
            echo json_encode([
                'success' => true,
                'message' => "Smazáno $deleted_count starých OpenAI logů (starších než $days dní)"
            ]);
            break;
            
        default:
            throw new Exception('Neznámá akce: ' . $action);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenAI Logs Test</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .btn { 
            display: inline-block; 
            padding: 10px 20px; 
            margin: 5px; 
            background: #007cba; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            cursor: pointer; 
        }
        .btn:hover { background: #005a87; }
        .log-entry { 
            border: 1px solid #ddd; 
            margin: 10px 0; 
            padding: 15px; 
            border-radius: 4px; 
            background: #fafafa; 
        }
        .success { border-left: 4px solid #28a745; }
        .error { border-left: 4px solid #dc3545; }
        .info { border-left: 4px solid #17a2b8; }
        pre { 
            background: #f8f9fa; 
            padding: 10px; 
            border-radius: 4px; 
            overflow-x: auto; 
            font-size: 12px; 
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 20px 0; 
        }
        .stat-card { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 4px; 
            text-align: center; 
        }
        .stat-number { 
            font-size: 24px; 
            font-weight: bold; 
            color: #007cba; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 OpenAI Logs Test</h1>
        
        <div style="margin: 20px 0;">
            <a href="?action=stats" class="btn">📊 Statistiky</a>
            <a href="?action=list&limit=10" class="btn">📋 Posledních 10 logů</a>
            <a href="?action=list&limit=50" class="btn">📋 Posledních 50 logů</a>
            <a href="test-openai-logs.php" class="btn">🔄 Refresh</a>
        </div>
        
        <div id="content">
            <p>👆 Klikněte na tlačítka výše pro prohlížení OpenAI logů</p>
            
            <h3>📖 Jak používat:</h3>
            <ul>
                <li><strong>Statistiky:</strong> <code>?action=stats</code></li>
                <li><strong>Seznam logů:</strong> <code>?action=list&limit=20</code></li>
                <li><strong>Detail logu:</strong> <code>?action=detail&id=123</code></li>
                <li><strong>Logy pro žádost:</strong> <code>?action=list&zadost_id=456</code></li>
                <li><strong>Smazání starých:</strong> <code>?action=clear&days=30</code></li>
            </ul>
            
            <h3>🔍 Testování:</h3>
            <p>Pro vygenerování testovacích logů spusťte kalkulátor a dokončete formulář. 
            Následně se zde zobrazí všechny OpenAI komunikace včetně requestů a responsů.</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh každých 30 sekund pokud jsou zobrazeny logy
        if (window.location.search.includes('action=')) {
            setTimeout(() => {
                window.location.reload();
            }, 30000);
        }
    </script>
</body>
</html> 