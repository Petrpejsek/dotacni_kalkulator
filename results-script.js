/**
 * Skript pro zobrazení výsledků dotační kalkulačky
 * Generuje obsah stránky na základě JSON dat z API
 */

document.addEventListener('DOMContentLoaded', () => {
    // Testovací data - použijí se pouze pokud nejsou dostupná reálná data z API
    const testData = {
        "intro_text": "Pro váš rodinný dům postavený v roce 1975 v Brně máte nárok na dotace až 385 000 Kč.",
        "doporučene_dotace": [
            {
                "název": "Zateplení fasády",
                "částka": "170 000 Kč",
                "program": "Nová zelená úsporám",
                "podmínky": "Minimálně 10 cm izolace, zateplovaná plocha 120 m², nutný odborný posudek energetického specialisty, realizace certifikovanou firmou, dosažení min. 30% úspory energie oproti původnímu stavu.",
                "kombinovatelné_bonusy": [
                    {"název": "Kombinační bonus", "částka": "až +20 000 Kč"}, 
                    {"název": "Projektový bonus", "částka": "+5 000 Kč"}
                ],
                "přínosy": [
                    {"ikona": "📉", "název": "Nižší účty za vytápění", "popis": "Úspora až 30% nákladů (cca 10 000 Kč ročně)"},
                    {"ikona": "🌡️", "název": "Větší tepelný komfort", "popis": "Příjemnější teplota v interiéru v létě i v zimě"},
                    {"ikona": "🏠", "název": "Ochrana konstrukce", "popis": "Delší životnost vašeho domu a prevence tvorby plísní"},
                    {"ikona": "📊", "název": "Lepší energetický štítek", "popis": "Zvýšení třídy energetické náročnosti budovy"},
                    {"ikona": "💵", "název": "Vyšší hodnota nemovitosti", "popis": "Zateplený dům má vyšší tržní hodnotu na realitním trhu"}
                ],
                "zalohova_dotace": true,
                "zalohova_procenta": 60
            },
            {
                "název": "Fotovoltaika",
                "částka": "140 000 Kč",
                "program": "Nová zelená úsporám",
                "podmínky": "Instalace nového fotovoltaického systému propojeného s vnitřními rozvody elektřiny, připojení k distribuční soustavě, minimální instalovaný výkon 2 kWp, nesmí být již podpořeno jiným dotačním programem.",
                "kombinovatelné_bonusy": [
                    {"název": "Bonus za kombinaci s TČ", "částka": "+25 000 Kč"}, 
                    {"název": "Environmentální bonus", "částka": "až +15 000 Kč"}
                ],
                "přínosy": [
                    {"ikona": "💰", "název": "Nižší účty za elektřinu", "popis": "Ušetříte až 60% nákladů na elektřinu (cca 15 000 - 25 000 Kč ročně)"},
                    {"ikona": "🔋", "název": "Energetická nezávislost", "popis": "Vlastní výroba elektřiny sníží vaši závislost na dodavatelích"},
                    {"ikona": "🌿", "název": "Ekologické řešení", "popis": "Výroba čisté energie bez emisí CO₂"},
                    {"ikona": "📈", "název": "Zvýšení hodnoty nemovitosti", "popis": "Nemovitost se systémem FVE má vyšší tržní hodnotu"},
                    {"ikona": "⚡", "název": "Možnost akumulace energie", "popis": "Kombinací s bateriemi můžete využívat energii i při výpadku sítě"}
                ],
                "zalohova_dotace": true,
                "zalohova_procenta": 50
            },
            {
                "název": "Tepelné čerpadlo – vzduch–voda",
                "částka": "125 000 Kč",
                "program": "Nová zelená úsporám",
                "podmínky": "Výměna starého kotle za tepelné čerpadlo, doložení ekologické likvidace původního zdroje, minimální topný faktor SCOP 4,0, instalace odbornou firmou s certifikací, doložení protokolu o uvedení do provozu.",
                "kombinovatelné_bonusy": [
                    {"název": "Bonus za kombinaci s FVE", "částka": "až +15 000 Kč"},
                    {"název": "Kotlíková dotace", "částka": "až +35 000 Kč"}
                ],
                "přínosy": [
                    {"ikona": "📉", "název": "Výrazné úspory", "popis": "Snížení nákladů na vytápění až o 60% (15-25 tisíc Kč ročně)"},
                    {"ikona": "🌿", "název": "Čistší ovzduší", "popis": "Výrazné snížení emisí CO₂ a škodlivin v okolí vašeho domu"},
                    {"ikona": "🔄", "název": "Komfort obsluhy", "popis": "Plně automatický provoz bez nutnosti přikládání paliva"},
                    {"ikona": "🔌", "název": "Jeden zdroj pro více účelů", "popis": "Vytápění, ohřev vody i chlazení v létě"},
                    {"ikona": "⏱️", "název": "Dlouhá životnost", "popis": "Průměrná doba provozu 20 let s minimální údržbou"},
                    {"ikona": "🌡️", "název": "Vyšší komfort bydlení", "popis": "Stabilní teplota bez výkyvů a rovnoměrné rozložení tepla"}
                ],
                "zalohova_dotace": true,
                "zalohova_procenta": 50
            }
        ],
        "celková_dotace": "385 000 Kč",
        "další_informace": {
            "nárok_na_zálohu": true,
            "možnosti_bonusu": [
                "Bonus za kombinaci více opatření (až +38 500 Kč)", 
                "Bonus za elektronické podání (+5 000 Kč)"
            ],
            "návratnost": "6 let",
            "úspora_energií": "45%",
            "doba_schválení": "2 měsíce"
        },
        "doporučení_experta": "Na základě zadaných údajů doporučuji kombinaci zateplení fasády a fotovoltaické elektrárny. Tato kombinace přinese nejvyšší úspory energie i nejrychlejší návratnost investice. Díky kombinačnímu bonusu můžete získat až o 10% vyšší dotaci."
    };

    // Načtení dat z localStorage, kam je uložil skript po odpovědi z API
    let resultData;
    try {
        const storedData = localStorage.getItem('dotaceResults');
        if (storedData) {
            resultData = JSON.parse(storedData);
            console.log("Data načtena z localStorage:", resultData);
        } else {
            console.log("Žádná data v localStorage, použijí se testovací data");
            resultData = testData;
        }
    } catch (error) {
        console.error("Chyba při načítání dat z localStorage:", error);
        resultData = testData;
    }
    
    // Funkce pro zobrazení výsledků
    function displayResults(data) {
        // Nastavení úvodního textu
        const introPanel = document.querySelector('.intro-panel .intro-content h2');
        if (introPanel) {
            introPanel.textContent = `✅ ${data.intro_text}`;
        }
        
        // Nastavení statistik v přehledovém panelu
        setupDashboardStats(data);
        
        // Vygenerování karet s doporučenými dotacemi
        generateDotaceCards(data.doporučene_dotace);
        
        // Nastavení souhrnných informací
        updateSummaryPanel(data);
        
        // Setupowanie modálního okna a tlačítek
        setupButtons();
        
        // Nastavení timeline harmonogramu
        setupTimeline(data);
        
        // Nastavení expertního doporučení
        setupExpertRecommendation(data);
        
        // Odstraníme případné "undefined" texty
        removeUndefinedElements();
    }
    
    // Funkce pro odstranění undefined elementů z DOM
    function removeUndefinedElements() {
        // Hledáme všechny textové uzly obsahující "undefined"
        const allElements = document.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
            const element = allElements[i];
            
            // Kontrola textových uzlů každého elementu
            for (let j = 0; j < element.childNodes.length; j++) {
                const node = element.childNodes[j];
                if (node.nodeType === 3) { // Textový uzel
                    if (node.nodeValue && node.nodeValue.includes('undefined')) {
                        node.nodeValue = node.nodeValue.replace(/undefined \(undefined\)/g, '');
                    }
                }
            }
            
            // Kontrola atributů
            if (element.hasAttributes()) {
                const attrs = element.attributes;
                for (let k = 0; k < attrs.length; k++) {
                    if (attrs[k].value && attrs[k].value.includes('undefined')) {
                        attrs[k].value = attrs[k].value.replace(/undefined \(undefined\)/g, '');
                    }
                }
            }
        }
    }
    
    // Generuje karty pro doporučené dotace
    function generateDotaceCards(dotace) {
        const dotaceGrid = document.querySelector('.dotace-grid');
        if (!dotaceGrid) return;
        
        // Vyčistit existující obsah
        dotaceGrid.innerHTML = '';
        
        // Přidáme třídu pro rozšířené zobrazení
        dotaceGrid.classList.add('dotace-grid-fullwidth');
        
        // Vytvořit kartu pro každou dotaci
        dotace.forEach(item => {
            // Přeskočíme prázdné položky nebo ty bez názvu
            if (!item || !item.název) return;
            
            const card = document.createElement('div');
            card.className = 'dotace-card';
            
            // Přidat ribbon, pokud je doporučeno
            if (item.priorita === 'vysoká') {
                card.innerHTML += `<div class="card-ribbon">Doporučeno</div>`;
            }
            
            // Přidat header s ikonou a názvem
            let icon = '🏠'; // Výchozí ikona
            
            // Výběr ikony podle názvu
            if (item.název.toLowerCase().includes('tepelné čerpadlo')) {
                icon = '🔥';
            } else if (item.název.toLowerCase().includes('fotovoltai')) {
                icon = '☀️';
            } else if (item.název.toLowerCase().includes('zateplení')) {
                icon = '🧱';
            } else if (item.název.toLowerCase().includes('okn')) {
                icon = '🪟';
            } else if (item.název.toLowerCase().includes('dveř')) {
                icon = '🚪';
            } else if (item.název.toLowerCase().includes('střech')) {
                icon = '🏠';
            }
            
            card.innerHTML += `
                <div class="dotace-header">
                    <span class="dotace-icon">${icon}</span>
                    <h3>${item.název}</h3>
                </div>
                <div class="dotace-amount">${item.částka}</div>
                <div class="dotace-program">
                    <span class="program-label">Program:</span>
                    <span class="program-value">${item.program || 'Nová zelená úsporám'}</span>
                </div>
            `;
            
            // Přidat podmínky získání dotace
            if (item.podmínky) {
                card.innerHTML += `
                    <div class="dotace-conditions">
                        <h4>Podmínky získání dotace:</h4>
                        <ul>
                            ${formatConditions(item.podmínky)}
                        </ul>
                    </div>
                `;
            }
            
            // Přidat přínosy
            if (item.přínosy && item.přínosy.length > 0) {
                const benefitsList = item.přínosy.map(benefit => 
                    `<li><span class="benefit-icon">${benefit.ikona || '✓'}</span> <strong>${benefit.název || ''}:</strong> ${benefit.popis || ''}</li>`
                ).join('');
                
                card.innerHTML += `
                    <div class="dotace-benefits">
                        <h4>Co vám to přinese:</h4>
                        <ul class="benefits-list">
                            ${benefitsList}
                        </ul>
                    </div>
                `;
            }
            // Přidat tagy pro bonusy
            if (item.kombinovatelné_bonusy && item.kombinovatelné_bonusy.length > 0) {
                const tagHtml = item.kombinovatelné_bonusy.map(bonus => 
                    `<span class="dotace-tag">${bonus.název || ''} (${bonus.částka || ''})</span>`
                ).join('');
                
                card.innerHTML += `
                    <div class="dotace-tags">
                        ${tagHtml}
                    </div>
                `;
            }
            
            // Přidat info o záloze, pokud je dostupná
            if (item.zalohova_dotace) {
                card.innerHTML += `
                    <div class="dotace-zalohova">
                        <span class="zalohova-badge">✅ Možno čerpat zálohově až ${item.zalohova_procenta || 50}% dotace</span>
                    </div>
                `;
            }
            
            dotaceGrid.appendChild(card);
        });
    }
    
    // Formátuje podmínky jako seznam
    function formatConditions(conditions) {
        if (!conditions) return '';
        
        // Pokud je řetězec, rozdělíme ho podle čárky a vytvoříme odrážky
        if (typeof conditions === 'string') {
            return conditions.split(', ')
                .map(condition => `<li>${condition}</li>`)
                .join('');
        } 
        // Pokud je pole, všechny položky obalíme li elementy
        else if (Array.isArray(conditions)) {
            return conditions.map(condition => `<li>${condition}</li>`).join('');
        }
        
        return `<li>${conditions}</li>`;
    }
    
    // Nastavuje souhrnné informace ve spodním panelu
    function updateSummaryPanel(data) {
        // Nastavit celkovou částku
        const totalAmount = document.querySelector('.summary-panel h2');
        if (totalAmount) {
            totalAmount.textContent = `Celkem můžete získat až ${data.celková_dotace}`;
        }
        
        // Nastavit informaci o záloze
        const zalohaInfo = document.querySelector('.summary-item');
        if (zalohaInfo && data.další_informace.nárok_na_zálohu) {
            zalohaInfo.innerHTML = `<span class="summary-icon">💰</span> Máte nárok na vyplacení zálohy předem (až 60% celkové dotace)`;
        } else if (zalohaInfo) {
            zalohaInfo.style.display = 'none';
        }
        
        // Nastavit seznam bonusů
        const bonusList = document.querySelector('.bonus-list');
        if (bonusList && data.další_informace.možnosti_bonusu) {
            bonusList.innerHTML = '';
            data.další_informace.možnosti_bonusu.forEach(bonus => {
                const bonusItem = document.createElement('li');
                bonusItem.innerHTML = `<span class="bonus-icon">✅</span> ${bonus}`;
                bonusList.appendChild(bonusItem);
            });
        }
    }
    
    // Nastavuje statistiky v přehledovém panelu
    function setupDashboardStats(data) {
        const statsContainer = document.querySelector('.stats-container');
        if (!statsContainer) return;
        
        // Nastavení celkové výše dotace
        const dotaceStat = statsContainer.querySelector('.stat-item:nth-child(1) .stat-value');
        if (dotaceStat) {
            dotaceStat.textContent = data.celková_dotace;
        }
        
        // Nastavení doby schválení, pokud je dostupná
        if (data.další_informace.doba_schválení) {
            const schvaleniStat = statsContainer.querySelector('.stat-item:nth-child(2) .stat-value');
            if (schvaleniStat) {
                schvaleniStat.textContent = data.další_informace.doba_schválení;
            }
        }
        
        // Nastavení návratnosti investice, pokud je dostupná
        if (data.další_informace.návratnost) {
            const navratnostStat = statsContainer.querySelector('.stat-item:nth-child(3) .stat-value');
            if (navratnostStat) {
                navratnostStat.textContent = data.další_informace.návratnost;
            }
        }
        
        // Nastavení úspory energií, pokud je dostupná
        if (data.další_informace.úspora_energií) {
            const usporaStat = statsContainer.querySelector('.stat-item:nth-child(4) .stat-value');
            if (usporaStat) {
                usporaStat.textContent = data.další_informace.úspora_energií;
            }
        }
    }
    
    // Nastavení harmonogramu
    function setupTimeline(data) {
        // Tuto funkci můžete implementovat podle potřeby
        // Pro testovací účely používáme statické údaje z HTML
    }
    
    // Nastavení expertního doporučení
    function setupExpertRecommendation(data) {
        // Tuto funkci můžete implementovat podle potřeby
        // Pro testovací účely používáme statické údaje z HTML
    }
    
    // Zpracování formuláře pro zpřesnění výpočtu
    function setupRefinementForm() {
        const form = document.getElementById('refinement-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Zobrazení načítacího indikátoru
                const submitBtn = form.querySelector('.refinement-submit');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Přepočítávám...';
                }
                
                // Shromáždění dat z formuláře
                const formData = {
                    building_area: form.elements['building-area'].value,
                    electricity_consumption: form.elements['electricity-consumption'].value,
                    heating_consumption: form.elements['heating-consumption'].value,
                    roof_area: form.elements['roof-area'].value
                };
                
                // Simulace odeslání dat a získání odpovědi (v reálné aplikaci by toto šlo na server)
                setTimeout(() => {
                    // Simulace úpravy výsledků na základě nových dat
                    let updatedData = JSON.parse(JSON.stringify(resultData));
                    
                    // Úprava výsledků na základě zadaných hodnot
                    if (formData.roof_area && parseInt(formData.roof_area) > 60) {
                        // Pokud je plocha střechy větší než 60m², zvýšíme dotaci na FVE
                        const fveIndex = updatedData.doporučene_dotace.findIndex(d => 
                            d.název.toLowerCase().includes('fotovoltai'));
                        
                        if (fveIndex !== -1) {
                            // Zvýšení částky FVE
                            updatedData.doporučene_dotace[fveIndex].částka = "120 000 Kč";
                            updatedData.doporučene_dotace[fveIndex].priorita = "vysoká";
                            
                            // Aktualizace celkové částky
                            const oldAmount = parseInt(resultData.celková_dotace.replace(/\D/g, ''));
                            const newAmount = oldAmount + 30000;
                            updatedData.celková_dotace = `${newAmount.toLocaleString()} Kč`;
                        }
                    }
                    
                    // Re-render výsledků s novými daty
                    displayResults(updatedData);
                    
                    // Vrácení tlačítka do původního stavu
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Přepočítat dotaci';
                    }
                    
                    // Animace posunu na přehled výsledků
                    const dashboardPanel = document.querySelector('.dashboard-panel');
                    if (dashboardPanel) {
                        dashboardPanel.scrollIntoView({ behavior: 'smooth' });
                    }
                    
                    // Zobrazení oznámení o úspěšném přepočítání
                    showNotification('Výpočet byl úspěšně aktualizován');
                }, 1500);
            });
        }
    }
    
    // Inicializace tlačítek
    function setupButtons() {
        // Tlačítko pro konzultaci
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.addEventListener('click', () => {
                // Vytvoření a zobrazení modálního okna pro kontaktní údaje
                showContactModal();
            });
        }
        
        // Tlačítko pro kontaktování specialisty
        const expertContact = document.querySelector('.expert-contact');
        if (expertContact) {
            expertContact.addEventListener('click', () => {
                showContactModal();
            });
        }
    }
    
    // Funkce pro zobrazení oznámení
    function showNotification(message) {
        // Kontrola, zda již existuje kontejner pro oznámení
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
            
            // Přidání stylů pro notifikace
            const style = document.createElement('style');
            style.innerHTML = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .notification {
                    background-color: #4caf50;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 4px;
                    margin-bottom: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    animation: notification-slide-in 0.3s, notification-fade-out 0.3s 2.7s;
                    opacity: 0;
                }
                @keyframes notification-slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes notification-fade-out {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Vytvoření a přidání nového oznámení
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        
        // Nastavení opacit na 1 pro zobrazení (ve stylu je výchozí hodnota 0)
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Odstranění oznámení po 3 sekundách
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Funkce pro zobrazení modálního okna pro kontaktní údaje
    function showContactModal() {
        // Kontrola, zda již existuje modální okno
        let modal = document.querySelector('.contact-modal');
        
        if (!modal) {
            // Přidání stylů pro modální okno
            const style = document.createElement('style');
            style.innerHTML = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0,0,0,0.5);
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .contact-modal {
                    background-color: white;
                    padding: 25px;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    width: 100%;
                    max-width: 500px;
                    position: relative;
                }
                .modal-close {
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #999;
                }
                .modal-form label {
                    display: block;
                    margin: 15px 0 5px;
                    font-weight: 500;
                }
                .modal-form input, .modal-form textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }
                .modal-submit {
                    background-color: var(--primary-blue);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 20px;
                    width: 100%;
                }
            `;
            document.head.appendChild(style);
            
            // Vytvoření modálního okna
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            modal = document.createElement('div');
            modal.className = 'contact-modal';
            modal.innerHTML = `
                <span class="modal-close">&times;</span>
                <h3>Kontaktujte specialistu</h3>
                <p>Vyplňte formulář a ozveme se vám s bezplatnou konzultací.</p>
                <form class="modal-form">
                    <label for="modal-name">Jméno a příjmení</label>
                    <input type="text" id="modal-name" required>
                    
                    <label for="modal-phone">Telefonní číslo</label>
                    <input type="tel" id="modal-phone" required>
                    
                    <label for="modal-email">E-mail</label>
                    <input type="email" id="modal-email" required>
                    
                    <label for="modal-message">Poznámka (nepovinné)</label>
                    <textarea id="modal-message" rows="3"></textarea>
                    
                    <button type="submit" class="modal-submit">Odeslat</button>
                </form>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            // Zavření modálního okna
            const closeBtn = modal.querySelector('.modal-close');
            closeBtn.addEventListener('click', () => {
                overlay.remove();
            });
            
            // Kliknutí mimo modální okno
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
            
            // Zpracování formuláře
            const form = modal.querySelector('.modal-form');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Simulace odeslání dat
                const submitBtn = form.querySelector('.modal-submit');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Odesílám...';
                
                setTimeout(() => {
                    overlay.remove();
                    showNotification('Vaše žádost o konzultaci byla odeslána. Brzy vás budeme kontaktovat.');
                }, 1000);
            });
        }
    }
    
    // Tlačítko pro doporučení dalších možných dotací
    const moreRecommendationsBtn = document.querySelector('.more-recommendations-btn');
    if (moreRecommendationsBtn) {
        moreRecommendationsBtn.addEventListener('click', function() {
            alert('Děkujeme za váš zájem! Funkce pro doporučení dalších dotací bude brzy k dispozici. Pro více informací nás kontaktujte na info@enermio.cz');
        });
    }
    
    // Inicializace zobrazení výsledků
    displayResults(resultData);
    setupRefinementForm();
}); 