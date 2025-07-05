/**
 * Auto-save modul pro dotační kalkulátor
 * Automaticky ukládá data po každém dokončeném kroku
 */

class KalkulatorAutoSave {
    constructor() {
        this.currentUUID = null;
        this.currentStep = 1;
        this.isInitialized = false;
        this.saveEndpoint = 'save-step.php';
        
        // Načtení UUID z URL při inicializaci
        this.loadFromURL();
        
        console.log('🔄 KalkulatorAutoSave inicializován');
    }
    
    /**
     * Načtení UUID z GET parametrů
     */
    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const uuid = urlParams.get('uuid');
        
        if (uuid) {
            this.currentUUID = uuid;
            console.log('📥 Načteno UUID z URL:', uuid);
            this.loadExistingData(uuid);
        }
    }
    
    /**
     * Přidání UUID do URL bez refresh stránky
     */
    updateURL(uuid) {
        const url = new URL(window.location);
        url.searchParams.set('uuid', uuid);
        
        // Použití History API pro aktualizaci URL
        window.history.replaceState({}, '', url);
        console.log('🔗 UUID přidáno do URL:', uuid);
    }
    
    /**
     * Vytvoření nové žádosti při prvním kroku
     */
    async createNewRequest(typNemovitosti) {
        try {
            console.log('🆕 Vytváří se nová žádost pro:', typNemovitosti);
            
            const response = await fetch(this.saveEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create_request',
                    typ_nemovitosti: typNemovitosti
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentUUID = result.data.uuid;
                this.currentStep = result.data.step;
                
                // Přidání UUID do URL
                this.updateURL(this.currentUUID);
                
                console.log('✅ Nová žádost vytvořena:', result.data);
                
                // Zobrazení notifikace uživateli
                this.showNotification('💾 Vaše data se automaticky ukládají', 'success');
                
                return result.data;
            } else {
                throw new Error(result.error || 'Chyba při vytváření žádosti');
            }
            
        } catch (error) {
            console.error('❌ Chyba při vytváření žádosti:', error);
            this.showNotification('⚠️ Chyba při ukládání dat', 'error');
            throw error;
        }
    }
    
    /**
     * Uložení dat z konkrétního kroku
     */
    async saveStepData(step, stepData) {
        if (!this.currentUUID) {
            console.warn('⚠️ Nelze uložit krok - chybí UUID');
            return;
        }
        
        try {
            console.log(`💾 Ukládá se krok ${step}:`, stepData);
            
            const response = await fetch(this.saveEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'update_step',
                    uuid: this.currentUUID,
                    step: step,
                    step_data: stepData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentStep = step;
                console.log(`✅ Krok ${step} uložen:`, result.data);
                
                // Jemná notifikace o úspěšném uložení
                this.showAutoSaveIndicator();
                
                return result.data;
            } else {
                throw new Error(result.error || 'Chyba při ukládání kroku');
            }
            
        } catch (error) {
            console.error(`❌ Chyba při ukládání kroku ${step}:`, error);
            this.showNotification('⚠️ Chyba při ukládání dat', 'error');
            throw error;
        }
    }
    
    /**
     * Načtení existujících dat podle UUID
     */
    async loadExistingData(uuid) {
        try {
            console.log('📥 Načítají se existující data pro UUID:', uuid);
            
            const response = await fetch(this.saveEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'load_request',
                    uuid: uuid
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Data načtena:', result.data);
                
                this.currentUUID = result.data.uuid;
                this.currentStep = result.data.step;
                
                // Obnovení formuláře s načtenými daty
                this.restoreFormData(result.data);
                
                this.showNotification('📥 Vaše data byla obnovena', 'info');
                
                return result.data;
            } else {
                throw new Error(result.error || 'Chyba při načítání dat');
            }
            
        } catch (error) {
            console.error('❌ Chyba při načítání dat:', error);
            // Při chybě pokračujeme jako nová žádost
            this.currentUUID = null;
        }
    }
    
    /**
     * Obnovení formuláře s načtenými daty
     */
    restoreFormData(requestData) {
        const data = requestData.data;
        
        if (!data) return;
        
        // Obnovení typu nemovitosti (krok 1)
        if (data.typ_nemovitosti) {
            const typeButton = document.querySelector(`#step1 .option-btn[data-value="${data.typ_nemovitosti}"]`);
            if (typeButton) {
                typeButton.classList.add('selected');
            }
        }
        
        // Obnovení roku výstavby (krok 2)
        if (data.rok_vystavby) {
            const yearButton = document.querySelector(`#step2 .option-btn[data-value="${data.rok_vystavby}"]`);
            if (yearButton) {
                yearButton.classList.add('selected');
            }
        }
        
        // Obnovení opatření (krok 3)
        if (data.opatreni && Array.isArray(data.opatreni)) {
            data.opatreni.forEach(opatreni => {
                const checkbox = document.querySelector(`#step3 input[value="${opatreni}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            // 🆕 Generování dynamických otázek pro krok 4 po obnovení checkboxů
            this.generateAndRestoreDynamicQuestions(data);
        }
        
        // Obnovení lokality (krok 5)
        if (data.lokalita) {
            if (data.lokalita.adresa) {
                const adresaInput = document.getElementById('ulice-input');
                if (adresaInput) adresaInput.value = data.lokalita.adresa;
            }
            if (data.lokalita.mesto) {
                const mestoInput = document.getElementById('mesto-input');
                if (mestoInput) mestoInput.value = data.lokalita.mesto;
            }
            if (data.lokalita.psc) {
                const pscInput = document.getElementById('psc-input');
                if (pscInput) pscInput.value = data.lokalita.psc;
            }
        }
        
        // Obnovení sociální situace (krok 6)
        if (data.socialni_situace && Array.isArray(data.socialni_situace)) {
            data.socialni_situace.forEach(situace => {
                const checkbox = document.querySelector(`#step6 input[name="social"][value="${situace}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
        
        // Obnovení kontaktních údajů (krok 7)
        if (data.kontakt) {
            if (data.kontakt.jmeno) {
                const jmenoInput = document.getElementById('jmeno-input');
                if (jmenoInput) jmenoInput.value = data.kontakt.jmeno;
            }
            if (data.kontakt.email) {
                const emailInput = document.getElementById('email-input');
                if (emailInput) emailInput.value = data.kontakt.email;
            }
            if (data.kontakt.telefon) {
                const telefonInput = document.getElementById('telefon-input');
                if (telefonInput) telefonInput.value = data.kontakt.telefon;
            }
        }
        
        // Přejití na správný krok
        if (requestData.step > 1) {
            // Aktualizace současného kroku v hlavním skriptu
            if (typeof window.currentStep !== 'undefined') {
                window.currentStep = requestData.step;
            }
            
            // Aktualizace progress baru a zobrazení kroku
            if (typeof updateProgress === 'function') {
                updateProgress();
            }
            if (typeof showStep === 'function') {
                showStep(requestData.step);
            }
        }
        
        console.log('🔄 Formulář obnoven na krok:', requestData.step);
    }
    
    /**
     * 🆕 Pomocné funkce pro práci s podotázkami (kopie ze script.js)
     */
    hasSubQuestions(opatreniKey) {
        const opatreniOtazky = window.opatreniOtazky;
        const otazka = opatreniOtazky[opatreniKey];
        if (!otazka) return false;
        
        // Pokud má otázka vlastnost 'type', je to jednoduchá otázka
        // Pokud nemá 'type', ale má vlastnosti s objekty, jsou to podotázky
        return !otazka.type && typeof otazka === 'object' && otazka !== null;
    }

    getSubQuestions(opatreniKey) {
        const opatreniOtazky = window.opatreniOtazky;
        const otazka = opatreniOtazky[opatreniKey];
        if (!this.hasSubQuestions(opatreniKey)) return {};
        
        return Object.keys(otazka)
            .filter(key => typeof otazka[key] === 'object' && otazka[key] !== null && otazka[key].type)
            .reduce((acc, key) => {
                acc[key] = otazka[key];
                return acc;
            }, {});
    }

    getSimpleQuestion(opatreniKey) {
        const opatreniOtazky = window.opatreniOtazky;
        const otazka = opatreniOtazky[opatreniKey];
        if (this.hasSubQuestions(opatreniKey)) return null;
        return otazka;
    }

    /**
     * 🆕 Generování a obnovení dynamických otázek pro krok 4
     */
    generateAndRestoreDynamicQuestions(data) {
        // Nejdříve musíme vygenerovat dynamické otázky (stejná logika jako v script.js)
        const dynamicQuestionsForm = document.getElementById('dynamic-questions');
        if (!dynamicQuestionsForm) return;
        
        // Vyčistíme existující obsah
        dynamicQuestionsForm.innerHTML = '';
        
        // Zavoláme hlavní funkci pro generování otázek ze script.js
        if (typeof generateDynamicQuestions === 'function') {
            generateDynamicQuestions();
        } else {
            // Pokud funkce není dostupná, implementujeme vlastní logiku
            this.generateDynamicQuestionsInternal(data);
        }
        
        // Nyní vyplníme hodnoty ze záložených dat
        this.fillDynamicQuestionsValues(data);
    }
    
    /**
     * 🆕 Vyplnění hodnot do dynamicky vygenerovaných polí
     */
    fillDynamicQuestionsValues(data) {
        const dynamicQuestionsForm = document.getElementById('dynamic-questions');
        if (!dynamicQuestionsForm || !data.doplnujici_udaje) return;
        
        console.log('🔄 Vyplňuji hodnoty do dynamických polí:', data.doplnujici_udaje);
        
        // Procházíme všechny doplňující údaje
        Object.entries(data.doplnujici_udaje).forEach(([opatreniKey, opatreniValue]) => {
            // 🆕 Zkontroluj, zda má opatření podotázky
            if (this.hasSubQuestions(opatreniKey) && typeof opatreniValue === 'object' && opatreniValue !== null) {
                // Obnovení podotázek
                Object.entries(opatreniValue).forEach(([subKey, subValue]) => {
                    const fullInputName = opatreniKey + '-' + subKey;
                    this.fillSingleQuestionValue(dynamicQuestionsForm, fullInputName, subValue);
                });
            } else {
                // Obnovení jednoduché otázky
                this.fillSingleQuestionValue(dynamicQuestionsForm, opatreniKey, opatreniValue);
            }
        });
        
        // Aktualizujeme stav tlačítka "Pokračovat" v kroku 4
        const nextButtonStep4 = document.querySelector('#step4 .next-btn');
        if (nextButtonStep4 && typeof validateDynamicQuestions === 'function') {
            nextButtonStep4.disabled = !validateDynamicQuestions();
        }
    }

    /**
     * 🆕 Pomocná funkce pro vyplnění hodnoty jedné otázky
     */
    fillSingleQuestionValue(dynamicQuestionsForm, inputName, value) {
        // 1. Zkusíme najít radio button
        if (typeof value === 'string') {
            const radioInput = dynamicQuestionsForm.querySelector(`input[name="${inputName}"][value="${value}"]`);
            if (radioInput) {
                radioInput.checked = true;
                console.log(`✅ Obnoveno radio pole ${inputName}: ${value}`);
                return;
            }
        }
        
        // 2. Zkusíme najít number input podle name
        const numberInput = dynamicQuestionsForm.querySelector(`input[name="${inputName}"][type="number"]`);
        if (numberInput && typeof value === 'string') {
            numberInput.value = value;
            console.log(`✅ Obnoveno number pole ${inputName}: ${value}`);
            return;
        }
        
        // 3. Zkusíme najít checkbox skupinu
        if (Array.isArray(value)) {
            value.forEach(checkboxValue => {
                const checkbox = dynamicQuestionsForm.querySelector(`input[name="${inputName}[]"][value="${checkboxValue}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    console.log(`✅ Obnoveno checkbox ${inputName}: ${checkboxValue}`);
                }
            });
        }
    }
    
    /**
     * 🆕 Interní generování dynamických otázek (záložní řešení)
     * Používá globální definici otázek z script.js
     */
    generateDynamicQuestionsInternal(data) {
        const dynamicQuestionsForm = document.getElementById('dynamic-questions');
        if (!dynamicQuestionsForm || !data.opatreni) return;
        
        // Používáme globální definici otázek ze script.js
        const opatreniOtazky = window.opatreniOtazky;
        if (!opatreniOtazky) {
            console.error('❌ Globální definice otázek není dostupná');
            return;
        }
        
        // Generujeme otázky pro každé vybrané opatření
        data.opatreni.forEach(opatreni => {
            // 🆕 Zkontroluj, zda má opatření podotázky
            if (this.hasSubQuestions(opatreni)) {
                // Generuj podotázky
                const subQuestions = this.getSubQuestions(opatreni);
                Object.keys(subQuestions).forEach(subKey => {
                    const subQuestion = subQuestions[subKey];
                    const fullKey = opatreni + '-' + subKey;
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'dynamic-question';
                    wrapper.setAttribute('data-main-key', opatreni);
                    wrapper.setAttribute('data-sub-key', subKey);
                    
                    this.generateSingleQuestionElement(wrapper, subQuestion, fullKey);
                    dynamicQuestionsForm.appendChild(wrapper);
                });
            } else {
                // Generuj jednoduchou otázku
                const simpleQuestion = this.getSimpleQuestion(opatreni);
                if (!simpleQuestion) return;
                
                const wrapper = document.createElement('div');
                wrapper.className = 'dynamic-question';
                wrapper.setAttribute('data-main-key', opatreni);
                
                this.generateSingleQuestionElement(wrapper, simpleQuestion, opatreni);
                dynamicQuestionsForm.appendChild(wrapper);
            }
        });
        
        console.log('🔄 Dynamické otázky vygenerovány interně pomocí globální definice');
    }

    /**
     * 🆕 Pomocná funkce pro generování jednoho prvku otázky
     */
    generateSingleQuestionElement(wrapper, otazka, inputName) {
        if (otazka.type === 'number') {
            const row = document.createElement('div');
            row.className = 'dynamic-question-row';
            
            const label = document.createElement('label');
            label.textContent = otazka.label;
            label.className = 'dynamic-label';
            row.appendChild(label);
            
            const input = document.createElement('input');
            input.type = 'number';
            input.min = otazka.min;
            input.placeholder = otazka.placeholder;
            input.className = 'dynamic-input';
            input.name = inputName;
            row.appendChild(input);
            
            wrapper.appendChild(row);
        } else if (otazka.type === 'radio') {
            const label = document.createElement('label');
            label.textContent = otazka.label;
            label.className = 'dynamic-label';
            wrapper.appendChild(label);
            
            const radioGroup = document.createElement('div');
            radioGroup.className = 'radio-group';
            
            otazka.options.forEach(option => {
                const radioLabel = document.createElement('label');
                radioLabel.className = 'radio-option';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = inputName;
                radio.value = option;
                
                const span = document.createElement('span');
                span.textContent = option;
                
                radioLabel.appendChild(radio);
                radioLabel.appendChild(span);
                radioGroup.appendChild(radioLabel);
            });
            
            wrapper.appendChild(radioGroup);
        } else if (otazka.type === 'checkbox') {
            const label = document.createElement('label');
            label.textContent = otazka.label;
            label.className = 'dynamic-label';
            wrapper.appendChild(label);
            
            const checkboxGroup = document.createElement('div');
            checkboxGroup.className = 'checkbox-group';
            
            otazka.options.forEach(option => {
                const checkboxLabel = document.createElement('label');
                checkboxLabel.className = 'checkbox-option';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = inputName + '[]';
                checkbox.value = option;
                
                const span = document.createElement('span');
                span.textContent = option;
                
                checkboxLabel.appendChild(checkbox);
                checkboxLabel.appendChild(span);
                checkboxGroup.appendChild(checkboxLabel);
            });
            
            wrapper.appendChild(checkboxGroup);
        }
    }
    
    /**
     * Zobrazení indikátoru automatického uložení
     */
    showAutoSaveIndicator() {
        // Vytvoření diskrétního indikátoru
        let indicator = document.getElementById('autosave-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autosave-indicator';
            indicator.innerHTML = '💾 Uloženo';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(indicator);
        }
        
        // Zobrazení a skrytí
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }
    
    /**
     * Zobrazení notifikace uživateli
     */
    showNotification(message, type = 'info') {
        // Vytvoření notifikace
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animace zobrazení
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Automatické skrytí
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    /**
     * Získání aktuálního UUID
     */
    getCurrentUUID() {
        return this.currentUUID;
    }
    
    /**
     * Získání aktuálního kroku
     */
    getCurrentStep() {
        return this.currentStep;
    }
}

// Inicializace auto-save při načtení stránky
window.kalkulatorAutoSave = new KalkulatorAutoSave(); 