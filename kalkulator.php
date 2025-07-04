<?php

$config = require_once 'config.php';


//ukladat do logu requesty a response do AI vcetne casu pozadavku
//dotace-tags neobsahují nazev a bonus
//udelat at to pri zahajeni kalkulatoru pri prvnim POST uz vlozi zaznam do DB a da si to do GETu nejaky identifikator na pokracovani




?><!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dotační kalkulačka - Enermio</title>
    <link rel="stylesheet" href="styles.css">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
</head>
<body>
<header class="main-header">
    <div class="header-container">
        <div class="header-left">
            <a href="/" class="logo-link">
                <img src="enermio_logo.png" alt="Logo Enermio" class="logo">
            </a>
        </div>
        <div class="header-center">
            <h1 class="main-title">Dotační kalkulačka</h1>
        </div>
        <div class="header-right">
            <img src="nova_zelena_usporam.png" alt="Nová zelená úsporám" class="header-logo nzu-logo">
            <img src="oprav_dum.png" alt="Oprav dům" class="header-logo opravdum-logo">
        </div>
    </div>
</header>
<div class="container">
    <!-- Progress bar -->
    <div class="progress-container">
        <div class="progress-bar">
            <div class="progress" id="progress"></div>
        </div>
        <div class="steps">
            <div class="step active">1</div>
            <div class="step">2</div>
            <div class="step">3</div>
            <div class="step">4</div>
            <div class="step">5</div>
            <div class="step">6</div>
            <div class="step">7</div>
        </div>
    </div>

    <!-- Kalkulačka container -->
    <div class="calculator-container">
        <!-- Krok 1: Typ nemovitosti -->
        <div class="step-content active" id="step1">
            <h2>O jaký typ nemovitosti se jedná?</h2>
            <div class="options-grid" id="options-grid-step1">
                <button class="option-btn" data-value="rodinny-dum">
                    <img src="icons/house.svg" alt="Rodinný dům">
                    <span>Rodinný dům</span>
                </button>
                <button class="option-btn" data-value="rekracni-dum">
                    <img src="icons/house.svg" alt="Rekreační dům">
                    <span>Rekreační dům</span>
                </button>
                <button class="option-btn" data-value="bytovy-dum">
                    <img src="icons/building.svg" alt="Bytový dům">
                    <span>Bytový dům</span>
                </button>
                <button class="option-btn" data-value="verejna-budova">
                    <img src="icons/building.svg" alt="Veřejná budova">
                    <span>Veřejná budova</span>
                </button>
                <button class="option-btn" data-value="provozovna">
                    <img src="icons/factory.svg" alt="Provozovna">
                    <span>Provozovna</span>
                </button>
                <div class="jiny-row-wrapper">
                    <button class="option-btn" data-value="jiny">
                        <img src="icons/other.svg" alt="Jiný">
                        <span>Jiný</span>
                    </button>
                    <div id="jiny-extra-field" style="display:none;"></div>
                </div>
            </div>
            <!-- Navigační tlačítka - budou zobrazena pouze po kliknutí na Jiný -->
        </div>

        <!-- Krok 2: Rok výstavby -->
        <div class="step-content" id="step2">
            <div class="heading-with-tooltip">
                <h2>Kdy byla nemovitost postavena?</h2>
                <p class="heading-subtitle">Ovlivňuje výši dotace i oprávněnost v některých programech</p>
            </div>
            <div class="vertical-options-grid">
                <button class="option-btn" data-value="before-1950">Před rokem 1950</button>
                <button class="option-btn" data-value="1950-1980">1950–1980</button>
                <button class="option-btn" data-value="1981-2000">1981–2000</button>
                <button class="option-btn" data-value="after-2000">Po roce 2000</button>
            </div>
            <div class="navigation-buttons">
                <button class="back-btn">Zpět</button>
            </div>
        </div>

        <!-- Krok 3: Plánovaná opatření -->
        <div class="step-content" id="step3">
            <h2>Jaká opatření zvažujete nebo plánujete?</h2>
            <div class="checkbox-columns">
                <div class="checkbox-col">
                    <label class="checkbox-option">
                        <input type="checkbox" value="zatepleni-sten">
                        <span>Zateplení obvodových stěn</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" value="vymena-oken">
                        <span>Výměna oken a dveří</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" value="fotovoltaika">
                        <span>Fotovoltaika (FVE)</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" value="rekuperace">
                        <span>Rekuperace</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" value="rizene-vetrani">
                        <span>Řízené větrání</span>
                    </label>
                </div>
                <div class="checkbox-col">
                    <label class="checkbox-option">
                        <input type="checkbox" value="zatepleni-strechy">
                        <span>Zateplení střechy / stropu</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" value="tepelne-cerpadlo">
                        <span>Tepelné čerpadlo (TČ)</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" value="ohrev-vody-fv">
                        <span>Ohřev vody z FVE</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" value="destova-voda">
                        <span>Využití dešťové vody</span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" value="rizeni-spotreby">
                        <span>Řízení spotřeby (např. baterie, bateriové úložiště, smart řízení)</span>
                    </label>
                </div>
            </div>
            <div class="navigation-buttons">
                <button class="back-btn">Zpět</button>
                <button class="next-btn" disabled>Pokračovat</button>
            </div>
        </div>

        <!-- Krok 4: Dynamické poddotazy -->
        <div class="step-content" id="step4">
            <h2>Upřesněte rozsah plánovaných opatření</h2>
            <form id="dynamic-questions"></form>
            <div class="navigation-buttons">
                <button class="back-btn">Zpět</button>
                <button class="next-btn" disabled>Pokračovat</button>
            </div>
        </div>

        <!-- Krok 5: Lokalita -->
        <div class="step-content" id="step5">
            <div class="centered-step-content">
                <h2>Kde se nemovitost nachází?</h2>
                <form id="lokalita-form">
                    <div class="form-row">
                        <label class="dynamic-label" for="ulice-input">Ulice a číslo popisné</label>
                        <input type="text" id="ulice-input" class="dynamic-input" placeholder="Např. Hlavní 123"
                               autocomplete="off">
                    </div>
                    <div class="form-row">
                        <label class="dynamic-label" for="psc-input">PSČ</label>
                        <input type="text" id="psc-input" class="dynamic-input" placeholder="Např. 11000"
                               autocomplete="off">
                    </div>
                    <div class="form-row">
                        <label class="dynamic-label" for="mesto-input">Město / obec</label>
                        <input type="text" id="mesto-input" class="dynamic-input" placeholder="Např. Praha"
                               autocomplete="off">
                    </div>
                </form>
                <div class="navigation-buttons">
                    <button class="back-btn">Zpět</button>
                    <button class="next-btn" disabled>Pokračovat</button>
                </div>
            </div>
        </div>

        <!-- Krok 6: Sociální situace -->
        <div class="step-content" id="step6">
            <div class="centered-step-content socialni-situace">
                <h2>Sociální situace</h2>
                <form id="social-form">
                    <div class="form-row">
                        <label class="dynamic-label" style="font-weight:600;">Splňujete některou z těchto
                            podmínek?</label>
                        <div class="checkbox-options-grid">
                            <label class="checkbox-option">
                                <input type="checkbox" name="social" value="duchod">
                                <span>Pobírám starobní důchod</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="social" value="bydleni">
                                <span>Pobírám příspěvek na bydlení</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="social" value="pridavek">
                                <span>Pobírám přídavek na dítě</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="social" value="nic">
                                <span>Neplatí nic z výše uvedeného</span>
                            </label>
                        </div>
                    </div>
                </form>
                <div class="navigation-buttons">
                    <button class="back-btn">Zpět</button>
                    <button class="next-btn">Pokračovat</button>
                </div>
            </div>
        </div>

        <!-- Krok 7: Kontaktní údaje (leadgating) -->
        <div class="step-content" id="step7">
            <div class="centered-step-content">
                <h2>Kontaktní údaje</h2>
                <form id="kontakt-form">
                    <div class="form-row">
                        <label class="dynamic-label" for="jmeno-input">Jméno a příjmení</label>
                        <input type="text" id="jmeno-input" class="dynamic-input" placeholder="Např. Jan Novák"
                               autocomplete="off" required>
                    </div>
                    <div class="form-row">
                        <label class="dynamic-label" for="email-input">E-mail</label>
                        <input type="email" id="email-input" class="dynamic-input" placeholder="Např. jan@email.cz"
                               autocomplete="off" required>
                    </div>
                    <div class="form-row">
                        <label class="dynamic-label" for="telefon-input">Telefon <span
                                    style="color:#888;font-size:0.95em;">(volitelné)</span></label>
                        <input type="tel" id="telefon-input" class="dynamic-input" placeholder="Např. 777 123 456"
                               autocomplete="off">
                    </div>
                    <div class="form-row souhlas-container">
                        <label class="checkbox-option souhlas-row">
                            <input type="checkbox" id="souhlas-input" required>
                            <span class="souhlas-text">
                                    Souhlasím se zpracováním údajů podle <a href="https://d0101.enermio.cz/GDPR.pdf"
                                                                            target="_blank" rel="noopener noreferrer">podmínek</a>.
                                </span>
                        </label>
                    </div>
                </form>
                <div class="navigation-buttons">
                    <button class="back-btn">Zpět</button>
                    <button class="next-btn" type="submit">Zobrazit výsledek</button>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="script.js?<?= time(); ?>"></script>
<script src="nocache.js"></script>
</body>
</html> 