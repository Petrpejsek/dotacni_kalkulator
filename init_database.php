<?php
/**
 * Inicializační skript pro databázi dotačního kalkulátoru
 * 
 * Tento skript vytvoří všechny potřebné tabulky pro ukládání dat z formuláře
 */

// Konfigurace databáze
$db_config = [
    'host' => 'localhost',
    'username' => 'root',
    'password' => '',
    'database' => 'dotacni_kalkulator_db',
    'charset' => 'utf8mb4'
];

try {
    // Připojení k MySQL serveru (bez specifikace databáze)
    $pdo = new PDO(
        "mysql:host={$db_config['host']};charset={$db_config['charset']}", 
        $db_config['username'], 
        $db_config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$db_config['charset']}"
        ]
    );
    
    echo "✅ Úspěšně připojeno k MySQL serveru\n";
    
    // Vytvoření databáze, pokud neexistuje
    $create_db_sql = "CREATE DATABASE IF NOT EXISTS `{$db_config['database']}` 
                      CHARACTER SET utf8mb4 COLLATE utf8mb4_czech_ci";
    $pdo->exec($create_db_sql);
    echo "✅ Databáze '{$db_config['database']}' připravena\n";
    
    // Přepnutí na vytvořenou databázi
    $pdo->exec("USE `{$db_config['database']}`");
    
    // SQL dotazy pro vytvoření tabulek
    $tables_sql = [
        
        // Hlavní tabulka pro žádosti o dotace
        'dotacni_kalkulator_zadosti' => "
            CREATE TABLE IF NOT EXISTS `dotacni_kalkulator_zadosti` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `uuid` varchar(36) NOT NULL UNIQUE,
                `typ_nemovitosti` varchar(100) NOT NULL,
                `rok_vystavby` varchar(50) NOT NULL,
                `datum_vytvoreni` timestamp DEFAULT CURRENT_TIMESTAMP,
                `datum_aktualizace` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                `stav` enum('nova', 'zpracovana', 'odeslana') DEFAULT 'nova',
                `celkova_dotace` varchar(50) DEFAULT NULL,
                `ip_adresa` varchar(45) DEFAULT NULL,
                `user_agent` text DEFAULT NULL,
                PRIMARY KEY (`id`),
                INDEX `idx_uuid` (`uuid`),
                INDEX `idx_datum_vytvoreni` (`datum_vytvoreni`),
                INDEX `idx_stav` (`stav`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci
        ",
        
        // Tabulka pro opatření u jednotlivých žádostí
        'dotacni_kalkulator_opatreni' => "
            CREATE TABLE IF NOT EXISTS `dotacni_kalkulator_opatreni` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `zadost_id` int(11) NOT NULL,
                `nazev_opatreni` varchar(100) NOT NULL,
                `detail_hodnota` text DEFAULT NULL,
                `detail_typ` varchar(50) DEFAULT NULL,
                `datum_pridani` timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `fk_zadost_opatreni` (`zadost_id`),
                CONSTRAINT `fk_zadost_opatreni` FOREIGN KEY (`zadost_id`) REFERENCES `dotacni_kalkulator_zadosti` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci
        ",
        
        // Tabulka pro lokalitu žádostí
        'dotacni_kalkulator_lokality' => "
            CREATE TABLE IF NOT EXISTS `dotacni_kalkulator_lokality` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `zadost_id` int(11) NOT NULL,
                `adresa` varchar(255) NOT NULL,
                `mesto` varchar(100) NOT NULL,
                `psc` varchar(10) NOT NULL,
                `datum_pridani` timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_zadost_lokalita` (`zadost_id`),
                KEY `idx_mesto` (`mesto`),
                KEY `idx_psc` (`psc`),
                CONSTRAINT `fk_zadost_lokalita` FOREIGN KEY (`zadost_id`) REFERENCES `dotacni_kalkulator_zadosti` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci
        ",
        
        // Tabulka pro sociální situaci
        'dotacni_kalkulator_socialni_situace' => "
            CREATE TABLE IF NOT EXISTS `dotacni_kalkulator_socialni_situace` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `zadost_id` int(11) NOT NULL,
                `typ_situace` varchar(50) NOT NULL,
                `datum_pridani` timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `fk_zadost_social` (`zadost_id`),
                KEY `idx_typ_situace` (`typ_situace`),
                CONSTRAINT `fk_zadost_social` FOREIGN KEY (`zadost_id`) REFERENCES `dotacni_kalkulator_zadosti` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci
        ",
        
        // Tabulka pro kontaktní údaje
        'dotacni_kalkulator_kontakty' => "
            CREATE TABLE IF NOT EXISTS `dotacni_kalkulator_kontakty` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `zadost_id` int(11) NOT NULL,
                `jmeno` varchar(100) NOT NULL,
                `email` varchar(150) NOT NULL,
                `telefon` varchar(20) DEFAULT NULL,
                `souhlas_gdpr` tinyint(1) NOT NULL DEFAULT 0,
                `datum_souhlasu` timestamp DEFAULT CURRENT_TIMESTAMP,
                `datum_pridani` timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_zadost_kontakt` (`zadost_id`),
                KEY `idx_email` (`email`),
                CONSTRAINT `fk_zadost_kontakt` FOREIGN KEY (`zadost_id`) REFERENCES `dotacni_kalkulator_zadosti` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci
        ",
        
        // Tabulka pro doplňující údaje
        'dotacni_kalkulator_doplnujici_udaje' => "
            CREATE TABLE IF NOT EXISTS `dotacni_kalkulator_doplnujici_udaje` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `zadost_id` int(11) NOT NULL,
                `klic` varchar(100) NOT NULL,
                `hodnota` text DEFAULT NULL,
                `datum_pridani` timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `fk_zadost_doplnujici` (`zadost_id`),
                KEY `idx_klic` (`klic`),
                CONSTRAINT `fk_zadost_doplnujici` FOREIGN KEY (`zadost_id`) REFERENCES `dotacni_kalkulator_zadosti` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci
        ",
        
        // Tabulka pro logy a auditní záznamy
        'dotacni_kalkulator_logy' => "
            CREATE TABLE IF NOT EXISTS `dotacni_kalkulator_logy` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `zadost_id` int(11) DEFAULT NULL,
                `akce` varchar(100) NOT NULL,
                `popis` text DEFAULT NULL,
                `ip_adresa` varchar(45) DEFAULT NULL,
                `user_agent` text DEFAULT NULL,
                `datum_akce` timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `fk_log_zadost` (`zadost_id`),
                KEY `idx_akce` (`akce`),
                KEY `idx_datum_akce` (`datum_akce`),
                CONSTRAINT `fk_log_zadost` FOREIGN KEY (`zadost_id`) REFERENCES `dotacni_kalkulator_zadosti` (`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci
        "
    ];
    
    // Vytvoření tabulek
    foreach ($tables_sql as $table_name => $sql) {
        try {
            $pdo->exec($sql);
            echo "✅ Tabulka '$table_name' úspěšně vytvořena/ověřena\n";
        } catch (PDOException $e) {
            echo "❌ Chyba při vytváření tabulky '$table_name': " . $e->getMessage() . "\n";
            throw $e;
        }
    }
    
    echo "\n🎉 Databáze byla úspěšně inicializována!\n";
    echo "📊 Vytvořeno " . count($tables_sql) . " tabulek\n";
    echo "🔗 Databáze: {$db_config['database']}\n";
    echo "🏠 Host: {$db_config['host']}\n\n";
    
    echo "📋 Vytvořené tabulky:\n";
    foreach (array_keys($tables_sql) as $table) {
        echo "  • $table\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Chyba databáze: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Obecná chyba: " . $e->getMessage() . "\n";
    exit(1);
}
?> 