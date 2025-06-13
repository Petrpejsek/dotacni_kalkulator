# Dotační Kalkulátor - PHP Verze

Převedená verze dotačního kalkulátoru na PHP pro jednodušší hosting.

## Požadavky

- PHP 7.4 nebo vyšší
- cURL rozšíření
- OpenAI API klíč

## Instalace

1. Nakopírujte soubory na webserver
2. Nastavte environment proměnnou `OPENAI_API_KEY` nebo upravte ji v `config.php`
3. Ujistěte se, že PHP má povolené cURL rozšíření

## Struktura

- `index.php` - Hlavní API endpoint (nahrazuje Node.js backend)
- `config.php` - Konfigurace aplikace
- HTML/CSS/JS soubory zůstávají stejné

## Používání

Frontend automaticky detekuje PHP API a volá `index.php` místo původního Node.js API.

## API

**POST** `/index.php`

Přijímá stejná data jako původní Node.js verze a vrací výsledky od OpenAI asistenta. 