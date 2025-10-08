/**
 * LIVE TABLE STATS BANNER
 * 
 * Casino-style live statistics tracker with animated counters
 * Shows real-time game statistics at the top of the table
 */

import React, { useState, useEffect } from 'react';

interface TableStats {
  totalWagered: number;
  handsPlayed: number;
  biggestPot: number;
  averagePot: number;
  tableStartTime: number;
  totalPlayers: number;
}

interface LiveTableStatsProps {
  stats: TableStats;
  theme: 'dark' | 'light';
  onOpenDetails?: () => void;
}

const LiveTableStats: React.FC<LiveTableStatsProps> = ({ stats, theme, onOpenDetails }) => {
  const [minimized, setMinimized] = useState(true); // Start minimized by default
  const [animatedStats, setAnimatedStats] = useState({
    totalWagered: 0,
    handsPlayed: 0,
    biggestPot: 0,
    averagePot: 0
  });

  // Animate counter changes
  useEffect(() => {
    const duration = 1000; // 1 second animation
    const steps = 30;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedStats({
        totalWagered: Math.floor(animatedStats.totalWagered + (stats.totalWagered - animatedStats.totalWagered) * progress),
        handsPlayed: Math.floor(animatedStats.handsPlayed + (stats.handsPlayed - animatedStats.handsPlayed) * progress),
        biggestPot: Math.floor(animatedStats.biggestPot + (stats.biggestPot - animatedStats.biggestPot) * progress),
        averagePot: Math.floor(animatedStats.averagePot + (stats.averagePot - animatedStats.averagePot) * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          totalWagered: stats.totalWagered,
          handsPlayed: stats.handsPlayed,
          biggestPot: stats.biggestPot,
          averagePot: stats.averagePot
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [stats.totalWagered, stats.handsPlayed, stats.biggestPot, stats.averagePot]);

  // Calculate table age (since creation)
  const getTableAge = () => {
    const now = Date.now();
    const diff = now - stats.tableStartTime;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      const minutes = Math.floor((diff % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m`;
  };

  // Calculate hands per hour
  const getHandsPerHour = () => {
    const now = Date.now();
    const hoursElapsed = (now - stats.tableStartTime) / 3600000;
    if (hoursElapsed < 0.01) return 0;
    return Math.round(stats.handsPlayed / hoursElapsed);
  };

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  // SHIDO to USD conversion (example rate: 1 SHIDO = $0.0001)
  const shidoToUSD = (shido: number) => {
    return (shido * 0.0001).toFixed(2);
  };

  if (minimized) {
    return (
      <div 
        className="cursor-pointer"
        onClick={() => setMinimized(false)}
      >
        <div className={`
          px-6 py-2 rounded-full 
          ${theme === 'dark' 
            ? 'bg-gradient-to-r from-cyan-900/80 to-purple-900/80 border border-cyan-500/50' 
            : 'bg-gradient-to-r from-blue-100/80 to-purple-100/80 border border-blue-400/50'
          }
          backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105
        `}>
          <div className="flex items-center gap-4">
            <div className={`text-sm font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>
              📊 Live Stats
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {stats.handsPlayed} hands • ${formatNumber(animatedStats.totalWagered)} wagered
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        className="relative backdrop-blur-md shadow-2xl transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)'
        }}
      >
        {/* 🔥 EXACT LOBBY CARD STYLE CORNERS 🔥 */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none z-10"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none z-10"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none z-10"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none z-10"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        
        {/* Corner glow dots */}
        <div className="absolute top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>

        {/* Header */}
        <div className={`
          flex items-center justify-between px-6 py-3 border-b
          ${theme === 'dark' ? 'border-cyan-500/20' : 'border-blue-400/20'}
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent
              ${theme === 'dark' 
                ? 'from-cyan-400 via-purple-400 to-pink-400' 
                : 'from-blue-600 via-purple-600 to-pink-600'
              }
            `}>
              🎰 ALL-TIME TABLE STATISTICS
            </div>
            <div className={`
              px-3 py-1 rounded-full text-xs font-semibold animate-pulse
              ${theme === 'dark'
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-red-100 text-red-600 border border-red-300'
              }
            `}>
              ● LIVE
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onOpenDetails && (
              <button
                onClick={onOpenDetails}
                className={`
                  px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                  ${theme === 'dark'
                    ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50'
                    : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 border border-blue-500/50'
                  }
                `}
              >
                📈 Details
              </button>
            )}
            <button
              onClick={() => setMinimized(true)}
              className={`
                p-2 rounded-lg transition-all duration-300
                ${theme === 'dark'
                  ? 'hover:bg-white/10 text-gray-400'
                  : 'hover:bg-black/10 text-gray-600'
                }
              `}
              title="Minimize"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6">
          {/* Total Wagered */}
          <StatCard
            icon="💰"
            label="Total Wagered"
            value={`$${formatNumber(animatedStats.totalWagered)}`}
            subtitle={`≈ $${shidoToUSD(animatedStats.totalWagered)} USD`}
            theme={theme}
            color="cyan"
          />

          {/* Hands Played */}
          <StatCard
            icon="🃏"
            label="Hands Played"
            value={formatNumber(animatedStats.handsPlayed)}
            subtitle={`${getHandsPerHour()} per hour`}
            theme={theme}
            color="purple"
          />

          {/* Biggest Pot */}
          <StatCard
            icon="🏆"
            label="Biggest Pot"
            value={`$${formatNumber(animatedStats.biggestPot)}`}
            subtitle={animatedStats.biggestPot > 0 ? 'Record' : 'No hands yet'}
            theme={theme}
            color="amber"
          />

          {/* Average Pot */}
          <StatCard
            icon="📊"
            label="Average Pot"
            value={`$${formatNumber(animatedStats.averagePot)}`}
            subtitle="Per hand"
            theme={theme}
            color="green"
          />

          {/* Table Age */}
          <StatCard
            icon="⏱️"
            label="Table Age"
            value={getTableAge()}
            subtitle="Since creation"
            theme={theme}
            color="blue"
          />

          {/* Total Players */}
          <StatCard
            icon="👥"
            label="Total Players"
            value={stats.totalPlayers.toString()}
            subtitle="Seated"
            theme={theme}
            color="pink"
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  subtitle: string;
  theme: 'dark' | 'light';
  color: 'cyan' | 'purple' | 'amber' | 'green' | 'blue' | 'pink';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtitle, theme, color }) => {
  const colorClasses = {
    dark: {
      cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/50 text-cyan-400',
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/50 text-purple-400',
      amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/50 text-amber-400',
      green: 'from-green-500/20 to-green-600/20 border-green-500/50 text-green-400',
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/50 text-blue-400',
      pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/50 text-pink-400'
    },
    light: {
      cyan: 'from-cyan-100 to-cyan-200 border-cyan-400 text-cyan-700',
      purple: 'from-purple-100 to-purple-200 border-purple-400 text-purple-700',
      amber: 'from-amber-100 to-amber-200 border-amber-400 text-amber-700',
      green: 'from-green-100 to-green-200 border-green-400 text-green-700',
      blue: 'from-blue-100 to-blue-200 border-blue-400 text-blue-700',
      pink: 'from-pink-100 to-pink-200 border-pink-400 text-pink-700'
    }
  };

  const colors = colorClasses[theme][color];

  return (
    <div className={`
      rounded-xl p-4 border-2 bg-gradient-to-br transition-all duration-300 hover:scale-105
      ${colors}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <div className={`text-xs font-semibold uppercase tracking-wide ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {label}
        </div>
      </div>
      <div className="text-2xl font-bold mb-1 transition-all duration-500">
        {value}
      </div>
      <div className={`text-xs ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {subtitle}
      </div>
    </div>
  );
};

export default LiveTableStats;
