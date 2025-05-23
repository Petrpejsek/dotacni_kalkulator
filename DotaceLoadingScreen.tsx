import React, { useState, useEffect } from 'react';

interface DotaceLoadingScreenProps {
  /** Volitelný vlastní popisek pod hlavními hláškami */
  subtitle?: string;
  /** Callback funkce volaná po dokončení loadingu (volitelné) */
  onComplete?: () => void;
}

const DotaceLoadingScreen: React.FC<DotaceLoadingScreenProps> = ({ 
  subtitle = "Zpracování může chvíli trvat, prosíme o strpení",
  onComplete 
}) => {
  // Hlášky, které se budou rotovat
  const messages = [
    "🔄 Přepočítáváme vaše možnosti dotací...",
    "📊 Vyhodnocujeme technická opatření dle zadání...",
    "🧾 Kontrolujeme nárok na zálohové vyplacení...",
    "💬 Vytváříme přehled vašich dostupných podpor..."
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out efekt
      setIsVisible(false);
      
      // Po 300ms změna textu a fade in
      setTimeout(() => {
        setCurrentMessageIndex((prevIndex) => 
          (prevIndex + 1) % messages.length
        );
        setIsVisible(true);
      }, 300);
    }, 2000); // Změna každé 2 sekundy

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full text-center">
        
        {/* Animovaný spinner */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Hlavní titulek */}
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
          Zpracováváme vaši kalkulaci
        </h2>

        {/* Rotující hlášky s fade efektem */}
        <div className="mb-6 h-16 flex items-center justify-center">
          <p 
            className={`text-green-600 font-medium text-base md:text-lg transition-opacity duration-300 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {messages[currentMessageIndex]}
          </p>
        </div>

        {/* Progress bar animace */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse"
                 style={{ 
                   width: '75%',
                   animation: 'progress 4s ease-in-out infinite'
                 }}>
            </div>
          </div>
        </div>

        {/* Popisek */}
        {subtitle && (
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Informační body */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-xs md:text-sm">
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span>Dotační programy</span>
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <span>Výše podpory</span>
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse" style={{animationDelay: '1s'}}></div>
            <span>Podmínky čerpání</span>
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse" style={{animationDelay: '1.5s'}}></div>
            <span>Kombinace bonusů</span>
          </div>
        </div>
      </div>

      {/* CSS animace pro progress bar */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 20%; }
          50% { width: 85%; }
          100% { width: 75%; }
        }
      `}</style>
    </div>
  );
};

export default DotaceLoadingScreen; 