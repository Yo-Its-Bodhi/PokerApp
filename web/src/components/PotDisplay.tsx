import React, { useEffect, useState } from 'react';

interface PotDisplayProps {
  mainPot: number;
  sidePots?: Array<{ amount: number; players: string[] }>;
  lastBetAmount?: number;
  shouldPulse?: boolean;
}

const PotDisplay: React.FC<PotDisplayProps> = ({ 
  mainPot, 
  sidePots = [], 
  lastBetAmount = 0,
  shouldPulse = false 
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    if (shouldPulse || lastBetAmount > 0) {
      setIsPulsing(true);
      setShowRipple(true);
      
      const pulseTimer = setTimeout(() => setIsPulsing(false), 400);
      const rippleTimer = setTimeout(() => setShowRipple(false), 800);
      
      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(rippleTimer);
      };
    }
  }, [mainPot, shouldPulse, lastBetAmount]);

  // Calculate chip stacks to display (visual only)
  const chipStacks = Math.min(Math.ceil(mainPot / 10000), 12);

  return (
    <div className="relative">
      {/* Ripple effect */}
      {showRipple && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-4 border-cyan-400/50 animate-table-ripple pointer-events-none -z-10"></div>
      )}

      {/* Main Pot */}
      <div className={`text-center ${isPulsing ? 'animate-pot-pulse' : ''}`}>
        {/* Visual chip stacks */}
        <div className="relative flex justify-center mb-4" style={{ height: `${chipStacks * 4 + 12}px` }}>
          {Array.from({ length: chipStacks }).map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 -translate-x-1/2"
              style={{ 
                bottom: `${i * 4}px`,
                animationDelay: `${i * 30}ms`,
                zIndex: i 
              }}
            >
              {/* Chip stack - Blue */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 shadow-lg border border-blue-300/50">
                {/* Card back logo on chip */}
                <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
                  <img 
                    src="/card-back-icon.png" 
                    alt="" 
                    className="w-3/4 h-3/4 object-contain opacity-80"
                  />
                </div>
                {/* Inner shine */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 to-transparent"></div>
              </div>
              
              {/* Glow underneath */}
              <div className="absolute inset-0 rounded-full bg-blue-400/40 blur-sm -z-10"></div>
            </div>
          ))}
        </div>

        {/* Pot Amount */}
        <div className="relative">
          <div className="text-4xl font-bold text-brand-gold mb-1 drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]">
            {mainPot.toLocaleString()} SHIDO
          </div>
        </div>

        {/* Pot label */}
        <div className="text-xs text-brand-gold-light uppercase tracking-widest font-bold mb-3">
          MAIN POT
        </div>

        {/* Last bet indicator */}
        {lastBetAmount > 0 && (
          <div className="text-xs text-cyan-400 animate-pulse">
            +{lastBetAmount.toLocaleString()}
          </div>
        )}
      </div>

      {/* Side Pots */}
      {sidePots.length > 0 && (
        <div className="mt-6 flex gap-4 justify-center">
          {sidePots.map((sidePot, index) => (
            <div 
              key={index}
              className="relative"
            >
              {/* Side pot circle */}
              <div className="glass-card px-4 py-3 border border-cyan-400/50 bg-cyan-500/10 rounded-lg min-w-[120px]">
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400 mb-1">
                    {sidePot.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-cyan-300/70 uppercase tracking-wide">
                    Side Pot {index + 1}
                  </div>
                  <div className="text-[9px] text-white/50 mt-1">
                    {sidePot.players.length} players
                  </div>
                </div>

                {/* Mini chip stack */}
                <div className="flex justify-center gap-0.5 mt-2">
                  {Array.from({ length: Math.min(Math.ceil(sidePot.amount / 20000), 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-4 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 shadow-md"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Neon glow */}
              <div className="absolute inset-0 rounded-lg bg-cyan-500/20 blur-md -z-10 animate-pulse"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PotDisplay;
