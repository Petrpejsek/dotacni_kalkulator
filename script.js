document.addEventListener('DOMContentLoaded', function() {
    // Inicializace proměnných
    let currentStep = 1;
    const totalSteps = 7;
    const progressBar = document.getElementById('progress');
    const steps = document.querySelectorAll('.step');
    const optionButtonsStep1 = document.querySelectorAll('#step1 .option-btn');
    const optionButtonsStep2 = document.querySelectorAll('#step2 .option-btn');
    const backButtonStep2 = document.querySelector('#step2 .back-btn');
    // Krok 3
    const checkboxesStep3 = document.querySelectorAll('#step3 input[type="checkbox"]');
    const nextButtonStep3 = document.querySelector('#step3 .next-btn');
    const backButtonStep3 = document.querySelector('#step3 .back-btn');
    // Krok 4
    const step4 = document.getElementById('step4');
    const dynamicQuestionsForm = document.getElementById('dynamic-questions');
    const nextButtonStep4 = step4 ? step4.querySelector('.next-btn') : null;
    const backButtonStep4 = step4 ? step4.querySelector('.back-btn') : null;
    // === KROK 5: Lokalita ===
    const step5 = document.getElementById('step5');
    const uliceInput = document.getElementById('ulice-input');
    const pscInput = document.getElementById('psc-input');
    const mestoInput = document.getElementById('mesto-input');
    const nextButtonStep5 = step5 ? step5.querySelector('.next-btn') : null;
    const backButtonStep5 = step5 ? step5.querySelector('.back-btn') : null;
    // Přidám proměnnou pro uchování výběru z kroku 1
    let selectedStep1 = null;
    const jinyExtraField = document.getElementById('jiny-extra-field');
    const jinyNavBtns = document.getElementById('jiny-nav-btns');

    // Mapa opatření a jejich otázek
    const opatreniOtazky = {
        'zatepleni-sten': {
            label: 'Jaká je přibližná plocha obvodových stěn?\n(v m²)',
            type: 'number',
            min: 1,
            placeholder: 'Např. 120',
        },
        'zatepleni-strechy': {
            label: 'Jaká je plocha stropu/střechy k zateplení?\n(v m²)',
            type: 'number',
            min: 1,
            placeholder: 'Např. 80',
        },
        'vymena-oken': {
            label: 'Zadejte počet kusů nebo přibližnou plochu v m²',
            type: 'number',
            min: 1,
            placeholder: 'Např. 10 (ks) nebo 15 (m²)',
        },
        'tepelne-cerpadlo': {
            label: 'Jaký typ čerpadla plánujete?',
            type: 'radio',
            options: ['vzduch-voda', 'země-voda', 'nevím'],
        },
        'fotovoltaika': {
            label: 'Jaký výkon FVE systému plánujete?\n(v kWp)',
            type: 'number',
            min: 1,
            placeholder: 'Např. 5',
        },
        'ohrev-vody-fv': {
            label: 'Vyberte:',
            type: 'radio',
            options: ['chci jen ohřev vody', 'kombinace s FV'],
        },
        'rekuperace': {
            label: 'Typ plánovaného systému?',
            type: 'radio',
            options: ['centrální', 'decentrální', 'nejsem si jistý'],
        },
        'destova-voda': {
            label: 'K jakému účelu chcete dešťovou vodu využít?',
            type: 'checkbox',
            options: ['WC', 'zalévání', 'jiné'],
        },
        'rizeni-spotreby': {
            label: 'Plánujete baterii?',
            type: 'radio',
            options: ['Ano', 'Ne', 'Zvažuji'],
        },
        'rizene-vetrani': null // nemá poddotaz
    };

    // Ukázkový seznam obcí a PSČ (pro reálný provoz lze nahradit větším seznamem nebo API)
    const obcePsc = [
        'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'České Budějovice',
        'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Zlín', 'Karlovy Vary',
        'Jihlava', 'Teplice', 'Mladá Boleslav', '40001', '60200', '77900', '37001', '50002'
    ];

    // Funkce pro filtrování návrhů
    function filterSuggestions(query) {
        if (!query) return [];
        const q = query.toLowerCase();
        return obcePsc.filter(item => item.toLowerCase().includes(q)).slice(0, 8);
    }

    // Funkce pro aktualizaci progress baru
    function updateProgress() {
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progress}%`;
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed', 'clickable');
            if (index + 1 === currentStep) {
                step.classList.add('active');
            } else if (index + 1 < currentStep) {
                step.classList.add('completed', 'clickable');
            }
        });
    }

    // Funkce pro přepínání mezi kroky
    function showStep(stepNumber) {
        const stepContents = document.querySelectorAll('.step-content');
        stepContents.forEach((content, index) => {
            if (index + 1 === stepNumber) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    // Krok 1: Po kliknutí na možnost automaticky přejdi na další krok nebo zobraz input pro Jiný typ
    optionButtonsStep1.forEach(button => {
        button.addEventListener('click', function() {
            optionButtonsStep1.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            const selectedValue = this.getAttribute('data-value');
            selectedStep1 = selectedValue;
            
            if (selectedValue === 'jiny') {
                // Zobrazit pole pro jiný typ nemovitosti a navigační tlačítka
                jinyExtraField.style.display = 'flex';
                jinyExtraField.innerHTML = `
                    <input type="text" id="jiny-input" class="dynamic-input" placeholder="Doplňte typ nemovitosti">
                    <button class="next-btn" id="jiny-input-next">Pokračovat</button>
                `;
                
                const jinyInput = document.getElementById('jiny-input');
                const jinyInputNext = document.getElementById('jiny-input-next');
                jinyInputNext.disabled = true;
                
                if (jinyInput) {
                    jinyInput.addEventListener('input', function() {
                        jinyInputNext.disabled = this.value.trim() === '';
                    });
                    
                    jinyInputNext.addEventListener('click', function() {
                        currentStep = 2;
                        updateProgress();
                        showStep(currentStep);
                    });
                }
            } else {
                // Při kliknutí na jiné tlačítko než "Jiný" skryjeme navigační tlačítka a input pole
                jinyExtraField.style.display = 'none';
                
                // Rovnou přejdeme na další krok
                currentStep = 2;
                updateProgress();
                showStep(currentStep);
            }
        });
    });

    // Krok 2: Po kliknutí na možnost automaticky přejdi na další krok
    optionButtonsStep2.forEach(button => {
        button.addEventListener('click', function() {
            optionButtonsStep2.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            currentStep = 3;
            updateProgress();
            showStep(currentStep);
        });
    });

    // Krok 2: Zpět
    if (backButtonStep2) {
        backButtonStep2.addEventListener('click', function() {
            if (currentStep > 1) {
                currentStep--;
                updateProgress();
                showStep(currentStep);
            }
        });
    }

    // Krok 3: Aktivace tlačítka Pokračovat po výběru alespoň jednoho checkboxu
    if (nextButtonStep3) {
        function updateNextBtnStep3() {
            const checked = Array.from(checkboxesStep3).some(cb => cb.checked);
            nextButtonStep3.disabled = !checked;
        }
        checkboxesStep3.forEach(cb => {
            cb.addEventListener('change', updateNextBtnStep3);
        });
        updateNextBtnStep3();
        nextButtonStep3.addEventListener('click', function() {
            currentStep = 4;
            updateProgress();
            showStep(currentStep);
        });
    }
    // Krok 3: Zpět
    if (backButtonStep3) {
        backButtonStep3.addEventListener('click', function() {
            if (currentStep > 1) {
                currentStep--;
                updateProgress();
                showStep(currentStep);
            }
        });
    }

    // Kliknutí na předchozí kroky v progress baru (kroky 1 a 2)
    steps.forEach((step, index) => {
        step.addEventListener('click', function() {
            if (step.classList.contains('clickable')) {
                currentStep = index + 1;
                updateProgress();
                showStep(currentStep);
            }
        });
    });

    // Funkce pro generování otázek podle výběru
    function generateDynamicQuestions() {
        if (!dynamicQuestionsForm) return;
        dynamicQuestionsForm.innerHTML = '';
        
        // Zjisti vybrané checkboxy z kroku 3
        const checked = Array.from(document.querySelectorAll('#step3 input[type="checkbox"]:checked'));
        
        // Pokud není nic vybráno, zobraz informaci
        if (checked.length === 0) {
            const emptyInfo = document.createElement('div');
            emptyInfo.className = 'dynamic-question';
            emptyInfo.innerHTML = '<p>Nebylo vybráno žádné opatření. Vraťte se a vyberte alespoň jedno.</p>';
            dynamicQuestionsForm.appendChild(emptyInfo);
            return;
        }
        
        // Pro každý vybraný checkbox generuj otázku
        checked.forEach(cb => {
            const key = cb.value;
            const otazka = opatreniOtazky[key];
            if (!otazka) return;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'dynamic-question';
            
            // Zjisti, zda je otázka nepovinná
            const isOptional = otazka.optional === true;
            
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
                if (!isOptional) input.required = true;
                row.appendChild(input);
                wrapper.appendChild(row);
                if (isOptional) {
                    const optText = document.createElement('div');
                    optText.className = 'dynamic-optional';
                    optText.textContent = 'Nepovinný údaj';
                    wrapper.appendChild(optText);
                }
            } else if (otazka.type === 'radio') {
                const label = document.createElement('label');
                label.textContent = otazka.label;
                label.className = 'dynamic-label';
                wrapper.appendChild(label);
                otazka.options.forEach(opt => {
                    const radioLabel = document.createElement('label');
                    radioLabel.className = 'dynamic-radio';
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = key;
                    radio.value = opt;
                    if (!isOptional) radio.required = true;
                    radioLabel.appendChild(radio);
                    radioLabel.appendChild(document.createTextNode(' ' + opt));
                    wrapper.appendChild(radioLabel);
                });
                if (isOptional) {
                    const optText = document.createElement('div');
                    optText.className = 'dynamic-optional';
                    optText.textContent = 'Nepovinný údaj';
                    wrapper.appendChild(optText);
                }
            } else if (otazka.type === 'checkbox') {
                const label = document.createElement('label');
                label.textContent = otazka.label;
                label.className = 'dynamic-label';
                wrapper.appendChild(label);
                otazka.options.forEach(opt => {
                    const checkLabel = document.createElement('label');
                    checkLabel.className = 'dynamic-checkbox';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = key + '[]';
                    checkbox.value = opt;
                    checkLabel.appendChild(checkbox);
                    checkLabel.appendChild(document.createTextNode(' ' + opt));
                    wrapper.appendChild(checkLabel);
                });
                if (isOptional) {
                    const optText = document.createElement('div');
                    optText.className = 'dynamic-optional';
                    optText.textContent = 'Nepovinný údaj';
                    wrapper.appendChild(optText);
                }
            }
            
            dynamicQuestionsForm.appendChild(wrapper);
        });
        
        // Pokud je více než 5 otázek, přidej extra padding pro lepší scrollování
        if (checked.length > 5) {
            dynamicQuestionsForm.style.paddingBottom = '4rem';
        }
    }

    // Validace vyplnění všech povinných polí v kroku 4
    function validateDynamicQuestions() {
        if (!dynamicQuestionsForm) return false;
        const requiredInputs = dynamicQuestionsForm.querySelectorAll('input[required]');
        if (requiredInputs.length === 0) return true;
        for (let input of requiredInputs) {
            if (input.type === 'radio') {
                const name = input.name;
                if (!dynamicQuestionsForm.querySelector('input[name="' + name + '"]:checked')) {
                    return false;
                }
            } else if (input.type === 'number') {
                if (!input.value || Number(input.value) < Number(input.min)) {
                    return false;
                }
            }
        }
        return true;
    }

    // Krok 4: Aktivace tlačítka Pokračovat po vyplnění
    if (nextButtonStep4) {
        dynamicQuestionsForm && dynamicQuestionsForm.addEventListener('input', function() {
            // Pokud jsou všechny otázky nepovinné, tlačítko je vždy aktivní
            const allOptional = Array.from(dynamicQuestionsForm.querySelectorAll('.dynamic-question')).every(q => {
                const opt = q.querySelector('.dynamic-optional');
                return !!opt;
            });
            nextButtonStep4.disabled = !(allOptional || validateDynamicQuestions());
        });
        // Při generování otázek nastavíme tlačítko podle povinnosti
        nextButtonStep4.addEventListener('click', function(e) {
            e.preventDefault();
            currentStep = 5;
            updateProgress();
            showStep(currentStep);
        });
    }
    // Krok 4: Zpět
    if (backButtonStep4) {
        backButtonStep4.addEventListener('click', function(e) {
            e.preventDefault();
            currentStep = 3;
            updateProgress();
            showStep(currentStep);
        });
    }

    // Při přechodu na krok 4 vygeneruj otázky
    function showStepWithDynamic(stepNumber) {
        showStep(stepNumber);
        if (stepNumber === 4) {
            generateDynamicQuestions();
            // Pokud jsou všechny otázky nepovinné, tlačítko je aktivní
            const allOptional = Array.from(dynamicQuestionsForm.querySelectorAll('.dynamic-question')).every(q => {
                const opt = q.querySelector('.dynamic-optional');
                return !!opt;
            });
            nextButtonStep4 && (nextButtonStep4.disabled = !(allOptional || validateDynamicQuestions()));
        }
    }

    // Úprava: krok 3 -> 4 použije showStepWithDynamic
    if (nextButtonStep3) {
        nextButtonStep3.addEventListener('click', function() {
            currentStep = 4;
            updateProgress();
            showStepWithDynamic(currentStep);
        });
    }

    // Funkce pro kontrolu vyplnění všech polí
    function checkLokalitaInputs() {
        const ulice = uliceInput ? uliceInput.value.trim() : '';
        const psc = pscInput ? pscInput.value.trim() : '';
        const mesto = mestoInput ? mestoInput.value.trim() : '';
        nextButtonStep5 && (nextButtonStep5.disabled = !(ulice && psc && mesto));
    }

    // Přidám posluchače na inputy
    if (uliceInput && pscInput && mestoInput && nextButtonStep5) {
        uliceInput.addEventListener('input', checkLokalitaInputs);
        pscInput.addEventListener('input', checkLokalitaInputs);
        mestoInput.addEventListener('input', checkLokalitaInputs);
    }
    // Krok 5: Zpět
    if (backButtonStep5) {
        backButtonStep5.addEventListener('click', function(e) {
            e.preventDefault();
            currentStep = 4;
            updateProgress();
            showStep(currentStep);
        });
    }
    // Krok 5: Pokračovat (zatím jen přechod na další krok)
    if (nextButtonStep5) {
        nextButtonStep5.addEventListener('click', function(e) {
            e.preventDefault();
            // Pokud byl v kroku 1 vybrán rodinný nebo rekreační dům, zobraz krok 6, jinak přeskoč na 7
            if (selectedStep1 === 'rodinny-dum' || selectedStep1 === 'rekracni-dum') {
                currentStep = 6;
            } else {
                currentStep = 7;
            }
            updateProgress();
            showStep(currentStep);
        });
    }

    // Krok 6: Zpět
    const step6 = document.getElementById('step6');
    const backButtonStep6 = step6 ? step6.querySelector('.back-btn') : null;
    if (backButtonStep6) {
        backButtonStep6.addEventListener('click', function(e) {
            e.preventDefault();
            currentStep = 5;
            updateProgress();
            showStep(currentStep);
        });
    }
    // Krok 6: Pokračovat
    const nextButtonStep6 = step6 ? step6.querySelector('.next-btn') : null;
    if (nextButtonStep6) {
        nextButtonStep6.addEventListener('click', function(e) {
            e.preventDefault();
            currentStep = 7;
            updateProgress();
            showStep(currentStep);
        });
    }

    // Krok 7: Validace a navigace
    const step7 = document.getElementById('step7');
    const kontaktForm = document.getElementById('kontakt-form');
    const jmenoInput = document.getElementById('jmeno-input');
    const emailInput = document.getElementById('email-input');
    const souhlasInput = document.getElementById('souhlas-input');
    const nextButtonStep7 = step7 ? step7.querySelector('.next-btn') : null;
    const backButtonStep7 = step7 ? step7.querySelector('.back-btn') : null;

    function validateKontaktForm() {
        // Jméno, e-mail a souhlas musí být vyplněné
        const jmeno = jmenoInput ? jmenoInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const souhlas = souhlasInput ? souhlasInput.checked : false;
        // Jednoduchá validace e-mailu
        const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
        return jmeno && email && emailValid && souhlas;
    }

    if (kontaktForm && nextButtonStep7) {
        kontaktForm.addEventListener('input', function() {
            nextButtonStep7.disabled = !validateKontaktForm();
        });
        // Inicializace stavu tlačítka
        nextButtonStep7.disabled = true;
        // Ošetření submitu formuláře
        kontaktForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateKontaktForm()) {
                // Zde můžete zobrazit výsledek nebo přejít na další krok
                alert('Děkujeme! Výsledek vám bude zobrazen.');
                // currentStep = 8; // případně další krok
                // updateProgress();
                // showStep(currentStep);
            }
        });
    }
    // Krok 7: Zpět
    if (backButtonStep7) {
        backButtonStep7.addEventListener('click', function(e) {
            e.preventDefault();
            // Pokud byl v kroku 1 rodinný nebo rekreační dům, vrať na krok 6, jinak na 5
            if (selectedStep1 === 'rodinny-dum' || selectedStep1 === 'rekracni-dum') {
                currentStep = 6;
            } else {
                currentStep = 5;
            }
            updateProgress();
            showStep(currentStep);
        });
    }

    // Inicializace prvního kroku
    updateProgress();
    showStep(1);
});

// Funkce pro přesměrování na stránku výsledků
function redirectToResults() {
    // Zobrazíme načítací indikátor
    showLoadingIndicator();
    
    // Shromáždíme data z formuláře
    const formData = collectFormData();
    
    // Získáme základní URL serveru nebo použijeme relativní cestu
    const apiUrl = '/api/submit-dotace';
    
    // Odešleme data na backend API
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        // Skryjeme načítací indikátor
        hideLoadingIndicator();
        
        if (data.success) {
            // Uložíme data pro zobrazení na stránce výsledků
            localStorage.setItem('dotaceResults', JSON.stringify(data.data));
            // Přesměrujeme na stránku výsledků
            window.location.href = 'results.html';
        } else {
            // Zobrazíme chybovou zprávu
            alert(data.error || 'Došlo k chybě při zpracování výpočtu, zkuste to prosím znovu');
        }
    })
    .catch(error => {
        console.error('Chyba při komunikaci s API:', error);
        hideLoadingIndicator();
        alert('Došlo k chybě při komunikaci se serverem, zkuste to prosím znovu');
    });
}

// Funkce pro shromáždění dat z formuláře
function collectFormData() {
    // Typ nemovitosti (krok 1)
    const typNemovitosti = document.querySelector('#step1 .option-btn.selected')
        ? document.querySelector('#step1 .option-btn.selected').getAttribute('data-value')
        : null;
    
    // Rok výstavby (krok 2)
    const rokVystavby = document.querySelector('#step2 .option-btn.selected')
        ? document.querySelector('#step2 .option-btn.selected').getAttribute('data-value')
        : null;
    
    // Vybraná opatření (krok 3)
    const opatreni = Array.from(document.querySelectorAll('#step3 input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    // Detaily opatření (krok 4) - dynamicky generované otázky
    const detailyOpatreni = {};
    if (document.getElementById('dynamic-questions')) {
        opatreni.forEach(op => {
            const inputs = document.querySelectorAll(`input[name="${op}"], input[name^="${op}["]`);
            if (inputs.length > 0) {
                if (inputs[0].type === 'radio') {
                    const checkedRadio = Array.from(inputs).find(input => input.checked);
                    if (checkedRadio) {
                        detailyOpatreni[op] = checkedRadio.value;
                    }
                } else if (inputs[0].type === 'checkbox') {
                    detailyOpatreni[op] = Array.from(inputs)
                        .filter(cb => cb.checked)
                        .map(cb => cb.value);
                } else {
                    detailyOpatreni[op] = inputs[0].value;
                }
            }
        });
    }
    
    // Lokalita (krok 5)
    const lokalita = {
        adresa: document.getElementById('ulice-input') ? document.getElementById('ulice-input').value : '',
        mesto: document.getElementById('mesto-input') ? document.getElementById('mesto-input').value : '',
        psc: document.getElementById('psc-input') ? document.getElementById('psc-input').value : ''
    };
    
    // Doplňující údaje o nemovitosti (krok 6) - pokud existují
    const doplnujiciUdaje = {};
    if (document.getElementById('step6')) {
        const vytapenaPlocha = document.getElementById('vytapena-plocha');
        const pocetPodlazi = document.getElementById('pocet-podlazi');
        
        if (vytapenaPlocha) doplnujiciUdaje.vytapenaPlocha = vytapenaPlocha.value;
        if (pocetPodlazi) doplnujiciUdaje.pocetPodlazi = pocetPodlazi.value;
    }
    
    // Kontaktní údaje (krok 7)
    const kontakt = {
        jmeno: document.getElementById('jmeno-input') ? document.getElementById('jmeno-input').value : '',
        email: document.getElementById('email-input') ? document.getElementById('email-input').value : '',
        telefon: document.getElementById('telefon-input') ? document.getElementById('telefon-input').value : '',
        souhlas: document.getElementById('souhlas-input') ? document.getElementById('souhlas-input').checked : false
    };
    
    // Kompletní data formuláře
    return {
        typ_nemovitosti: typNemovitosti,
        rok_vystavby: rokVystavby,
        opatreni: opatreni,
        detaily_opatreni: detailyOpatreni,
        lokalita: lokalita,
        doplnujici_udaje: doplnujiciUdaje,
        kontakt: kontakt
    };
}

// Funkce pro zobrazení načítacího indikátoru
function showLoadingIndicator() {
    // Vytvoříme overlay pro načítání, pokud ještě neexistuje
    if (!document.getElementById('loading-overlay')) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Probíhá výpočet dotací...</p>
        `;
        document.body.appendChild(loadingOverlay);
        
        // Přidáme CSS styly pro loading overlay
        const style = document.createElement('style');
        style.innerHTML = `
            #loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
            }
            .loading-spinner {
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid var(--primary-blue);
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    } else {
        document.getElementById('loading-overlay').style.display = 'flex';
    }
}

// Funkce pro skrytí načítacího indikátoru
function hideLoadingIndicator() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Přidání event listeneru na tlačítko "Zobrazit výsledek"
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.querySelector('#step7 .next-btn');
    if (submitButton) {
        submitButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Kontrola vyplnění povinných polí
            const jmenoInput = document.getElementById('jmeno-input');
            const emailInput = document.getElementById('email-input');
            const souhlasInput = document.getElementById('souhlas-input');
            
            if (jmenoInput && emailInput && souhlasInput) {
                if (jmenoInput.value.trim() === '') {
                    alert('Vyplňte prosím jméno a příjmení');
                    return;
                }
                
                if (emailInput.value.trim() === '' || !emailInput.value.includes('@')) {
                    alert('Zadejte prosím platný email');
                    return;
                }
                
                if (!souhlasInput.checked) {
                    alert('Pro pokračování je potřeba souhlasit se zpracováním údajů');
                    return;
                }
                
                // Pokud je vše správně vyplněno, přesměrujeme na stránku s výsledky
                redirectToResults();
            }
        });
    }
}); 