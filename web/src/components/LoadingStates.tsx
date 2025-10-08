// Professional Loading States & Skeleton Screens
import React from 'react';

// Shimmer effect for skeleton screens
export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-slate-800/50 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
    </div>
  );
}

// Loading skeleton for player seat
export function PlayerSeatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 animate-fadeIn">
      {/* Avatar skeleton */}
      <Shimmer className="w-24 h-24 rounded-full" />
      
      {/* Name skeleton */}
      <Shimmer className="w-28 h-8 rounded-lg" />
      
      {/* Stack skeleton */}
      <Shimmer className="w-32 h-8 rounded-lg" />
    </div>
  );
}

// Loading skeleton for community cards
export function CommunityCardsSkeleton() {
  return (
    <div className="flex gap-2 animate-fadeIn">
      {[1, 2, 3, 4, 5].map(i => (
        <Shimmer key={i} className="w-16 h-24 rounded-lg" />
      ))}
    </div>
  );
}

// Loading skeleton for table
export function TableLoadingSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-full max-w-6xl aspect-[16/10]">
        {/* Table outline */}
        <div className="absolute inset-0 rounded-[50%] border-4 border-slate-700 animate-pulse-subtle" />
        
        {/* Center pot skeleton */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <Shimmer className="w-40 h-12 rounded-lg" />
          <Shimmer className="w-48 h-6 rounded" />
        </div>
        
        {/* Player seats skeletons */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const radian = (angle * Math.PI) / 180;
          const x = 50 + 45 * Math.cos(radian);
          const y = 50 + 45 * Math.sin(radian);
          
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <PlayerSeatSkeleton />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Loading spinner with cyberpunk style
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className={`${sizeClasses[size]} border-cyan-400 border-t-transparent rounded-full animate-spin`}
         style={{ 
           boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
           animationDuration: '0.8s'
         }} 
    />
  );
}

// Full-screen loading overlay
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
      <LoadingSpinner size="lg" />
      <p className="mt-6 text-cyan-400 text-xl font-bold tracking-wider animate-pulse-subtle"
         style={{ textShadow: '0 0 20px rgba(6, 182, 212, 0.8)' }}>
        {message}
      </p>
    </div>
  );
}

// Inline loading state for buttons
export function ButtonLoading() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      <span>Processing...</span>
    </div>
  );
}

// Add to tailwind.config.js:
/*
  animation: {
    'shimmer': 'shimmer 2s infinite',
  },
  keyframes: {
    shimmer: {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(100%)' },
    },
  },
*/
