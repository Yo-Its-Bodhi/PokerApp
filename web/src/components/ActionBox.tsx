import React, { useEffect, useState } from 'react';

interface ActionBoxProps {
  action: 'call' | 'raise' | 'check' | 'fold' | 'allin';
  amount?: number;
  playerName: string;
  seat: number;
  onComplete?: () => void;
}

const ActionBox: React.FC<ActionBoxProps> = ({ action, amount, playerName, seat, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show for 2 seconds, longer for big actions
    const duration = (action === 'raise' || action === 'allin') ? 2500 : 2000;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) setTimeout(onComplete, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [action, onComplete]);

  // Get action styling
  const getActionStyle = () => {
    switch (action) {
      case 'call':
        return {
          border: 'border-brand-cyan',
          glow: 'shadow-glow-cyan',
          text: 'text-brand-cyan',
          bg: 'bg-brand-cyan/10',
          shake: false,
        };
      case 'raise':
        return {
          border: 'border-green-400',
          glow: 'shadow-[0_0_20px_rgba(74,222,128,0.6)]',
          text: 'text-green-400',
          bg: 'bg-green-400/10',
          shake: true,
        };
      case 'check':
        return {
          border: 'border-brand-gold',
          glow: 'shadow-glow-gold',
          text: 'text-brand-gold',
          bg: 'bg-brand-gold/10',
          shake: false,
        };
      case 'fold':
        return {
          border: 'border-red-500',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
          text: 'text-red-500',
          bg: 'bg-red-500/10',
          shake: false,
        };
      case 'allin':
        return {
          border: 'border-red-500',
          glow: 'shadow-[0_0_30px_rgba(239,68,68,0.8)]',
          text: 'text-red-500',
          bg: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
          shake: true,
        };
      default:
        return {
          border: 'border-white',
          glow: '',
          text: 'text-white',
          bg: 'bg-white/10',
          shake: false,
        };
    }
  };

  // Get action text
  const getActionText = () => {
    const actionName = action.toUpperCase();
    
    if (amount && amount > 0) {
      return `${actionName}_${amount.toLocaleString()}`;
    }
    return actionName;
  };

  // Position based on seat
  const getPosition = () => {
    const positions = [
      'bottom-32 left-1/2 -translate-x-1/2',  // Seat 1 - Bottom center
      'bottom-48 left-16',                     // Seat 2 - Bottom left
      'top-1/3 left-20',                       // Seat 3 - Middle left
      'top-32 left-1/2 -translate-x-1/2',     // Seat 4 - Top center
      'top-1/3 right-20',                      // Seat 5 - Middle right
      'bottom-48 right-16',                    // Seat 6 - Bottom right
    ];
    return positions[seat - 1] || positions[0];
  };

  const style = getActionStyle();

  if (!isVisible) return null;

  return (
    <div className={`absolute ${getPosition()} z-50 animate-action-box-in`}>
      <div 
        className={`
          glass-card px-6 py-3 border-2 ${style.border} ${style.glow} ${style.bg}
          ${style.shake ? 'animate-shake' : ''}
          backdrop-blur-md
        `}
      >
        <div className="flex flex-col items-center gap-1">
          {/* Action text */}
          <div className={`font-bold text-lg ${style.text} tracking-wider font-mono uppercase`}>
            {getActionText()}
          </div>
          
          {/* Player name */}
          <div className="text-xs text-white/70 uppercase tracking-wide">
            {playerName}
          </div>
        </div>
        
        {/* Glitch effect for fold */}
        {action === 'fold' && (
          <div className="absolute inset-0 bg-red-500/20 animate-glitch-1 pointer-events-none"></div>
        )}
        
        {/* Lightning for all-in */}
        {action === 'allin' && (
          <div className="absolute -inset-1 animate-lightning pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionBox;
