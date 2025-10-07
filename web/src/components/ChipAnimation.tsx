import React, { useEffect, useState } from 'react';

interface ChipAnimationProps {
  amount: number;
  fromSeat: number;
  isAllIn?: boolean;
  onComplete?: () => void;
}

const ChipAnimation: React.FC<ChipAnimationProps> = ({ amount, fromSeat, isAllIn = false, onComplete }) => {
  const [chips, setChips] = useState<any[]>([]);

  useEffect(() => {
    // Calculate number of chips to animate based on bet amount
    // More chips = bigger bet, max 15 for performance
    const chipCount = Math.min(Math.max(Math.ceil(amount / 5000), 3), 15);
    
    // Generate chips with slight position randomness for realistic stacking
    const newChips = Array.from({ length: chipCount }, (_, i) => ({
      id: `chip-${fromSeat}-${Date.now()}-${i}`,
      delay: isAllIn ? i * 15 : i * 80, // Faster cascade for all-in
      duration: isAllIn ? 350 : 700,
      offsetX: (Math.random() - 0.5) * 8, // Random horizontal offset for stacking effect
      offsetY: (Math.random() - 0.5) * 8, // Random vertical offset
      rotation: (Math.random() - 0.5) * 15, // Slight rotation for realism
    }));
    
    setChips(newChips);

    // Cleanup after animation
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, isAllIn ? 550 : 900);

    return () => clearTimeout(timer);
  }, [amount, fromSeat, isAllIn, onComplete]);

  // Calculate start position based on seat
  const getStartPosition = (seat: number) => {
    const positions = {
      1: { x: '50%', y: '90%' },   // Bottom center
      2: { x: '10%', y: '75%' },   // Bottom left
      3: { x: '5%', y: '45%' },    // Middle left
      4: { x: '50%', y: '10%' },   // Top center
      5: { x: '95%', y: '45%' },   // Middle right
      6: { x: '90%', y: '75%' },   // Bottom right
    };
    return positions[seat as keyof typeof positions] || positions[1];
  };

  const startPos = getStartPosition(fromSeat);

  // Chip color based on amount
  const getChipColor = () => {
    if (amount >= 100000) return 'from-red-500 via-pink-500 to-purple-500'; // High stakes
    if (amount >= 50000) return 'from-purple-500 via-magenta-500 to-pink-500'; // Big bet
    if (amount >= 20000) return 'from-cyan-400 via-blue-500 to-cyan-600'; // Medium
    return 'from-green-400 via-emerald-500 to-green-600'; // Small
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {chips.map((chip, index) => (
        <div
          key={chip.id}
          className={`absolute w-14 h-14 rounded-full ${isAllIn ? 'animate-chip-blast' : 'animate-chip-slide'}`}
          style={{
            left: startPos.x,
            top: startPos.y,
            animationDelay: `${chip.delay}ms`,
            animationDuration: `${chip.duration}ms`,
            transform: isAllIn 
              ? `rotate(${index * 36}deg)` 
              : `translateX(${chip.offsetX}px) translateY(${chip.offsetY}px) rotate(${chip.rotation}deg)`,
          }}
        >
          {/* 3D Chip body with realistic poker chip design */}
          <div className={`w-full h-full rounded-full bg-gradient-to-br ${getChipColor()} shadow-[0_4px_12px_rgba(0,0,0,0.6)] border-4 border-white/60 relative overflow-hidden`}>
            {/* Edge stripes for poker chip look */}
            <div className="absolute inset-0 rounded-full" style={{
              background: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.3) 0deg 10deg, transparent 10deg 20deg)'
            }}></div>
            
            {/* Inner circle */}
            <div className="absolute inset-3 rounded-full border-3 border-white/40 bg-gradient-to-br from-white/10 to-transparent"></div>
            
            {/* Center value indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/50 backdrop-blur-sm border-2 border-white/70"></div>
            
            {/* 3D highlight effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/20"></div>
            
            {/* Shadow underneath */}
            <div className="absolute -inset-1 rounded-full bg-black/40 blur-md -z-10"></div>
          </div>
          
          {/* Trailing glow effect */}
          {!isAllIn && (
            <div 
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${getChipColor()} opacity-40 blur-lg animate-trail`}
              style={{ animationDelay: `${chip.delay}ms` }}
            ></div>
          )}
        </div>
      ))}
      
      {/* All-in explosion effect */}
      {isAllIn && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-red-500/30 animate-ping"
          style={{ animationDuration: '600ms' }}
        ></div>
      )}
    </div>
  );
};

export default ChipAnimation;
