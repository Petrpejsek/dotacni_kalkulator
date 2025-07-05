// 🌍 GLOBÁLNÍ DEFINICE - Mapa opatření a jejich otázek
// Tento objekt je používán jak v hlavním skriptu, tak v auto-save systému
// Podporuje jak jednoduché otázky, tak více podotázek pro jednu sekci
window.opatreniOtazky = {
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
        // 🆕 Více podotázek pro fotovoltaiku
        'pozadovany-vykon': {
            label: 'Jaký výkon FVE systému plánujete?\n(v kWp)',
            type: 'number',
            min: 1,
            placeholder: 'Např. 5',
        },
        'strecha-na-sever': {
            label: 'Jaká je orientace vaší střechy?',
            type: 'radio',
            options: ['jih', 'jihovýchod', 'jihozápad', 'východ', 'západ', 'sever', 'nevím'],
        },
        'stav-strechy': {
            label: 'Jaký je stav střechy?',
            type: 'radio',
            options: ['dobrý', 'nutná drobná oprava', 'nutná větší oprava', 'nevím'],
        }
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

document.addEventListener('DOMContentLoaded', function () {
    // Inicializace proměnných
    let currentStep = 1;
    let loadedHistoricalData = null;
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

    // Místní odkaz na globální definici pro kompatibilitu
    const opatreniOtazky = window.opatreniOtazky;

    // 🆕 Pomocné funkce pro práci s podotázkami
    function hasSubQuestions(opatreniKey) {
        const otazka = opatreniOtazky[opatreniKey];
        if (!otazka) return false;

        // Pokud má otázka vlastnost 'type', je to jednoduchá otázka
        // Pokud nemá 'type', ale má vlastnosti s objekty, jsou to podotázky
        return !otazka.type && typeof otazka === 'object' && otazka !== null;
    }

    function getSubQuestions(opatreniKey) {
        const otazka = opatreniOtazky[opatreniKey];
        if (!hasSubQuestions(opatreniKey)) return {};

        return Object.keys(otazka)
            .filter(key => typeof otazka[key] === 'object' && otazka[key] !== null && otazka[key].type)
            .reduce((acc, key) => {
                acc[key] = otazka[key];
                return acc;
            }, {});
    }

    function getSimpleQuestion(opatreniKey) {
        const otazka = opatreniOtazky[opatreniKey];
        if (hasSubQuestions(opatreniKey)) return null;
        return otazka;
    }

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
        console.log("UPDATE PROGRESS " + currentStep + " / " + totalSteps);
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progress}%`;
        console.log(progress);
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed', 'clickable');

            // Zkontroluj, jestli je to textový krok (posledný krok s textem)
            const isTextStep = step.classList.contains('text-step') ||
                (index === steps.length - 1 && isNaN(step.textContent.trim()));

            if (index + 1 === currentStep) {
                step.classList.add('active');
            } else if (index + 1 < currentStep) {
                step.classList.add('completed');
                // Číselné kroky mohou být klikatelné, textové ne
                if (!isTextStep) {
                    step.classList.add('clickable');
                }
            }
        });
    }

    // Funkce pro přepínání mezi kroky
    function showStep(stepNumber) {
        console.log("SHOW STEP " + stepNumber);
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
        button.addEventListener('click', async function () {
            optionButtonsStep1.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            const selectedValue = this.getAttribute('data-value');
            selectedStep1 = selectedValue;

            // 🆕 AUTO-SAVE: Vytvoření nové žádosti při prvním výběru
            try {
                if (window.kalkulatorAutoSave && !window.kalkulatorAutoSave.getCurrentUUID()) {
                    await window.kalkulatorAutoSave.createNewRequest(selectedValue);
                    console.log('🆕 Nová žádost vytvořena s UUID');
                }
            } catch (error) {
                console.error('❌ Chyba při vytváření žádosti:', error);
                // Pokračujeme i při chybě auto-save
            }

            if (selectedValue === 'jiny') {
                // Zobrazit pole pro jiný typ nemovitosti a navigační tlačítka
                jinyExtraField.style.display = 'flex';
                jinyExtraField.innerHTML = `
                    <label class="dynamic-label" for="jiny-input">Doplňte typ nemovitosti:</label>
                    <input type="text" id="jiny-input" class="dynamic-input" placeholder="Například: Garáž, Skladiště, Kancelář...">
                    <button class="next-btn" id="jiny-input-next">Pokračovat</button>
                `;

                const jinyInput = document.getElementById('jiny-input');
                const jinyInputNext = document.getElementById('jiny-input-next');
                jinyInputNext.disabled = true;

                if (jinyInput) {
                    jinyInput.addEventListener('input', function () {
                        jinyInputNext.disabled = this.value.trim() === '';
                    });

                    jinyInputNext.addEventListener('click', async function () {
                        // 🆕 AUTO-SAVE: Uložení vlastního typu nemovitosti
                        try {
                            const customType = jinyInput.value.trim();
                            if (window.kalkulatorAutoSave) {
                                await window.kalkulatorAutoSave.saveStepData(1, {
                                    typ_nemovitosti: 'jiny',
                                    vlastni_typ: customType
                                });
                            }
                        } catch (error) {
                            console.error('❌ Chyba při ukládání vlastního typu:', error);
                        }

                        currentStep = 2;
                        updateProgress();
                        showStep(currentStep);
                    });
                }
            } else {
                // Při kliknutí na jiné tlačítko než "Jiný" skryjeme navigační tlačítka a input pole
                jinyExtraField.style.display = 'none';

                // 🆕 AUTO-SAVE: Uložení standardního typu nemovitosti
                try {
                    if (window.kalkulatorAutoSave) {
                        await window.kalkulatorAutoSave.saveStepData(1, {
                            typ_nemovitosti: selectedValue
                        });
                    }
                } catch (error) {
                    console.error('❌ Chyba při ukládání typu nemovitosti:', error);
                }

                // Rovnou přejdeme na další krok
                currentStep = 2;
                updateProgress();
                showStep(currentStep);
            }
        });
    });

    // Krok 2: Po kliknutí na možnost automaticky přejdi na další krok
    optionButtonsStep2.forEach(button => {
        button.addEventListener('click', async function () {
            optionButtonsStep2.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            const selectedValue = this.getAttribute('data-value');

            // 🆕 AUTO-SAVE: Uložení roku výstavby
            try {
                if (window.kalkulatorAutoSave) {
                    await window.kalkulatorAutoSave.saveStepData(2, {
                        rok_vystavby: selectedValue
                    });
                }
            } catch (error) {
                console.error('❌ Chyba při ukládání roku výstavby:', error);
            }

            currentStep = 3;
            updateProgress();
            showStep(currentStep);
        });
    });

    // Krok 2: Zpět
    if (backButtonStep2) {
        backButtonStep2.addEventListener('click', function () {
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
        nextButtonStep3.addEventListener('click', async function () {
            // 🆕 AUTO-SAVE: Uložení vybraných opatření
            try {
                if (window.kalkulatorAutoSave) {
                    const selectedOpatreni = Array.from(checkboxesStep3)
                        .filter(cb => cb.checked)
                        .map(cb => cb.value);

                    await window.kalkulatorAutoSave.saveStepData(3, {
                        opatreni: selectedOpatreni
                    });
                }
            } catch (error) {
                console.error('❌ Chyba při ukládání opatření:', error);
            }

            currentStep = 4;
            updateProgress();
            showStep(currentStep);
        });
    }
    // Krok 3: Zpět
    if (backButtonStep3) {
        backButtonStep3.addEventListener('click', function () {
            if (currentStep > 1) {
                currentStep--;
                updateProgress();
                showStep(currentStep);
            }
        });
    }

    // Kliknutí na předchozí kroky v progress baru (kroky 1 a 2)
    steps.forEach((step, index) => {
        step.addEventListener('click', function () {
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

        // Pro každý vybraný checkbox generuj otázku(y)
        checked.forEach(cb => {
            const key = cb.value;

            // 🆕 Zkontroluj, zda má opatření podotázky
            if (hasSubQuestions(key)) {
                // Generuj podotázky
                const subQuestions = getSubQuestions(key);
                Object.keys(subQuestions).forEach(subKey => {
                    const subQuestion = subQuestions[subKey];
                    const fullKey = key + '-' + subKey; // např. "fotovoltaika-pozadovany-vykon"

                    const wrapper = document.createElement('div');
                    wrapper.className = 'dynamic-question';
                    wrapper.setAttribute('data-main-key', key);
                    wrapper.setAttribute('data-sub-key', subKey);

                    generateSingleQuestion(wrapper, subQuestion, fullKey, subQuestion.optional === true);
                    dynamicQuestionsForm.appendChild(wrapper);
                });
            } else {
                // Generuj jednoduchou otázku
                const simpleQuestion = getSimpleQuestion(key);
                if (!simpleQuestion) return;

                const wrapper = document.createElement('div');
                wrapper.className = 'dynamic-question';
                wrapper.setAttribute('data-main-key', key);

                generateSingleQuestion(wrapper, simpleQuestion, key, simpleQuestion.optional === true);
                dynamicQuestionsForm.appendChild(wrapper);
            }
        });


        if (loadedHistoricalData) {
            window.kalkulatorAutoSave.fillDynamicQuestionsValues(loadedHistoricalData);
        }
        // Pokud je více než 5 otázek, přidej extra padding pro lepší scrollování
        if (checked.length > 5) {
            dynamicQuestionsForm.style.paddingBottom = '4rem';
        }
    }

    // 🆕 Pomocná funkce pro generování jedné otázky
    function generateSingleQuestion(wrapper, otazka, inputName, isOptional) {
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
                radio.name = inputName;
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
                checkbox.name = inputName + '[]';
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
    }

    // Validace vyplnění všech povinných polí v kroku 4
    function validateDynamicQuestions() {
        if (!dynamicQuestionsForm) return false;
        const requiredInputs = dynamicQuestionsForm.querySelectorAll('input[required]');
        if (requiredInputs.length === 0) return true;

        // Seskupíme povinné inputy podle jména pro radio buttony
        const inputGroups = {};
        for (let input of requiredInputs) {
            const name = input.name;
            if (!inputGroups[name]) {
                inputGroups[name] = [];
            }
            inputGroups[name].push(input);
        }

        // Validujeme každou skupinu
        for (const [name, inputs] of Object.entries(inputGroups)) {
            const firstInput = inputs[0];

            if (firstInput.type === 'radio') {
                // Pro radio buttony: alespoň jeden musí být vybrán
                if (!dynamicQuestionsForm.querySelector('input[name="' + name + '"]:checked')) {
                    return false;
                }
            } else if (firstInput.type === 'number') {
                // Pro number inputy: hodnota musí být vyplněna a >= min
                if (!firstInput.value || Number(firstInput.value) < Number(firstInput.min)) {
                    return false;
                }
            }
        }

        return true;
    }

    // Krok 4: Aktivace tlačítka Pokračovat po vyplnění
    if (nextButtonStep4) {
        dynamicQuestionsForm && dynamicQuestionsForm.addEventListener('input', function () {
            // Pokud jsou všechny otázky nepovinné, tlačítko je vždy aktivní
            const allOptional = Array.from(dynamicQuestionsForm.querySelectorAll('.dynamic-question')).every(q => {
                const opt = q.querySelector('.dynamic-optional');
                return !!opt;
            });
            nextButtonStep4.disabled = !(allOptional || validateDynamicQuestions());
        });
        // Při generování otázek nastavíme tlačítko podle povinnosti
        nextButtonStep4.addEventListener('click', async function (e) {
            e.preventDefault();

            // 🆕 AUTO-SAVE: Uložení doplňujících údajů
            try {
                if (window.kalkulatorAutoSave) {
                    const doplnujiciUdaje = {};

                    // Získej aktuální vybrané opatření
                    const opatreni = Array.from(document.querySelectorAll('#step3 input[type="checkbox"]:checked'))
                        .map(cb => cb.value);

                    // Sběr dat podle struktury opatření
                    opatreni.forEach(op => {
                        if (hasSubQuestions(op)) {
                            // Sber data z podotázek
                            const subQuestions = getSubQuestions(op);
                            doplnujiciUdaje[op] = {};

                            Object.keys(subQuestions).forEach(subKey => {
                                const fullInputName = op + '-' + subKey;
                                const inputs = dynamicQuestionsForm.querySelectorAll(`input[name="${fullInputName}"], input[name^="${fullInputName}["]`);

                                if (inputs.length > 0) {
                                    if (inputs[0].type === 'radio') {
                                        const checkedRadio = Array.from(inputs).find(input => input.checked);
                                        if (checkedRadio) {
                                            doplnujiciUdaje[op][subKey] = checkedRadio.value;
                                        }
                                    } else if (inputs[0].type === 'checkbox') {
                                        const checkedBoxes = Array.from(inputs).filter(cb => cb.checked).map(cb => cb.value);
                                        if (checkedBoxes.length > 0) {
                                            doplnujiciUdaje[op][subKey] = checkedBoxes;
                                        }
                                    } else if (inputs[0].type === 'number') {
                                        if (inputs[0].value) {
                                            doplnujiciUdaje[op][subKey] = inputs[0].value;
                                        }
                                    }
                                }
                            });
                        } else {
                            // Sber data z jednoduché otázky
                            const inputs = dynamicQuestionsForm.querySelectorAll(`input[name="${op}"], input[name^="${op}["]`);
                            if (inputs.length > 0) {
                                if (inputs[0].type === 'radio') {
                                    const checkedRadio = Array.from(inputs).find(input => input.checked);
                                    if (checkedRadio) {
                                        doplnujiciUdaje[op] = checkedRadio.value;
                                    }
                                } else if (inputs[0].type === 'checkbox') {
                                    const checkedBoxes = Array.from(inputs).filter(cb => cb.checked).map(cb => cb.value);
                                    if (checkedBoxes.length > 0) {
                                        doplnujiciUdaje[op] = checkedBoxes;
                                    }
                                } else if (inputs[0].type === 'number') {
                                    if (inputs[0].value) {
                                        doplnujiciUdaje[op] = inputs[0].value;
                                    }
                                }
                            }
                        }
                    });

                    await window.kalkulatorAutoSave.saveStepData(4, {
                        doplnujici_udaje: doplnujiciUdaje
                    });
                }
            } catch (error) {
                console.error('❌ Chyba při ukládání doplňujících údajů:', error);
            }

            currentStep = 5;
            updateProgress();
            showStep(currentStep);
        });
    }
    // Krok 4: Zpět
    if (backButtonStep4) {
        backButtonStep4.addEventListener('click', function (e) {
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
        nextButtonStep3.addEventListener('click', function () {
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
        backButtonStep5.addEventListener('click', function (e) {
            e.preventDefault();
            currentStep = 4;
            updateProgress();
            showStep(currentStep);
        });
    }
    // Krok 5: Pokračovat (zatím jen přechod na další krok)
    if (nextButtonStep5) {
        nextButtonStep5.addEventListener('click', async function (e) {
            e.preventDefault();

            // 🆕 AUTO-SAVE: Uložení lokality
            try {
                if (window.kalkulatorAutoSave) {
                    const lokalita = {
                        adresa: uliceInput ? uliceInput.value.trim() : '',
                        mesto: mestoInput ? mestoInput.value.trim() : '',
                        psc: pscInput ? pscInput.value.trim() : ''
                    };

                    await window.kalkulatorAutoSave.saveStepData(5, {
                        lokalita: lokalita
                    });
                }
            } catch (error) {
                console.error('❌ Chyba při ukládání lokality:', error);
            }

            console.log("SELECTED STEP 1 " + selectedStep1);

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
        backButtonStep6.addEventListener('click', function (e) {
            e.preventDefault();
            currentStep = 5;
            updateProgress();
            showStep(currentStep);
        });
    }
    // Krok 6: Pokračovat
    const nextButtonStep6 = step6 ? step6.querySelector('.next-btn') : null;
    if (nextButtonStep6) {
        nextButtonStep6.addEventListener('click', async function (e) {
            e.preventDefault();

            // 🆕 AUTO-SAVE: Uložení sociální situace
            try {
                if (window.kalkulatorAutoSave) {
                    const socialniSituace = Array.from(
                        document.querySelectorAll('#step6 input[name="social"]:checked')
                    ).map(checkbox => checkbox.value);

                    await window.kalkulatorAutoSave.saveStepData(6, {
                        socialni_situace: socialniSituace
                    });
                }
            } catch (error) {
                console.error('❌ Chyba při ukládání sociální situace:', error);
            }

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
        nextButtonStep7.disabled = !(jmeno && email && emailValid && souhlas);
        return jmeno && email && emailValid && souhlas;
    }

    if (kontaktForm && nextButtonStep7) {
        kontaktForm.addEventListener('input', function () {
            validateKontaktForm();
        });
        // Inicializace stavu tlačítka
        nextButtonStep7.disabled = true;
        // Ošetření submitu formuláře
        kontaktForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (validateKontaktForm()) {
                // 🆕 AUTO-SAVE: Uložení kontaktních údajů před finálním odesláním
                try {
                    if (window.kalkulatorAutoSave) {
                        const kontakt = {
                            jmeno: jmenoInput ? jmenoInput.value.trim() : '',
                            email: emailInput ? emailInput.value.trim() : '',
                            telefon: document.getElementById('telefon-input') ? document.getElementById('telefon-input').value.trim() : '',
                            souhlas: souhlasInput ? souhlasInput.checked : false
                        };

                        await window.kalkulatorAutoSave.saveStepData(7, {
                            kontakt: kontakt
                        });
                    }
                } catch (error) {
                    console.error('❌ Chyba při ukládání kontaktních údajů:', error);
                    // Pokračujeme i při chybě auto-save
                }

                // Pokračujeme s původní funkcionalitou
                redirectToResults();
            }
        });
    }
    // Krok 7: Zpět
    if (backButtonStep7) {
        backButtonStep7.addEventListener('click', function (e) {
            e.preventDefault();
            console.log("SELECTED STEP 1 " + selectedStep1);
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
                    selectedStep1 = data.typ_nemovitosti;
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

                updateNextBtnStep3();

                // 🆕 Generování dynamických otázek pro krok 4 po obnovení checkboxů
                this.generateAndRestoreDynamicQuestions(data);
                loadedHistoricalData = data;
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

                checkLokalitaInputs();
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
                validateKontaktForm();
            }

            // Přejití na správný krok
            requestData.step++;
            if (requestData.step === 6) {
                if (selectedStep1 === 'rodinny-dum' || selectedStep1 === 'rekracni-dum') {
                    requestData.step = 6;
                } else {
                    requestData.step = 7;
                }
            }
            if (requestData.step > 1) {
                // Aktualizace současného kroku v hlavním skriptu
                currentStep = requestData.step;

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
                console.log(numberInput);
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
});

// Funkce pro přesměrování na stránku výsledků
function redirectToResults() {
    console.log('🚀 Starting redirectToResults...');

    // Zobrazíme načítací indikátor
    showLoadingIndicator();

    // Shromáždíme data z formuláře
    const formData = collectFormData();
    console.log('📝 Collected form data:', formData);

    // Inteligentní detekce API URL pro PHP
    let apiUrl;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Lokální vývoj - backend běží na portu 3000
        apiUrl = 'http://localhost/dotacni_kalkulator/index.php';
    } else if (window.location.hostname === 'enermio.cz' || window.location.hostname === 'www.enermio.cz') {
        // Lokální vývoj - backend běží na portu 3000
        apiUrl = '/dotacni-kalkulator/store-form.php';
    } else {
        // Production - PHP server
        apiUrl = '/index.php';
    }
    console.log('🌐 API URL:', apiUrl);

    // Odešleme data na backend API
    console.log('📤 Sending request to backend...');
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
        .then(response => {
            console.log('📥 Received response:', response);
            console.log('📊 Response status:', response.status);
            console.log('📊 Response ok:', response.ok);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        })
        .then(data => {
            console.log('✅ Response data:', data);

            // Skryjeme načítací indikátor
            hideLoadingIndicator();

            if (data.success) {
                console.log('🎉 Success! Storing data and redirecting...');
                // Uložíme data pro zobrazení na stránce výsledků
                localStorage.setItem('dotaceResults', JSON.stringify(data.data));
                console.log('💾 Data stored in localStorage');
                // Přesměrujeme na stránku výsledků
                window.location.href = 'results.html';
            } else {
                console.error('❌ Backend returned error:', data.error);
                // Zobrazíme chybovou zprávu
                alert(data.error || 'Došlo k chybě při zpracování výpočtu, zkuste to prosím znovu');
            }
        })
        .catch(error => {
            console.error('💥 Error during fetch:', error);
            hideLoadingIndicator();

            // Poskytnutí více konkrétních informací o chybě
            let errorMessage = 'Došlo k chybě při komunikaci se serverem.';

            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Nelze se připojit k serveru. Zkontrolujte prosím připojení k internetu a zkuste to znovu.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Vypršel časový limit. Server je momentálně přetížený, zkuste to prosím za chvíli.';
            } else if (error.message.includes('HTTP error')) {
                errorMessage = 'Server je momentálně nedostupný. Zkuste to prosím za chvíli.';
            }

            alert(errorMessage + '\n\nPokud problém přetrvává, kontaktujte prosím podporu.');
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
            // 🆕 Zkontroluj, zda má opatření podotázky
            if (window.kalkulatorAutoSave.hasSubQuestions(op)) {
                // Sber data z podotázek
                const subQuestions = window.kalkulatorAutoSave.getSubQuestions(op);
                detailyOpatreni[op] = {};

                Object.keys(subQuestions).forEach(subKey => {
                    const fullInputName = op + '-' + subKey;
                    const inputs = document.querySelectorAll(`input[name="${fullInputName}"], input[name^="${fullInputName}["]`);

                    if (inputs.length > 0) {
                        if (inputs[0].type === 'radio') {
                            const checkedRadio = Array.from(inputs).find(input => input.checked);
                            if (checkedRadio) {
                                detailyOpatreni[op][subKey] = checkedRadio.value;
                            }
                        } else if (inputs[0].type === 'checkbox') {
                            const checkedBoxes = Array.from(inputs).filter(cb => cb.checked).map(cb => cb.value);
                            if (checkedBoxes.length > 0) {
                                detailyOpatreni[op][subKey] = checkedBoxes;
                            }
                        } else if (inputs[0].type === 'number') {
                            if (inputs[0].value) {
                                detailyOpatreni[op][subKey] = inputs[0].value;
                            }
                        }
                    }
                });
            } else {
                // Sber data z jednoduché otázky
                const inputs = document.querySelectorAll(`input[name="${op}"], input[name^="${op}["]`);
                if (inputs.length > 0) {
                    if (inputs[0].type === 'radio') {
                        const checkedRadio = Array.from(inputs).find(input => input.checked);
                        if (checkedRadio) {
                            detailyOpatreni[op] = checkedRadio.value;
                        }
                    } else if (inputs[0].type === 'checkbox') {
                        const checkedBoxes = Array.from(inputs).filter(cb => cb.checked).map(cb => cb.value);
                        if (checkedBoxes.length > 0) {
                            detailyOpatreni[op] = checkedBoxes;
                        }
                    } else if (inputs[0].type === 'number') {
                        if (inputs[0].value) {
                            detailyOpatreni[op] = inputs[0].value;
                        }
                    }
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

    // Sociální situace (krok 6)
    const socialniSituace = Array.from(document.querySelectorAll('#step6 input[name="social"]:checked'))
        .map(checkbox => checkbox.value);

    // Doplňující údaje o nemovitosti - pokud existují další pole
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
        socialni_situace: socialniSituace,
        doplnujici_udaje: doplnujiciUdaje,
        kontakt: kontakt,
        current_uuid: window.kalkulatorAutoSave.getCurrentUUID()
    };
}

// Funkce pro zobrazení načítacího indikátoru s rotujícími hláškami
function showLoadingIndicator() {
    // Vytvoříme overlay pro načítání, pokud ještě neexistuje
    if (!document.getElementById('loading-overlay')) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-card">
                <div class="loading-spinner">⚙️</div>
                <div class="loading-message" id="loading-message">🔄 Přepočítáváme vaše možnosti dotací...</div>
                <div class="loading-subtitle">Zpracování může chvíli trvat, prosíme o strpení</div>
            </div>
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
                background: linear-gradient(135deg, rgba(0, 102, 204, 0.1), rgba(255, 107, 0, 0.1));
                backdrop-filter: blur(5px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease-in;
            }
            
            .loading-card {
                background: #ffffff;
                border-radius: 16px;
                padding: 3rem 2.5rem;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 500px;
                width: 90%;
                margin: 2rem;
            }
            
            .loading-spinner {
                font-size: 3rem;
                margin-bottom: 1.5rem;
                animation: spin 2s linear infinite;
                display: inline-block;
            }
            
            .loading-message {
                font-size: 1.25rem;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 1rem;
                min-height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 1;
                transition: opacity 0.5s ease-in-out;
            }
            
            .loading-message.fade-out {
                opacity: 0;
            }
            
            .loading-subtitle {
                font-size: 0.95rem;
                color: #7f8c8d;
                font-weight: 400;
                line-height: 1.5;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            
            @media (max-width: 600px) {
                .loading-card {
                    padding: 2rem 1.5rem;
                    margin: 1rem;
                }
                
                .loading-message {
                    font-size: 1.1rem;
                    min-height: 50px;
                }
                
                .loading-spinner {
                    font-size: 2.5rem;
                }
            }
        `;
        document.head.appendChild(style);

        // Spustíme rotování hlášek
        startMessageRotation();
    } else {
        document.getElementById('loading-overlay').style.display = 'flex';
        startMessageRotation();
    }
}

// Funkce pro rotování hlášek
function startMessageRotation() {
    const messages = [
        "🔄 Přepočítáváme vaše možnosti dotací...",
        "📊 Vyhodnocujeme technická opatření dle zadání...",
        "🧾 Kontrolujeme nárok na zálohové vyplacení...",
        "💬 Vytváříme přehled vašich dostupných podpor..."
    ];

    let currentIndex = 0;
    const messageElement = document.getElementById('loading-message');

    if (!messageElement) return;

    // Uložíme interval ID pro možnost zastavení
    if (!window.loadingMessageInterval) {
        window.loadingMessageInterval = setInterval(() => {
            // Fade out efekt
            messageElement.classList.add('fade-out');

            setTimeout(() => {
                currentIndex = (currentIndex + 1) % messages.length;
                messageElement.textContent = messages[currentIndex];
                messageElement.classList.remove('fade-out');
            }, 250);
        }, 6000);
    }
}

// Funkce pro skrytí načítacího indikátoru
function hideLoadingIndicator() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    // Zastavíme rotování hlášek
    if (window.loadingMessageInterval) {
        clearInterval(window.loadingMessageInterval);
        window.loadingMessageInterval = null;
    }
}

// Přidání event listeneru na tlačítko "Zobrazit výsledek"
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.querySelector('#step7 .next-btn');
    if (submitButton) {
        submitButton.addEventListener('click', function (e) {
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