<?php
/**
 * Aktualizace databáze - přidání sloupce "step" pro sledování kroku kalkulátoru
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
    
    // Kontrola, jestli sloupec "step" už existuje
    $check_column = "SHOW COLUMNS FROM dotacni_kalkulator_zadosti LIKE 'step'";
    $result = $pdo->query($check_column);
    
    if ($result->rowCount() == 0) {
        // Sloupec neexistuje, přidáme ho
        $add_column_sql = "ALTER TABLE dotacni_kalkulator_zadosti 
                          ADD COLUMN step int(2) DEFAULT 1 AFTER rok_vystavby";
        
        $pdo->exec($add_column_sql);
        echo "✅ Přidán sloupec 'step' do tabulky dotacni_kalkulator_zadosti\n";
        
        // Přidáme index pro rychlejší vyhledávání
        $add_index_sql = "ALTER TABLE dotacni_kalkulator_zadosti 
                         ADD INDEX idx_step (step)";
        $pdo->exec($add_index_sql);
        echo "✅ Přidán index pro sloupec 'step'\n";
        
    } else {
        echo "ℹ️ Sloupec 'step' už existuje\n";
    }
    
    // Kontrola, jestli sloupec "data_json" existuje pro ukládání průběžných dat
    $check_data_column = "SHOW COLUMNS FROM dotacni_kalkulator_zadosti LIKE 'data_json'";
    $result = $pdo->query($check_data_column);
    
    if ($result->rowCount() == 0) {
        // Přidáme sloupec pro ukládání průběžných dat jako JSON
        $add_data_column_sql = "ALTER TABLE dotacni_kalkulator_zadosti 
                               ADD COLUMN data_json TEXT DEFAULT NULL AFTER step";
        
        $pdo->exec($add_data_column_sql);
        echo "✅ Přidán sloupec 'data_json' pro ukládání průběžných dat\n";
    } else {
        echo "ℹ️ Sloupec 'data_json' už existuje\n";
    }
    
    echo "\n🎉 Databáze úspěšně aktualizována!\n";
    echo "📊 Nové sloupce:\n";
    echo "  • step - sledování aktuálního kroku (1-7)\n";
    echo "  • data_json - ukládání průběžných dat z formuláře\n";
    
} catch (PDOException $e) {
    echo "❌ Chyba databáze: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Obecná chyba: " . $e->getMessage() . "\n";
    exit(1);
}
?> 