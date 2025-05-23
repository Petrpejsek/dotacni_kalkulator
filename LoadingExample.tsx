import React, { useState } from 'react';
import DotaceLoadingScreen from './DotaceLoadingScreen';

const LoadingExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  // Simulace dokončení loadingu po 8 sekundách
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleTryAgain = () => {
    setIsLoading(true);
    setShowResults(false);
    
    // Znovu simulace po 8 sekundách
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 8000);
  };

  if (isLoading) {
    return (
      <DotaceLoadingScreen 
        subtitle="Zpracování může chvíli trvat, prosíme o strpení"
        onComplete={() => console.log('Loading dokončen!')}
      />
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Kalkulace dokončena!
          </h2>
          <p className="text-gray-600 mb-6">
            Vaše dotační možnosti byly úspěšně zpracovány.
          </p>
          <button 
            onClick={handleTryAgain}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default LoadingExample; 