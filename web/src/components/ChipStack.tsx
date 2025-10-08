import React from 'react';

interface ChipStackProps {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
}

// Realistic chip denominations: White=$100, Red=$500, Green=$1000, Black=$5000
type ChipDenom = 100 | 500 | 1000 | 5000;

const ChipStack: React.FC<ChipStackProps> = ({ amount, size = 'medium', animate = false }) => {
  if (amount === 0) return null;

  // Get chip color and label by denomination
  const getChipStyle = (denom: ChipDenom) => {
    switch(denom) {
      case 100:
        return {
          gradient: 'from-gray-100 via-gray-200 to-gray-300',
          border: 'border-gray-400',
          stripes: 'rgba(80, 80, 80, 0.3)',
          label: '100',
          textColor: 'text-gray-800'
        };
      case 500:
        return {
          gradient: 'from-red-500 via-red-600 to-red-700',
          border: 'border-red-800',
          stripes: 'rgba(139, 0, 0, 0.4)',
          label: '500',
          textColor: 'text-white'
        };
      case 1000:
        return {
          gradient: 'from-green-500 via-green-600 to-green-700',
          border: 'border-green-800',
          stripes: 'rgba(0, 100, 0, 0.4)',
          label: '1K',
          textColor: 'text-white'
        };
      case 5000:
        return {
          gradient: 'from-black via-gray-900 to-gray-950',
          border: 'border-gray-600',
          stripes: 'rgba(255, 255, 255, 0.15)',
          label: '5K',
          textColor: 'text-white'
        };
    }
  };

  // Calculate realistic chip breakdown
  const calculateChips = (total: number): ChipDenom[] => {
    const chips: ChipDenom[] = [];
    let remaining = total;
    const maxPerStack = 10; // Max chips in one stack
    
    // Break down by denomination (largest first)
    const denoms: ChipDenom[] = [5000, 1000, 500, 100];
    
    for (const denom of denoms) {
      const count = Math.floor(remaining / denom);
      if (count > 0) {
        // Add up to maxPerStack chips of this denomination
        const chipsToAdd = Math.min(count, maxPerStack);
        for (let i = 0; i < chipsToAdd; i++) {
          chips.push(denom);
        }
        remaining -= count * denom;
      }
      // Stop if we have enough chips to show
      if (chips.length >= maxPerStack) break;
    }
    
    // Ensure at least one chip shows
    if (chips.length === 0 && total > 0) {
      chips.push(100);
    }
    
    return chips;
  };

  const chips = calculateChips(amount);
  
  // Size configurations - 10% bigger chips
  const sizeConfigs = {
    small: { width: 'w-9', height: 'h-9', text: 'text-[9px]', spacing: 3.5, labelText: 'text-xs' },
    medium: { width: 'w-11', height: 'h-11', text: 'text-[10px]', spacing: 4.5, labelText: 'text-sm' },
    large: { width: 'w-14', height: 'h-14', text: 'text-sm', spacing: 5.5, labelText: 'text-base' }
  };

  const config = sizeConfigs[size];

  // Calculate stack height (10% bigger)
  const baseHeight = size === 'small' ? 36 : size === 'medium' ? 44 : 56;
  const stackHeight = chips.length * config.spacing + baseHeight;

  return (
    <div className={`relative ${animate ? 'animate-chip-stack-in' : 'animate-chip-stack-in'} flex flex-col items-center`}>
      {/* Chip Stack - Realistic poker chips stacked vertically */}
      <div className="relative flex flex-col items-center">
        <div className="relative" style={{ height: `${stackHeight}px` }}>
          {chips.map((denom, i) => {
            const style = getChipStyle(denom);
            return (
              <div
                key={`${denom}-${i}`}
                className={`${config.width} ${config.height} rounded-full bg-gradient-to-br ${style.gradient} border-2 ${style.border} shadow-lg absolute left-1/2 -translate-x-1/2`}
                style={{
                  bottom: `${i * config.spacing}px`,
                  zIndex: i
                }}
              >
                {/* Chip edge stripes for 3D effect */}
                <div 
                  className="absolute inset-0 rounded-full opacity-60"
                  style={{
                    background: `repeating-conic-gradient(from 0deg, ${style.stripes} 0deg 18deg, transparent 18deg 36deg)`
                  }}
                />
                
                {/* Card back logo on chip */}
                <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
                  <img 
                    src="/card-back-icon.png" 
                    alt="" 
                    className="w-2/3 h-2/3 object-contain opacity-60"
                    onError={(e) => {
                      // Fallback if image not found - show denomination instead
                      const currentTarget = e.currentTarget as HTMLImageElement;
                      currentTarget.style.display = 'none';
                      const fallbackDiv = currentTarget.parentElement?.nextElementSibling as HTMLElement;
                      if (fallbackDiv) {
                        fallbackDiv.style.opacity = '1';
                      }
                    }}
                  />
                </div>
                
                {/* Chip center with denomination label (fallback when logo fails) */}
                <div className={`absolute inset-0 flex items-center justify-center ${style.textColor}`} style={{ opacity: 0 }}>
                  <span className={`${config.text} font-black drop-shadow-sm`}>
                    {style.label}
                  </span>
                </div>
                
                {/* Highlight for depth */}
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/10 rounded-t-full" />
                
                {/* Border accent */}
                <div className="absolute inset-0 rounded-full border border-white/10"></div>
              </div>
            );
          })}
        </div>
        
        {/* Total amount label below stack - bigger font */}
        <div 
          className={`${config.labelText} font-bold text-white bg-black/70 px-2 py-1 rounded whitespace-nowrap shadow-lg mt-1 border border-yellow-400/30`}
          style={{ zIndex: 100 }}
        >
          ${(amount / 1000).toFixed(1)}K
        </div>
      </div>
    </div>
  );
};

export default ChipStack;
