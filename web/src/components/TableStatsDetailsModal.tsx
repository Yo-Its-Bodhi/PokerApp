/**
 * TABLE STATS DETAILS MODAL
 * 
 * Detailed breakdown of all table statistics
 * Shows advanced metrics, player statistics, and hand distributions
 */

import React from 'react';

interface DetailedStats {
  // Basic Stats
  totalWagered: number;
  handsPlayed: number;
  biggestPot: number;
  averagePot: number;
  tableStartTime: number;
  totalPlayers: number;

  // Advanced Stats
  totalFolds: number;
  totalCalls: number;
  totalRaises: number;
  totalAllIns: number;
  
  // Hand Distribution
  highCardWins: number;
  pairWins: number;
  twoPairWins: number;
  threeOfAKindWins: number;
  straightWins: number;
  flushWins: number;
  fullHouseWins: number;
  fourOfAKindWins: number;
  straightFlushWins: number;
  royalFlushWins: number;

  // Player Stats
  mostAggressivePlayer?: string;
  tightestPlayer?: string;
  biggestWinner?: string;
  biggestLoser?: string;
  longestWinStreak?: number;
}

interface TableStatsDetailsModalProps {
  stats: DetailedStats;
  theme: 'dark' | 'light';
  onClose: () => void;
}

const TableStatsDetailsModal: React.FC<TableStatsDetailsModalProps> = ({ stats, theme, onClose }) => {
  const formatNumber = (num: number) => num.toLocaleString('en-US');
  
  const shidoToUSD = (shido: number) => (shido * 0.0001).toFixed(2);

  const getUptime = () => {
    const now = Date.now();
    const diff = now - stats.tableStartTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getHandsPerHour = () => {
    const now = Date.now();
    const hoursElapsed = (now - stats.tableStartTime) / 3600000;
    if (hoursElapsed < 0.01) return 0;
    return Math.round(stats.handsPlayed / hoursElapsed);
  };

  const totalActions = stats.totalFolds + stats.totalCalls + stats.totalRaises + stats.totalAllIns;
  const foldPercent = totalActions > 0 ? ((stats.totalFolds / totalActions) * 100).toFixed(1) : '0.0';
  const callPercent = totalActions > 0 ? ((stats.totalCalls / totalActions) * 100).toFixed(1) : '0.0';
  const raisePercent = totalActions > 0 ? ((stats.totalRaises / totalActions) * 100).toFixed(1) : '0.0';
  const allInPercent = totalActions > 0 ? ((stats.totalAllIns / totalActions) * 100).toFixed(1) : '0.0';

  const totalHandWins = stats.highCardWins + stats.pairWins + stats.twoPairWins + 
                         stats.threeOfAKindWins + stats.straightWins + stats.flushWins +
                         stats.fullHouseWins + stats.fourOfAKindWins + stats.straightFlushWins +
                         stats.royalFlushWins;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
         onClick={onClose}>
      <div className={`
        w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border-2
        ${theme === 'dark'
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30'
          : 'bg-gradient-to-br from-white via-blue-50 to-white border-blue-400/30'
        }
      `}
           onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`
          sticky top-0 z-10 flex items-center justify-between px-8 py-6 border-b backdrop-blur-md
          ${theme === 'dark' 
            ? 'bg-slate-900/80 border-cyan-500/20' 
            : 'bg-white/80 border-blue-400/20'
          }
        `}>
          <div>
            <h2 className={`
              text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent
              ${theme === 'dark'
                ? 'from-cyan-400 via-purple-400 to-pink-400'
                : 'from-blue-600 via-purple-600 to-pink-600'
              }
            `}>
              📊 Detailed Table Statistics
            </h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Complete breakdown of all table activity
            </p>
          </div>
          <button
            onClick={onClose}
            className={`
              p-3 rounded-xl transition-all duration-300 hover:scale-110
              ${theme === 'dark'
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
                : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-300'
              }
            `}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Overview Section */}
          <Section title="📈 Overview" theme={theme}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label="Total SHIDO Wagered" value={`$${formatNumber(stats.totalWagered)}`} theme={theme} />
              <DetailItem label="USD Equivalent" value={`≈ $${shidoToUSD(stats.totalWagered)} USD`} theme={theme} />
              <DetailItem label="Hands Played" value={formatNumber(stats.handsPlayed)} theme={theme} />
              <DetailItem label="Hands Per Hour" value={`${getHandsPerHour()} hands/hr`} theme={theme} />
              <DetailItem label="Average Pot Size" value={`$${formatNumber(stats.averagePot)}`} theme={theme} />
              <DetailItem label="Biggest Pot" value={`$${formatNumber(stats.biggestPot)}`} theme={theme} />
              <DetailItem label="Table Uptime" value={getUptime()} theme={theme} />
              <DetailItem label="Total Players" value={stats.totalPlayers.toString()} theme={theme} />
              <DetailItem label="Total Actions" value={formatNumber(totalActions)} theme={theme} />
            </div>
          </Section>

          {/* Action Frequency */}
          <Section title="🎯 Action Frequency" theme={theme}>
            <div className="space-y-3">
              <ActionBar label="Folds" count={stats.totalFolds} percent={foldPercent} color="red" theme={theme} />
              <ActionBar label="Calls" count={stats.totalCalls} percent={callPercent} color="blue" theme={theme} />
              <ActionBar label="Raises" count={stats.totalRaises} percent={raisePercent} color="green" theme={theme} />
              <ActionBar label="All-Ins" count={stats.totalAllIns} percent={allInPercent} color="purple" theme={theme} />
            </div>
          </Section>

          {/* Hand Distribution */}
          <Section title="🃏 Winning Hand Distribution" theme={theme}>
            <div className="space-y-2">
              <HandBar label="Royal Flush" count={stats.royalFlushWins} total={totalHandWins} color="purple" theme={theme} />
              <HandBar label="Straight Flush" count={stats.straightFlushWins} total={totalHandWins} color="pink" theme={theme} />
              <HandBar label="Four of a Kind" count={stats.fourOfAKindWins} total={totalHandWins} color="red" theme={theme} />
              <HandBar label="Full House" count={stats.fullHouseWins} total={totalHandWins} color="orange" theme={theme} />
              <HandBar label="Flush" count={stats.flushWins} total={totalHandWins} color="cyan" theme={theme} />
              <HandBar label="Straight" count={stats.straightWins} total={totalHandWins} color="blue" theme={theme} />
              <HandBar label="Three of a Kind" count={stats.threeOfAKindWins} total={totalHandWins} color="green" theme={theme} />
              <HandBar label="Two Pair" count={stats.twoPairWins} total={totalHandWins} color="yellow" theme={theme} />
              <HandBar label="Pair" count={stats.pairWins} total={totalHandWins} color="amber" theme={theme} />
              <HandBar label="High Card" count={stats.highCardWins} total={totalHandWins} color="gray" theme={theme} />
            </div>
          </Section>

          {/* Player Highlights */}
          <Section title="👑 Player Highlights" theme={theme}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HighlightCard icon="🔥" label="Most Aggressive" value={stats.mostAggressivePlayer || 'N/A'} theme={theme} />
              <HighlightCard icon="🛡️" label="Tightest Player" value={stats.tightestPlayer || 'N/A'} theme={theme} />
              <HighlightCard icon="💰" label="Biggest Winner" value={stats.biggestWinner || 'N/A'} theme={theme} />
              <HighlightCard icon="📉" label="Biggest Loser" value={stats.biggestLoser || 'N/A'} theme={theme} />
            </div>
            {stats.longestWinStreak !== undefined && stats.longestWinStreak > 0 && (
              <div className="mt-4">
                <HighlightCard icon="🏆" label="Longest Win Streak" value={`${stats.longestWinStreak} hands`} theme={theme} />
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

// Helper Components

const Section: React.FC<{ title: string; theme: 'dark' | 'light'; children: React.ReactNode }> = ({ title, theme, children }) => (
  <div>
    <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>
      {title}
    </h3>
    {children}
  </div>
);

const DetailItem: React.FC<{ label: string; value: string; theme: 'dark' | 'light' }> = ({ label, value, theme }) => (
  <div className={`
    p-4 rounded-lg border
    ${theme === 'dark' 
      ? 'bg-slate-800/50 border-cyan-500/20' 
      : 'bg-blue-50/50 border-blue-400/20'
    }
  `}>
    <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
    }`}>
      {label}
    </div>
    <div className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      {value}
    </div>
  </div>
);

const ActionBar: React.FC<{ label: string; count: number; percent: string; color: string; theme: 'dark' | 'light' }> = 
  ({ label, count, percent, color, theme }) => {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </span>
        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {count.toLocaleString()} ({percent}%)
        </span>
      </div>
      <div className={`w-full h-3 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}>
        <div 
          className={`h-full rounded-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const HandBar: React.FC<{ label: string; count: number; total: number; color: string; theme: 'dark' | 'light' }> = 
  ({ label, count, total, color, theme }) => {
  const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    cyan: 'bg-cyan-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    amber: 'bg-amber-500',
    gray: 'bg-gray-500'
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </span>
        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {count} ({percent}%)
        </span>
      </div>
      <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}>
        <div 
          className={`h-full rounded-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const HighlightCard: React.FC<{ icon: string; label: string; value: string; theme: 'dark' | 'light' }> = 
  ({ icon, label, value, theme }) => (
  <div className={`
    p-4 rounded-xl border-2 transition-all duration-300
    ${theme === 'dark'
      ? 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30'
      : 'bg-gradient-to-br from-blue-100 to-purple-100 border-blue-400/50'
    }
  `}>
    <div className="flex items-center gap-3">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className={`text-xs font-semibold uppercase tracking-wide ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {label}
        </div>
        <div className={`text-lg font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>
          {value}
        </div>
      </div>
    </div>
  </div>
);

export default TableStatsDetailsModal;
