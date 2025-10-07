import React from 'react';

interface CardProps {
  suit?: string;
  rank?: string;
  color?: string;
  faceDown?: boolean;
  size?: 'small' | 'medium' | 'large';
  animationDelay?: number;
  showFlipAnimation?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  suit, 
  rank, 
  color = 'black', 
  faceDown = false,
  size = 'medium',
  animationDelay = 0,
  showFlipAnimation = false
}) => {
  const sizeClasses = {
    small: 'w-14 h-20',
    medium: 'w-20 h-28',
    large: 'w-24 h-32'
  };

  const fontSizes = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  };

  return (
    <div 
      className={`card-container ${sizeClasses[size]}`}
      style={{ 
        animationDelay: `${animationDelay}s`,
        perspective: '1000px'
      }}
    >
      <div className={`card-flipper ${faceDown ? 'is-flipped' : ''}`}>
        {/* Card Back - Darker Glassy Blue */}
        <div className="card-face card-back">
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 border-2 border-blue-400/40 shadow-lg backdrop-blur-sm">
            {/* Geometric pattern overlay - Glassy effect */}
            <div className="absolute inset-0 opacity-15">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(100,150,255,0.15)_25%,rgba(100,150,255,0.15)_50%,transparent_50%,transparent_75%,rgba(100,150,255,0.15)_75%)] bg-[length:20px_20px]"></div>
            </div>
            
            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
            
            {/* Center icon/logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/card-back-icon.png" 
                alt="Card back" 
                className="w-3/4 h-3/4 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                onError={(e) => {
                  // Fallback if image not found - show a geometric pattern
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <svg viewBox="0 0 100 100" class="w-3/4 h-3/4">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="4" opacity="0.6"/>
                        <circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="3" opacity="0.5"/>
                        <circle cx="50" cy="50" r="20" fill="none" stroke="white" stroke-width="2" opacity="0.4"/>
                        <circle cx="50" cy="50" r="10" fill="white" opacity="0.8"/>
                      </svg>
                    `;
                  }
                }}
              />
            </div>
            
            {/* Corner decorations - Blue themed */}
            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-blue-400/60 rounded-tl"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-blue-400/60 rounded-tr"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-blue-400/60 rounded-bl"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-blue-400/60 rounded-br"></div>
          </div>
        </div>

        {/* Card Front */}
        <div className="card-face card-front">
          <div className="w-full h-full flex flex-col items-center justify-center bg-white shadow-lg border-2 border-gray-300 rounded-lg">
            {/* Top rank only (no small suit) */}
            <div className={`absolute top-1 left-1 ${fontSizes[size]} font-bold leading-none`} style={{ color: color === 'red' ? '#dc2626' : '#1f2937' }}>
              <div>{rank}</div>
            </div>
            
            {/* Center suit symbol - Smaller for hole cards to prevent squashing */}
            <div className={`font-bold`} style={{ color: color === 'red' ? '#dc2626' : '#1f2937' }}>
              <div className={`${size === 'small' ? 'text-3xl' : size === 'medium' ? 'text-5xl' : 'text-6xl'}`}>
                {suit}
              </div>
            </div>
            
            {/* Bottom rank only (rotated, no small suit) */}
            <div className={`absolute bottom-1 right-1 ${fontSizes[size]} font-bold leading-none rotate-180`} style={{ color: color === 'red' ? '#dc2626' : '#1f2937' }}>
              <div>{rank}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
