import React, { useEffect, useState } from 'react';

interface WinPopupProps {
  amount: number;
  seatNum: number;
  onComplete?: () => void;
}

export const WinPopup: React.FC<WinPopupProps> = ({ amount, seatNum, onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Auto-hide after animation completes
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 2000); // Match animation duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show || amount <= 0) return null;

  // Seat-specific positioning
  const positions = [
    'bottom-32 left-1/2 -translate-x-1/2',      // Seat 1 - Below player
    'top-32 left-1/2 -translate-x-1/2',          // Seat 2 - Above player
    'top-32 right-1/4 -translate-x-1/2',         // Seat 3 - Above player
    'bottom-32 right-8 -translate-x-1/2',        // Seat 4 - Below player
    'bottom-32 left-1/4 -translate-x-1/2',       // Seat 5 - Below player
    'bottom-32 right-1/4 -translate-x-1/2',      // Seat 6 - Below player
  ];

  return (
    <div 
      className={`absolute ${positions[seatNum - 1]} z-50 animate-win-popup pointer-events-none`}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 blur-xl bg-yellow-400/50 rounded-full animate-win-bounce"></div>
        
        {/* Win amount text */}
        <div className="relative text-center">
          <div className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,1)]">
            +${amount.toLocaleString()}
          </div>
          <div className="text-xl font-bold text-green-400 drop-shadow-lg mt-1">
            WIN!
          </div>
        </div>
      </div>
    </div>
  );
};
