# DotaceLoadingScreen komponenta

Elegantní React komponenta pro zobrazení loading screenu během zpracování dotační kalkulačky. Komponenta zobrazuje rotující hlášky, animovaný spinner a progress bar pro lepší uživatelskou zkušenost.

## ✨ Funkce

- **Rotující hlášky**: 4 hlášky se střídají každé 2 sekundy s fade-in/fade-out efektem
- **Animovaný spinner**: Moderní CSS spinner s plynulou rotací
- **Progress bar**: Animovaný progress bar simulující průběh zpracování
- **Responsivní design**: Plně responsivní pro mobil i desktop
- **Přizpůsobitelný obsah**: Volitelný popisek a callback funkce
- **Moderní styling**: TailwindCSS s využitím gradientů a stínů

## 🎯 Texty hlášek

Komponenta automaticky rotuje mezi těmito hláškami:

1. 🔄 Přepočítáváme vaše možnosti dotací...
2. 📊 Vyhodnocujeme technická opatření dle zadání...
3. 🧾 Kontrolujeme nárok na zálohové vyplacení...
4. 💬 Vytváříme přehled vašich dostupných podpor...

## 🛠 Props

```typescript
interface DotaceLoadingScreenProps {
  /** Volitelný vlastní popisek pod hlavními hláškami */
  subtitle?: string;
  /** Callback funkce volaná po dokončení loadingu (volitelné) */
  onComplete?: () => void;
}
```

## 📝 Použití

### Základní použití

```tsx
import DotaceLoadingScreen from './DotaceLoadingScreen';

function App() {
  return <DotaceLoadingScreen />;
}
```

### Pokročilé použití

```tsx
import React, { useState, useEffect } from 'react';
import DotaceLoadingScreen from './DotaceLoadingScreen';

function DotationCalculator() {
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    // Simulace API volání
    fetchDotationResults()
      .then(data => {
        setResults(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <DotaceLoadingScreen 
        subtitle="Analýza může trvat až 30 sekund"
        onComplete={() => console.log('Zpracování dokončeno!')}
      />
    );
  }

  return <ResultsPage results={results} />;
}
```

## 🎨 Styling

Komponenta využívá TailwindCSS s následujícím barevným schématem:

- **Pozadí**: Gradient z `green-50` do `blue-50`
- **Karta**: Bílé pozadí s `shadow-xl` a `rounded-2xl`
- **Primární barva**: `green-600` pro hlavní elementy
- **Sekundární barva**: `gray-600` pro informační texty
- **Spinner**: `green-600` s transparentním top borderem

## 📱 Responsivita

- **Mobil**: Menší padding, kompaktní layout
- **Tablet/Desktop**: Větší spacing, lepší využití prostoru
- **Breakpointy**: `md:` prefix pro tablet a větší obrazovky

## ⚡ Animace

- **Spinner**: `animate-spin` - nekonečná rotace
- **Hlášky**: `transition-opacity duration-300` - plynulý fade-in/out
- **Progress bar**: Vlastní keyframe animace `progress`
- **Indikátory**: `animate-pulse` s různými delays

## 🔧 Technické detaily

- **Framework**: React s TypeScript
- **Styling**: TailwindCSS
- **Animace**: CSS transitions a keyframes
- **Interval**: 2 sekundy pro změnu hlášek
- **Fade efekt**: 300ms transition

## 🎯 Použití v dotační kalkulačce

Ideální pro zobrazení během:
- Načítání dat z API
- Zpracování formuláře
- Validace podmínek
- Generování výsledků
- Komunikace s backend systémy

## 💡 Tips pro integraci

1. **Zobrazujte komponentu ihned po odeslání formuláře**
2. **Použijte minimálně 4-6 sekund pro realistický pocit zpracování**
3. **Kombinujte s timeout pro případy pomalého API**
4. **Přednastavte fallback zprávy pro různé typy chyb**

## 🚀 Optimalizace

- Minimální re-rendery díky správnému state managementu
- Čištění intervalů při unmount komponenty
- Lazy loading možný díky jednoduché struktuře
- Malá velikość díky pure CSS animacím bez externích knihoven 