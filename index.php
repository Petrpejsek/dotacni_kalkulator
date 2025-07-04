<?php

$config = require_once 'config.php';

?><!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dotační kalkulačka - Enermio</title>
    <link rel="stylesheet" href="styles.css?v=1.0.1">
    <link rel="stylesheet" href="landing-styles.css?v=1.0.0">
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

<section id="hero" class="hero-section">
    <div class="container">
        <div class="hero-content">
            <h1>Zjistěte během 3 minut, na jakou dotaci máte nárok</h1>
            <p>Bez registrace, zdarma, podle oficiálních podkladů Nová zelená úsporám. Včetně nároku na zálohovou platbu.</p>
            <a href="kalkulator.php" class="cta-button">Spustit kalkulačku</a>
        </div>
    </div>
</section>

<section id="dotace" class="dotace-section">
    <div class="container">
        <h2>Na co lze získat dotaci</h2>
        <div class="dotace-grid">
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/wall.svg" alt="Zateplení fasády" class="dotace-icon">
                <h3>Zateplení fasády</h3>
            </a>
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/roof.svg" alt="Zateplení střechy" class="dotace-icon">
                <h3>Zateplení střechy</h3>
            </a>
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/windows.svg" alt="Výměna oken" class="dotace-icon">
                <h3>Výměna oken</h3>
            </a>
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/door.svg" alt="Výměna dveří" class="dotace-icon">
                <h3>Výměna dveří</h3>
            </a>
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/solar.svg" alt="Fotovoltaika" class="dotace-icon">
                <h3>Fotovoltaika</h3>
            </a>
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/heat-pump.svg" alt="Tepelné čerpadlo" class="dotace-icon">
                <h3>Tepelné čerpadlo</h3>
            </a>
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/water-heater.svg" alt="Ohřev vody z FVE" class="dotace-icon">
                <h3>Ohřev vody z FVE</h3>
            </a>
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/ventilation.svg" alt="Rekuperace" class="dotace-icon">
                <h3>Rekuperace</h3>
            </a>
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/water.svg" alt="Dešťová voda" class="dotace-icon">
                <h3>Dešťová voda</h3>
            </a>
            <a href="kalkulator.php" class="dotace-item">
                <img src="icons/battery.svg" alt="Řízení spotřeby" class="dotace-icon">
                <h3>Řízení spotřeby</h3>
            </a>
        </div>
    </div>
</section>

<section id="how-it-works" class="steps-section">
    <div class="container">
        <h2>Jak to funguje?</h2>
        <div class="steps-grid">
            <div class="step-item">
                <div class="step-number">1</div>
                <h3>Vyplníte jednoduchý formulář</h3>
                <p>Trvá to jen 3 minuty a zjistíte nárok na všechny dostupné dotace</p>
            </div>
            <div class="step-item">
                <div class="step-number">2</div>
                <h3>Získáte přehled dotací</h3>
                <p>Přehledně uvidíte, na co máte nárok včetně odhadované výše příspěvku</p>
            </div>
            <div class="step-item">
                <div class="step-number">3</div>
                <h3>Spojí se s vámi ověřená firma</h3>
                <p>Spolupracujeme pouze s osvědčenými realizačními partnery</p>
            </div>
        </div>
    </div>
</section>

<section id="dotacni-kalkulacka" class="calculator-section">
    <div class="container">
        <h2>Dotační kalkulačka</h2>
        <div class="calculator-wrapper">
            <a href="kalkulator.php" class="cta-button large">Spustit kalkulačku</a>
        </div>
    </div>
</section>

<footer class="site-footer">
    <div class="footer-container">
        <p>&copy; 2025 Enermio. Všechna práva vyhrazena.</p>
        <p>
            Enermio není poskytovatelem dotací ani státním orgánem. Informace poskytované touto kalkulačkou vycházejí z veřejně dostupných podkladů
            <a href="https://novazelenausporam.cz" target="_blank" rel="noopener noreferrer">programu Nová zelená úsporám</a>
            a dalších dotačních titulů. Přesnost výpočtů je orientační a nenahrazuje oficiální posouzení oprávněnosti dotace ze strany SFŽP nebo MŽP.
        </p>
    </div>
</footer>
<script src="nocache.js"></script>
</body>
</html>