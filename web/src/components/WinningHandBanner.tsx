import React, { useEffect, useState } from 'react';

interface WinningHandBannerProps {
  winningHand: string;
  winner: string;
  potSize: number;
  visible: boolean;
}

const WinningHandBanner: React.FC<WinningHandBannerProps> = ({ 
  winningHand, 
  winner, 
  potSize,
  visible 
}) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (visible && winningHand) {
      setIsShowing(true);
    } else {
      // Fade out after banner time
      const timer = setTimeout(() => setIsShowing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible, winningHand]);

  if (!isShowing && !visible) return null;

  // Get hand color based on strength
  const getHandColor = () => {
    const hand = winningHand.toLowerCase();
    if (hand.includes('royal flush')) return 'from-purple-500 via-pink-500 to-purple-500';
    if (hand.includes('straight flush')) return 'from-blue-500 via-cyan-500 to-blue-500';
    if (hand.includes('four of a kind')) return 'from-blue-400 via-cyan-400 to-blue-400';
    if (hand.includes('full house')) return 'from-green-500 via-emerald-500 to-green-500';
    if (hand.includes('flush')) return 'from-yellow-500 via-orange-500 to-yellow-500';
    if (hand.includes('straight')) return 'from-amber-500 via-yellow-500 to-amber-500';
    if (hand.includes('three of a kind')) return 'from-rose-500 via-red-500 to-rose-500';
    if (hand.includes('two pair')) return 'from-indigo-500 via-blue-500 to-indigo-500';
    if (hand.includes('pair')) return 'from-slate-500 via-gray-500 to-slate-500';
    return 'from-slate-600 via-gray-700 to-slate-600';
  };

  // Get emoji for hand type
  const getHandEmoji = () => {
    const hand = winningHand.toLowerCase();
    if (hand.includes('royal flush')) return '👑💎';
    if (hand.includes('straight flush')) return '🌊💎';
    if (hand.includes('four of a kind')) return '🏠🏠';
    if (hand.includes('full house')) return '🏠';
    if (hand.includes('flush')) return '🌊';
    if (hand.includes('straight')) return '📏';
    if (hand.includes('three of a kind')) return '🎯';
    if (hand.includes('two pair')) return '👥';
    if (hand.includes('pair')) return '👫';
    return '🎴';
  };

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] 
        transition-all duration-500 ease-out pointer-events-none
        ${isShowing && visible ? 'opacity-100 scale-100 winner-celebration' : 'opacity-0 scale-95'}`}
    >
      {/* Enhanced Cyberpunk glow effect with celebration pulse */}
      <div className="absolute inset-0 blur-3xl opacity-60">
        <div className="w-full h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-lg animate-pulse" />
      </div>
      
      {/* Additional flash effect for celebration */}
      {isShowing && visible && (
        <>
          <div className="absolute inset-0 blur-2xl opacity-40 animate-ping pointer-events-none"
            style={{ animationDuration: '1s', animationIterationCount: '2' }}>
            <div className="w-full h-full bg-cyan-400 rounded-lg" />
          </div>
        </>
      )}

      {/* Main banner - Cyberpunk neon style */}
      <div 
        className="relative backdrop-blur-xl overflow-hidden"
        style={{
          minWidth: '650px',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(0, 0, 0, 0.95) 100%)',
          border: '3px solid rgba(6, 182, 212, 0.5)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.4), inset 0 0 40px rgba(6, 182, 212, 0.08)'
        }}
      >
        {/* Corner brackets - EXACT LOBBY STYLE */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        
        {/* Glowing dots at corners */}
        <div className="absolute top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full animate-pulse pointer-events-none"
             style={{ filter: 'blur(2px) drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-full animate-pulse pointer-events-none"
             style={{ filter: 'blur(2px) drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 bg-cyan-400 rounded-full animate-pulse pointer-events-none"
             style={{ filter: 'blur(2px) drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 rounded-full animate-pulse pointer-events-none"
             style={{ filter: 'blur(2px) drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        
        {/* Content */}
        <div className="relative p-10 flex flex-col items-center gap-5">
          {/* Winner text - Cyberpunk style */}
          <div className="text-5xl font-black tracking-wider text-cyan-400 uppercase"
               style={{ 
                 textShadow: '0 0 20px rgba(6, 182, 212, 1), 0 0 40px rgba(6, 182, 212, 0.6)',
                 fontFamily: 'monospace'
               }}>
            {winner === 'You' ? '▸ VICTORY ◂' : `▸ ${winner.toUpperCase()} WINS ◂`}
          </div>

          {/* Pot size - Bold neon */}
          <div className="text-4xl font-black flex items-center gap-3 text-emerald-400"
               style={{ textShadow: '0 0 15px rgba(16, 185, 129, 0.8)' }}>
            <span className="text-3xl">💰</span>
            <span>{potSize.toLocaleString()}</span>
            <span className="text-2xl text-emerald-300">SHIDO</span>
          </div>

          {/* Hand description - Neon box */}
          <div className="mt-2 px-8 py-4 bg-black/60 relative"
            style={{
              border: '2px solid rgba(6, 182, 212, 0.4)',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.2), inset 0 0 20px rgba(6, 182, 212, 0.05)'
            }}
          >
            {/* Mini corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400/60"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60"></div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">⟪ WINNING HAND ⟫</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400">
                {winningHand}
              </span>
            </div>
          </div>

          {/* Scan line animation */}
          <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
            <div className="absolute w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinningHandBanner;
