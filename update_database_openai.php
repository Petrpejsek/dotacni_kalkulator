<?php
/**
 * Aktualizace databáze - přidání sloupců pro OpenAI logování
 */

// Načtení konfigurace
$config = require_once 'config.php';

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
    
    echo "✅ Připojeno k databázi\n";
    
    // Seznam nových sloupců pro OpenAI logování
    $new_columns = [
        'openai_request' => "ADD COLUMN openai_request TEXT DEFAULT NULL AFTER user_agent",
        'openai_response' => "ADD COLUMN openai_response TEXT DEFAULT NULL AFTER openai_request",
        'openai_thread_id' => "ADD COLUMN openai_thread_id VARCHAR(100) DEFAULT NULL AFTER openai_response",
        'openai_run_id' => "ADD COLUMN openai_run_id VARCHAR(100) DEFAULT NULL AFTER openai_thread_id",
        'openai_status' => "ADD COLUMN openai_status VARCHAR(20) DEFAULT NULL AFTER openai_run_id",
        'openai_duration' => "ADD COLUMN openai_duration INT DEFAULT NULL AFTER openai_status"
    ];
    
    foreach ($new_columns as $column_name => $alter_sql) {
        // Kontrola, jestli sloupec už existuje
        $check_column = "SHOW COLUMNS FROM dotacni_kalkulator_logy LIKE '$column_name'";
        $result = $pdo->query($check_column);
        
        if ($result->rowCount() == 0) {
            // Sloupec neexistuje, přidáme ho
            $full_sql = "ALTER TABLE dotacni_kalkulator_logy $alter_sql";
            $pdo->exec($full_sql);
            echo "✅ Přidán sloupec '$column_name' do tabulky dotacni_kalkulator_logy\n";
        } else {
            echo "ℹ️ Sloupec '$column_name' už existuje\n";
        }
    }
    
    // Přidání indexů pro rychlejší vyhledávání
    $indexes = [
        'idx_openai_thread_id' => "ADD INDEX idx_openai_thread_id (openai_thread_id)",
        'idx_openai_status' => "ADD INDEX idx_openai_status (openai_status)"
    ];
    
    foreach ($indexes as $index_name => $index_sql) {
        try {
            $pdo->exec("ALTER TABLE dotacni_kalkulator_logy $index_sql");
            echo "✅ Přidán index '$index_name'\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "ℹ️ Index '$index_name' už existuje\n";
            } else {
                echo "⚠️ Chyba při vytváření indexu '$index_name': " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n🎉 Databáze úspěšně aktualizována pro OpenAI logování!\n";
    echo "📊 Nové sloupce pro OpenAI:\n";
    echo "  • openai_request - JSON request poslaný do OpenAI\n";
    echo "  • openai_response - JSON response z OpenAI\n";
    echo "  • openai_thread_id - ID vlákna OpenAI\n";
    echo "  • openai_run_id - ID spuštění OpenAI\n";
    echo "  • openai_status - Status komunikace (success/error)\n";
    echo "  • openai_duration - Doba trvání komunikace v ms\n";
    
} catch (PDOException $e) {
    echo "❌ Chyba databáze: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Obecná chyba: " . $e->getMessage() . "\n";
    exit(1);
}
?> 