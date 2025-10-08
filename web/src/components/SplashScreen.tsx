import { useState, useEffect, useMemo } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Shuffling deck...');

  // Generate stable random positions/delays for hexagons (prevent flicker on re-render)
  const cyanHexagons = useMemo(() => 
    [...Array(12)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
    })), []
  );

  const purpleHexagons = useMemo(() => 
    [...Array(8)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 4 + Math.random() * 3,
      delay: Math.random() * 2,
    })), []
  );

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + 2;
        
        // Update loading message based on progress
        if (newProgress >= 90) {
          setLoadingMessage('Ready to play!');
        } else if (newProgress >= 60) {
          setLoadingMessage('Setting up table...');
        } else if (newProgress >= 30) {
          setLoadingMessage('Dealing cards...');
        }
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return newProgress;
      });
    }, 30);
    
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black z-50">
      
      {/* ⬡🔥 EPIC HEXAGONAL BACKGROUND 🔥⬡ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        
        {/* Base hexagon grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexGridSplash" width="150" height="130" patternUnits="userSpaceOnUse">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(6, 182, 212, 0.15)" 
                strokeWidth="1.5" 
                fill="none"
              />
            </pattern>
            <filter id="hexGlowSplash">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexGridSplash)" />
        </svg>

        {/* Animated pulsing hexagons - Layer 1 (Cyan) */}
        {cyanHexagons.map((hex, i) => (
          <div
            key={`cyan-${i}`}
            className="absolute"
            style={{
              left: `${hex.left}%`,
              top: `${hex.top}%`,
              width: '150px',
              height: '130px',
              animation: `hexPulse ${hex.duration}s ease-in-out infinite`,
              animationDelay: `${hex.delay}s`,
              opacity: 0,
            }}
          >
            <svg viewBox="0 0 150 130" className="w-full h-full">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(6, 182, 212, 0.8)" 
                strokeWidth="2.5" 
                fill="rgba(6, 182, 212, 0.05)"
                filter="url(#hexGlowSplash)"
              />
            </svg>
          </div>
        ))}

        {/* Animated pulsing hexagons - Layer 2 (Purple) */}
        {purpleHexagons.map((hex, i) => (
          <div
            key={`purple-${i}`}
            className="absolute"
            style={{
              left: `${hex.left}%`,
              top: `${hex.top}%`,
              width: '120px',
              height: '104px',
              animation: `hexPulse ${hex.duration}s ease-in-out infinite`,
              animationDelay: `${hex.delay}s`,
              opacity: 0,
            }}
          >
            <svg viewBox="0 0 150 130" className="w-full h-full">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(168, 85, 247, 0.6)" 
                strokeWidth="2" 
                fill="rgba(168, 85, 247, 0.03)"
                filter="url(#hexGlowSplash)"
              />
            </svg>
          </div>
        ))}

        {/* Floating card suits */}
        {['♠️', '♥️', '♦️', '♣️'].map((suit, i) => (
          <div
            key={suit}
            className="absolute text-6xl opacity-10"
            style={{
              left: `${20 + i * 20}%`,
              top: `${10 + (i % 2) * 70}%`,
              animation: `cardSuitFloat ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {suit}
          </div>
        ))}

        {/* 🌟 FLOATING SHIDO LOGOS 🌟 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`shido-splash-${i}`}
            className="absolute"
            style={{
              left: `${(i * 13 + 8) % 95}%`,
              top: `${((i * 19) % 75) + 10}%`,
              width: `${80 + (i % 3) * 40}px`,
              animation: `cardBackFloat ${20 + i * 2.5}s ease-in-out infinite`,
              animationDelay: `${i * 2.5}s`,
              opacity: 0,
              filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.3))',
            }}
          >
            <img 
              src="/shido-white.png" 
              alt="" 
              className="w-full h-auto object-contain opacity-20"
              style={{
                filter: 'brightness(1.2)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Logo and Loading Content */}
      <div className="relative z-10 text-center px-4">
        
        {/* Logo */}
        <div className="animate-logo-pulse mb-8">
          <div className="text-9xl mb-4">🎰</div>
        </div>
        
        {/* Title */}
        <h1 className="text-6xl md:text-7xl font-bold text-cyan-400 mb-4 animate-glow">
          SHIDO POKER
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-purple-400 mb-12 animate-fade-in">
          Welcome to the Underground
        </p>
        
        {/* Progress Bar */}
        <div className="w-80 md:w-96 h-3 bg-slate-800 rounded-full mx-auto overflow-hidden mb-4 border border-cyan-900">
          <div 
            className="h-full animate-shimmer"
            style={{ 
              width: `${loadingProgress}%`, 
              transition: 'width 0.3s ease',
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.8) 0%, rgba(168, 85, 247, 0.8) 50%, rgba(6, 182, 212, 0.8) 100%)',
            }}
          />
        </div>
        
        {/* Loading Message */}
        <p className="text-sm md:text-base text-slate-400 animate-fade-in">
          {loadingMessage}
        </p>
        
        {/* Progress Percentage */}
        <p className="text-xs text-slate-600 mt-2">
          {loadingProgress}%
        </p>
      </div>
    </div>
  );
}
