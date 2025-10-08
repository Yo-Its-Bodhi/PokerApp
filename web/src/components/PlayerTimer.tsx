/**
 * PLAYER TIMER COMPONENT
 * 
 * Single ring timer that wraps around the avatar border:
 * - Teal (20s+): Full time remaining
 * - Yellow (10-5s): Warning zone
 * - Red (5-0s): Critical zone with pulsing rings
 */

import React, { useEffect, useState } from 'react';

interface PlayerTimerProps {
  playerId: string;
  isActive: boolean;
  baseTimeMs: number;
  baseMaxMs: number;
  timeBankMs: number;
  timeBankMaxMs: number;
  usingTimeBank: boolean;
  onRequestTimeBank?: () => void;
}

const PlayerTimer: React.FC<PlayerTimerProps> = ({
  playerId,
  isActive,
  baseTimeMs,
  baseMaxMs,
  timeBankMs,
  timeBankMaxMs,
  usingTimeBank,
  onRequestTimeBank
}) => {
  if (!isActive) return null;

  // Total time (base + time bank if using)
  const currentTimeMs = usingTimeBank ? timeBankMs : baseTimeMs;
  const maxTimeMs = usingTimeBank ? timeBankMaxMs : baseMaxMs;
  const timeInSeconds = currentTimeMs / 1000;
  
  // Calculate progress percentage (0-100, where 100 is full time)
  const progress = (currentTimeMs / maxTimeMs) * 100;

  // Color logic based on seconds remaining:
  // Teal: 20+ seconds
  // Yellow: 5-10 seconds  
  // Red: 0-5 seconds
  const getTimerColor = () => {
    if (timeInSeconds > 10) {
      return '#14b8a6'; // Teal
    } else if (timeInSeconds > 5) {
      return '#eab308'; // Yellow
    } else {
      return '#ef4444'; // Red
    }
  };

  const timerColor = getTimerColor();
  const isRedZone = timeInSeconds <= 5;

  // SVG circle parameters - size to perfectly wrap around avatar
  // Avatar is 80px (w-20 h-20), we need to wrap around it perfectly
  const size = 87; // Reduced by 1px (88 * 0.99 ≈ 87)
  const center = size / 2; // 43.5
  const strokeWidth = 4;
  const radius = 41.5; // Adjusted radius to match smaller size

  // Calculate stroke dash for circular progress
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <>
      {/* Single ring timer border that wraps the avatar */}
      <svg 
        width={size} 
        height={size} 
        className="absolute transform -rotate-90 pointer-events-none"
        style={{ 
          zIndex: 100,
          left: '-4.5px',
          top: '-4.5px'
        }}
      >
        {/* Background ring (dark) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(0, 0, 0, 0.5)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress ring (colored) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={timerColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-100"
          style={{
            filter: `drop-shadow(0 0 6px ${timerColor})`
          }}
        />
      </svg>

      {/* Pulsing ring effect for red zone (5 seconds or less) */}
      {isRedZone && (
        <>
          <div 
            className="absolute inset-0 rounded-full border-4 animate-ping pointer-events-none"
            style={{ 
              borderColor: timerColor,
              animationDuration: '1s',
              zIndex: 99
            }} 
          />
          <div 
            className="absolute inset-0 rounded-full border-4 animate-ping pointer-events-none"
            style={{ 
              borderColor: timerColor,
              animationDuration: '1s',
              animationDelay: '0.5s',
              zIndex: 99
            }} 
          />
        </>
      )}
    </>
  );
};

export default PlayerTimer;
