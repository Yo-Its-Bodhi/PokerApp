/**
 * PLAYER TIMER COMPONENT
 * 
 * Dual-ring timer visualization:
 * - Outer ring: Base turn timer
 * - Inner ring: Time bank
 * - Pulsing effects and color transitions
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
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    // Trigger re-render for smooth animation
    if (isActive) {
      setAnimationKey(prev => prev + 1);
    }
  }, [isActive, usingTimeBank]);

  if (!isActive) return null;

  // Calculate progress percentages
  const baseProgress = (baseTimeMs / baseMaxMs) * 100;
  const timeBankProgress = (timeBankMs / timeBankMaxMs) * 100;

  // Determine colors based on time remaining
  const getTimerColor = (progressPercent: number, isBank: boolean) => {
    if (isBank) {
      // Time bank: red colors
      if (progressPercent > 50) return '#ff0088'; // Magenta
      if (progressPercent > 25) return '#ff0044';
      return '#ff0000'; // Red
    } else {
      // Base timer: cyan to yellow to red
      if (progressPercent > 50) return '#00ffff'; // Cyan
      if (progressPercent > 25) return '#ffff00'; // Yellow
      return '#ff8800'; // Orange
    }
  };

  const baseColor = usingTimeBank ? '#444' : getTimerColor(baseProgress, false);
  const timeBankColor = getTimerColor(timeBankProgress, true);

  // SVG circle parameters (reduced size)
  const size = 60;
  const center = size / 2;
  const outerRadius = 26;
  const innerRadius = 20;
  const strokeWidth = 4;

  // Calculate stroke dash for circular progress
  const getCircumference = (radius: number) => 2 * Math.PI * radius;
  const outerCircumference = getCircumference(outerRadius);
  const innerCircumference = getCircumference(innerRadius);

  const outerDashOffset = outerCircumference * (1 - baseProgress / 100);
  const innerDashOffset = innerCircumference * (1 - timeBankProgress / 100);

  const canUseTimeBank = !usingTimeBank && timeBankMs > 0 && baseTimeMs < 3000;

  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* Dual Ring Timer SVG */}
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Outer ring background */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={strokeWidth}
          />
          
          {/* Outer ring progress (base timer) */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke={baseColor}
            strokeWidth={strokeWidth}
            strokeDasharray={outerCircumference}
            strokeDashoffset={outerDashOffset}
            strokeLinecap="round"
            className={`transition-all duration-100 ${usingTimeBank ? '' : 'drop-shadow-[0_0_8px_currentColor]'}`}
            style={{
              filter: usingTimeBank ? 'none' : `drop-shadow(0 0 8px ${baseColor})`
            }}
          />

          {/* Inner ring background */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={strokeWidth}
          />
          
          {/* Inner ring progress (time bank) */}
          {timeBankMs > 0 && (
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="none"
              stroke={timeBankColor}
              strokeWidth={strokeWidth}
              strokeDasharray={innerCircumference}
              strokeDashoffset={innerDashOffset}
              strokeLinecap="round"
              className={`transition-all duration-100 ${usingTimeBank ? 'animate-pulse drop-shadow-[0_0_12px_currentColor]' : ''}`}
              style={{
                filter: usingTimeBank ? `drop-shadow(0 0 12px ${timeBankColor})` : 'none'
              }}
            />
          )}

          {/* Center text */}
          <text
            x={center}
            y={center + 4}
            textAnchor="middle"
            fill="#00ffff"
            fontSize="16"
            fontWeight="bold"
            className="font-mono transform rotate-90"
            style={{ transformOrigin: 'center' }}
          >
            {Math.ceil((usingTimeBank ? timeBankMs : baseTimeMs) / 1000)}
          </text>
        </svg>

        {/* Flash border when switching to time bank */}
        {usingTimeBank && (
          <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping pointer-events-none" />
        )}
      </div>



      {/* Status text - hidden to save space */}
    </div>
  );
};

export default PlayerTimer;
