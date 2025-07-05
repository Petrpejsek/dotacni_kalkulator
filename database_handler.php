<?php
/**
 * Třída pro zpracování a ukládání dat z dotačního kalkulátoru
 */
class DotacniKalkulatorDB {
    
    private $pdo;
    
    public function __construct($db_config) {
        try {
            $dsn = "mysql:host={$db_config['host']};dbname={$db_config['database']};charset={$db_config['charset']}";
            $this->pdo = new PDO($dsn, $db_config['username'], $db_config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$db_config['charset']}"
            ]);
        } catch (PDOException $e) {
            throw new Exception("Chyba připojení k databázi: " . $e->getMessage());
        }
    }
    
    /**
     * Uložení kompletních dat z formuláře
     */
    public function ulozitFormularData($form_data) {
        try {
            $this->pdo->beginTransaction();
            
            // Generování UUID pro žádost
            $uuid = $this->generateUUID();
            
            // Získání IP adresy a User Agent
            $ip_address = $this->getClientIP();
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            
            // 1. Uložení hlavní žádosti
            $zadost_id = $this->ulozitHlavniZadost($uuid, $form_data, $ip_address, $user_agent);
            
            // 2. Uložení opatření
            if (isset($form_data['opatreni']) && is_array($form_data['opatreni'])) {
                $this->ulozitOpatreni($zadost_id, $form_data['opatreni'], $form_data['detaily_opatreni'] ?? []);
            }
            
            // 3. Uložení lokality
            if (isset($form_data['lokalita'])) {
                $this->ulozitLokalitu($zadost_id, $form_data['lokalita']);
            }
            
            // 4. Uložení sociální situace
            if (isset($form_data['socialni_situace']) && is_array($form_data['socialni_situace'])) {
                $this->ulozitSocialniSituaci($zadost_id, $form_data['socialni_situace']);
            }
            
            // 5. Uložení kontaktních údajů
            if (isset($form_data['kontakt'])) {
                $this->ulozitKontakt($zadost_id, $form_data['kontakt']);
            }
            
            // 6. Uložení doplňujících údajů
            if (isset($form_data['doplnujici_udaje']) && is_array($form_data['doplnujici_udaje'])) {
                $this->ulozitDoplnujiciUdaje($zadost_id, $form_data['doplnujici_udaje']);
            }
            
            // 7. Zápis logu
            $this->zapisLog($zadost_id, 'formular_odeslan', 'Uložení nové žádosti z formuláře', $ip_address, $user_agent);
            
            $this->pdo->commit();
            
            return [
                'success' => true,
                'zadost_id' => $zadost_id,
                'uuid' => $uuid,
                'message' => 'Data byla úspěšně uložena'
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw new Exception("Chyba při ukládání dat: " . $e->getMessage());
        }
    }
    
    /**
     * Uložení hlavní žádosti
     */
    private function ulozitHlavniZadost($uuid, $form_data, $ip_address, $user_agent) {

        $utm_zdroj = NULL;
        if (isset($_SESSION["sledovac"])) {
            $utm_zdroj = $_SESSION["sledovac"];
        }


        $sql = "INSERT INTO dotacni_kalkulator_zadosti 
                (uuid, typ_nemovitosti, rok_vystavby, ip_adresa, user_agent, utm_zdroj) 
                VALUES (?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $uuid,
            $form_data['typ_nemovitosti'],
            $form_data['rok_vystavby'] ?? '',
            $ip_address,
            $user_agent,
            $utm_zdroj,
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Uložení opatření a jejich detailů
     */
    private function ulozitOpatreni($zadost_id, $opatreni, $detaily = []) {
        $sql = "INSERT INTO dotacni_kalkulator_opatreni 
                (zadost_id, nazev_opatreni, detail_hodnota, detail_typ) 
                VALUES (?, ?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($opatreni as $opatreni_nazev) {
            $detail_hodnota = null;
            $detail_typ = null;
            
            // Pokud existují detaily pro toto opatření
            if (isset($detaily[$opatreni_nazev])) {
                $detail = $detaily[$opatreni_nazev];
                
                if (is_array($detail)) {
                    $detail_hodnota = json_encode($detail, JSON_UNESCAPED_UNICODE);
                    $detail_typ = 'array';
                } else {
                    $detail_hodnota = (string)$detail;
                    $detail_typ = 'string';
                }
            }
            
            $stmt->execute([
                $zadost_id,
                $opatreni_nazev,
                $detail_hodnota,
                $detail_typ
            ]);
        }
    }
    
    /**
     * Uložení lokality
     */
    private function ulozitLokalitu($zadost_id, $lokalita) {
        $sql = "INSERT INTO dotacni_kalkulator_lokality 
                (zadost_id, adresa, mesto, psc) 
                VALUES (?, ?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $zadost_id,
            $lokalita['adresa'] ?? '',
            $lokalita['mesto'] ?? '',
            $lokalita['psc'] ?? ''
        ]);
    }
    
    /**
     * Uložení sociální situace
     */
    private function ulozitSocialniSituaci($zadost_id, $socialni_situace) {
        $sql = "INSERT INTO dotacni_kalkulator_socialni_situace 
                (zadost_id, typ_situace) 
                VALUES (?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($socialni_situace as $typ) {
            $stmt->execute([$zadost_id, $typ]);
        }
    }
    
    /**
     * Uložení kontaktních údajů
     */
    private function ulozitKontakt($zadost_id, $kontakt) {
        $sql = "INSERT INTO dotacni_kalkulator_kontakty 
                (zadost_id, jmeno, email, telefon, souhlas_gdpr) 
                VALUES (?, ?, ?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $zadost_id,
            $kontakt['jmeno'] ?? '',
            $kontakt['email'] ?? '',
            $kontakt['telefon'] ?? null,
            $kontakt['souhlas'] ?? false ? 1 : 0
        ]);
    }
    
    /**
     * Uložení doplňujících údajů
     */
    private function ulozitDoplnujiciUdaje($zadost_id, $doplnujici_udaje) {
        $sql = "INSERT INTO dotacni_kalkulator_doplnujici_udaje 
                (zadost_id, klic, hodnota) 
                VALUES (?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($doplnujici_udaje as $klic => $hodnota) {
            if ($hodnota !== null && $hodnota !== '') {
                $stmt->execute([
                    $zadost_id,
                    $klic,
                    is_array($hodnota) ? json_encode($hodnota, JSON_UNESCAPED_UNICODE) : (string)$hodnota
                ]);
            }
        }
    }
    
    /**
     * Aktualizace celkové dotace po zpracování
     */
    public function aktualizovatCelkouDotaci($zadost_id, $celkova_dotace) {
        $sql = "UPDATE dotacni_kalkulator_zadosti 
                SET celkova_dotace = ?, stav = 'zpracovana' 
                WHERE id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$celkova_dotace, $zadost_id]);
        
        $this->zapisLog($zadost_id, 'dotace_vypocitana', "Celková dotace: $celkova_dotace");
    }
    
    /**
     * Zápis do auditního logu
     */
    private function zapisLog($zadost_id, $akce, $popis = null, $ip_address = null, $user_agent = null) {
        $sql = "INSERT INTO dotacni_kalkulator_logy 
                (zadost_id, akce, popis, ip_adresa, user_agent) 
                VALUES (?, ?, ?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $zadost_id,
            $akce,
            $popis,
            $ip_address ?: $this->getClientIP(),
            $user_agent ?: ($_SERVER['HTTP_USER_AGENT'] ?? '')
        ]);
    }
    
    /**
     * Získání IP adresy klienta
     */
    private function getClientIP() {
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
    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    /**
     * Načtení žádosti podle UUID
     */
    public function nacistZadost($uuid) {
        $sql = "SELECT * FROM dotacni_kalkulator_zadosti WHERE uuid = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$uuid]);
        
        $zadost = $stmt->fetch();
        if (!$zadost) {
            return null;
        }
        
        // Načtení všech souvisejících dat
        $zadost['opatreni'] = $this->nacistOpatreni($zadost['id']);
        $zadost['lokalita'] = $this->nacistLokalitu($zadost['id']);
        $zadost['socialni_situace'] = $this->nacistSocialniSituaci($zadost['id']);
        $zadost['kontakt'] = $this->nacistKontakt($zadost['id']);
        $zadost['doplnujici_udaje'] = $this->nacistDoplnujiciUdaje($zadost['id']);
        
        return $zadost;
    }
    
    private function nacistOpatreni($zadost_id) {
        $sql = "SELECT * FROM dotacni_kalkulator_opatreni WHERE zadost_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$zadost_id]);
        return $stmt->fetchAll();
    }
    
    private function nacistLokalitu($zadost_id) {
        $sql = "SELECT * FROM dotacni_kalkulator_lokality WHERE zadost_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$zadost_id]);
        return $stmt->fetch();
    }
    
    private function nacistSocialniSituaci($zadost_id) {
        $sql = "SELECT typ_situace FROM dotacni_kalkulator_socialni_situace WHERE zadost_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$zadost_id]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    private function nacistKontakt($zadost_id) {
        $sql = "SELECT * FROM dotacni_kalkulator_kontakty WHERE zadost_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$zadost_id]);
        return $stmt->fetch();
    }
    
    private function nacistDoplnujiciUdaje($zadost_id) {
        $sql = "SELECT klic, hodnota FROM dotacni_kalkulator_doplnujici_udaje WHERE zadost_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$zadost_id]);
        
        $udaje = [];
        foreach ($stmt->fetchAll() as $row) {
            $udaje[$row['klic']] = $row['hodnota'];
        }
        return $udaje;
    }
}
?> 