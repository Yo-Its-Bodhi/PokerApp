import React from 'react';

interface PlayerStateGlowProps {
  state: 'check' | 'call' | 'raise' | 'allin' | 'fold' | 'inactive';
  isActive?: boolean;
}

const PlayerStateGlow: React.FC<PlayerStateGlowProps> = ({ state, isActive = false }) => {
  const getGlowStyles = () => {
    if (!isActive) return '';

    switch (state) {
      case 'check':
        return 'animate-border-glow border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.8)]';
      case 'call':
        return 'animate-border-glow border-magenta-500 shadow-[0_0_20px_rgba(236,72,153,0.8)]';
      case 'raise':
        return 'animate-border-glow border-green-400 shadow-[0_0_25px_rgba(74,222,128,0.9)]';
      case 'allin':
        return 'animate-lightning border-red-500 shadow-[0_0_30px_rgba(239,68,68,1)]';
      case 'fold':
        return 'border-gray-500 opacity-50';
      default:
        return '';
    }
  };

  const getEffectOverlay = () => {
    if (!isActive) return null;

    switch (state) {
      case 'check':
        return (
          <div className="absolute inset-0 rounded-lg">
            <div className="absolute inset-0 bg-cyan-400/10 animate-pulse"></div>
          </div>
        );
      case 'call':
        return (
          <div className="absolute inset-0 rounded-lg">
            <div className="absolute inset-0 bg-magenta-500/10 animate-pulse"></div>
          </div>
        );
      case 'raise':
        return (
          <div className="absolute inset-0 rounded-lg">
            <div className="absolute inset-0 bg-green-400/15 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-green-400/20 to-transparent"></div>
          </div>
        );
      case 'allin':
        return (
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            {/* Lightning strikes */}
            <div className="absolute inset-0 bg-red-500/20 animate-lightning"></div>
            <div className="absolute top-0 left-1/4 w-0.5 h-full bg-gradient-to-b from-red-400 via-orange-500 to-transparent opacity-0 animate-lightning" style={{ animationDelay: '0.1s' }}></div>
            <div className="absolute top-0 right-1/4 w-0.5 h-full bg-gradient-to-b from-red-400 via-orange-500 to-transparent opacity-0 animate-lightning" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-red-500/30 to-transparent"></div>
          </div>
        );
      case 'fold':
        return (
          <div className="absolute inset-0 rounded-lg">
            <div className="absolute inset-0 bg-gray-500/20 animate-glitch-1"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {getEffectOverlay()}
    </>
  );
};

export default PlayerStateGlow;

// Export helper function to get border class
export const getPlayerStateBorderClass = (
  state: 'check' | 'call' | 'raise' | 'allin' | 'fold' | 'inactive',
  isActive: boolean
): string => {
  if (!isActive) return 'border-brand-gold/40';

  switch (state) {
    case 'check':
      return 'border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.8)] animate-border-glow';
    case 'call':
      return 'border-magenta-500 shadow-[0_0_20px_rgba(236,72,153,0.8)] animate-border-glow';
    case 'raise':
      return 'border-green-400 shadow-[0_0_25px_rgba(74,222,128,0.9)] animate-border-glow';
    case 'allin':
      return 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,1)] animate-lightning';
    case 'fold':
      return 'border-gray-500 opacity-50';
    default:
      return 'border-brand-gold/40';
  }
};
