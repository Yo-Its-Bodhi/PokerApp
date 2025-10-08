import { useState, useMemo } from 'react';
import { playButtonClick } from '../utils/audioSystem';

interface LoginScreenProps {
  onLogin: (name: string, avatarCategory: string, avatarIndex: number) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState('special');
  const [avatarIndex, setAvatarIndex] = useState(0);

  // Avatar categories with 9 options each (use 'IMG:' prefix for image-based avatars)
  const avatarCategories: { [key: string]: string[] } = {
    special: ['IMG:neon-heart', '⭐', '🌟', '💫', '☄️', '✨', '💎', '🏆', '👑'],
    animals: ['🦊', '🐉', '🦁', '🐺', '🦅', '🐯', '🦈', '🐻', '🐨'],
    smileys: ['😀', '😎', '🤓', '😈', '🤡', '😱', '🥳', '😂', '🤯'],
    fantasy: ['👑', '🎭', '👽', '👾', '🧛', '🧝', '🧙', '🧟', '🧞'],
    food: ['🍔', '🍕', '🌭', '🍟', '🍭', '🍰', '🍺', '🍷', '☕'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏓', '🏏', '⛳', '🎱'],
    symbols: ['⭐', '💥', '⚡', '🔥', '✨', '💀', '❤️', '💎', '🏆'],
    nature: ['🌺', '🌻', '🌳', '🌴', '🌵', '🌼', '🌸', '🌿', '🍀'],
    cosmic: ['🌙', '⭐', '🌟', '💫', '☄️', '🌌', '🌍', '🌑', '🌕'],
    games: ['🎲', '🎯', '🎰', '🎮', '🃏', '♠️', '♥️', '♦️', '♣️']
  };

  // Get current avatars based on selected category
  const avatars = avatarCategories[avatarCategory];

  // Generate stable random positions/delays for hexagons (prevent flicker on re-render)
  const hexagons = useMemo(() => 
    [...Array(10)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
    })), []
  );

  const handleLogin = () => {
    if (!playerName.trim()) return;
    
    setIsAnimating(true);
    playButtonClick();
    
    // Animate transition
    setTimeout(() => {
      onLogin(playerName.trim(), avatarCategory, avatarIndex);
    }, 800);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black z-50">
      
      {/* ⬡🔥 EPIC ANIMATED BACKGROUND 🔥⬡ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        
        {/* Base hexagon grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexGridLogin" width="150" height="130" patternUnits="userSpaceOnUse">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(6, 182, 212, 0.15)" 
                strokeWidth="1.5" 
                fill="none"
              />
            </pattern>
            <filter id="hexGlowLogin">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexGridLogin)" />
        </svg>

        {/* Animated pulsing hexagons */}
        {hexagons.map((hex, i) => (
          <div
            key={`hex-${i}`}
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
                stroke={i % 2 === 0 ? 'rgba(6, 182, 212, 0.8)' : 'rgba(168, 85, 247, 0.6)'} 
                strokeWidth="2.5" 
                fill={i % 2 === 0 ? 'rgba(6, 182, 212, 0.05)' : 'rgba(168, 85, 247, 0.03)'}
                filter="url(#hexGlowLogin)"
              />
            </svg>
          </div>
        ))}

        {/* Floating card suits - corners */}
        <div className="absolute top-10 left-10 text-6xl md:text-8xl opacity-20 animate-spin-slow">
          ♠️
        </div>
        <div className="absolute top-10 right-10 text-6xl md:text-8xl opacity-20 animate-spin-slow" style={{ animationDirection: 'reverse' }}>
          ♥️
        </div>
        <div className="absolute bottom-10 left-10 text-6xl md:text-8xl opacity-20 animate-spin-slow" style={{ animationDirection: 'reverse' }}>
          ♦️
        </div>
        <div className="absolute bottom-10 right-10 text-6xl md:text-8xl opacity-20 animate-spin-slow">
          ♣️
        </div>

        {/* 🌟 FLOATING SHIDO LOGOS 🌟 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`shido-login-${i}`}
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

      {/* Login Card */}
      <div 
        className={`relative z-10 max-w-md w-full mx-2 sm:mx-4 transition-all duration-700 ${
          isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
        } animate-slide-up`}
      >
        <div 
          className="relative p-4 sm:p-8 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)'
          }}
        >
          {/* 🔥 ANIMATED CORNERS 🔥 */}
          <div className="absolute top-0 left-0 w-8 sm:w-12 h-8 sm:h-12 border-t-4 border-l-4 border-cyan-400 animate-corner-pulse pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 sm:w-12 h-8 sm:h-12 border-t-4 border-r-4 border-cyan-400 animate-corner-pulse pointer-events-none" style={{ animationDelay: '0.2s' }} />
          <div className="absolute bottom-0 left-0 w-8 sm:w-12 h-8 sm:h-12 border-b-4 border-l-4 border-cyan-400 animate-corner-pulse pointer-events-none" style={{ animationDelay: '0.4s' }} />
          <div className="absolute bottom-0 right-0 w-8 sm:w-12 h-8 sm:h-12 border-b-4 border-r-4 border-cyan-400 animate-corner-pulse pointer-events-none" style={{ animationDelay: '0.6s' }} />
          
          {/* Corner glow dots */}
          <div className="absolute top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full animate-pulse pointer-events-none" style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }} />
          <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-full animate-pulse pointer-events-none" style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }} />
          <div className="absolute bottom-0 left-0 w-3 h-3 bg-cyan-400 rounded-full animate-pulse pointer-events-none" style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }} />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 rounded-full animate-pulse pointer-events-none" style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }} />

          {/* Logo */}
          <div className="text-center mb-4">
            <img 
              src="/logo.png" 
              alt="Dave - Your AI Dealer" 
              className="w-32 h-32 sm:w-40 sm:h-40 mx-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.6))' }}
            />
            <div className="mt-2 text-amber-400 font-bold text-lg tracking-wider" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.6)' }}>
              DAVE
            </div>
            <div className="text-slate-400 text-xs italic">Hi! My name's Dave... Your AI Dealer</div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-cyan-400 animate-glow">
            JACK IN
          </h1>
          
          {/* Saucy Tagline */}
          <p className="text-center text-purple-400 text-xs sm:text-sm mb-1 italic opacity-80">
            Come in and jack off... wait 🤨 ...what'd you just say?
          </p>
          
          {/* Subtitle */}
          <p className="text-center text-slate-400 text-sm sm:text-base mb-6">
            C'mon champ, what do I yell when you win?
          </p>
          
          {/* Input Field */}
          <div className="mb-4">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your handle..."
              className="w-full bg-slate-900/90 border-2 border-cyan-400/30 rounded-lg px-4 py-2 sm:py-3 text-white text-base sm:text-lg focus:border-cyan-400 focus:outline-none transition-all shadow-neon-cyan"
              style={{
                fontSize: '16px', // Prevent iOS zoom
              }}
              autoFocus
              maxLength={20}
            />
            <p className="text-xs text-slate-500 mt-2">
              Max 20 characters
            </p>
          </div>

          {/* Avatar Selector */}
          <div className="mb-6">
            <p className="text-center text-cyan-400 text-sm font-semibold mb-3">
              Choose Your Avatar
            </p>
            
            {/* Category Selector */}
            <div className="flex flex-wrap gap-1 mb-3 justify-center">
              {Object.keys(avatarCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setAvatarCategory(cat);
                    setAvatarIndex(0);
                    playButtonClick();
                  }}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    avatarCategory === cat
                      ? 'bg-cyan-400 text-black font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-9 gap-1">
              {avatars.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAvatarIndex(idx);
                    playButtonClick();
                  }}
                  className={`w-full aspect-square flex items-center justify-center text-xl sm:text-2xl rounded transition-all ${
                    avatarIndex === idx
                      ? 'bg-cyan-400/30 border-2 border-cyan-400 scale-110'
                      : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700 hover:scale-105'
                  }`}
                >
                  {avatar.startsWith('IMG:') ? (
                    <img 
                      src={`/${avatar.replace('IMG:', '')}.png`}
                      alt="avatar"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    avatar
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={!playerName.trim() || isAnimating}
            className="w-full btn btn-primary text-lg sm:text-xl py-3 sm:py-4 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation transition-all duration-200 hover:scale-105"
          >
            {isAnimating ? '🚀 LOADING...' : '🚀 ENTER THE GAME'}
          </button>

          {/* Footer hint */}
          <p className="text-xs text-center text-slate-600 mt-4">
            Play-money poker • Free to play
          </p>
        </div>
      </div>
    </div>
  );
}
