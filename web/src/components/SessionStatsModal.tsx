import React from 'react';
import { SessionStats, calculateDerivedStats, downloadStats, clearStats } from '../utils/sessionStats';
import { playButtonClick } from '../utils/audioSystem';

interface SessionStatsModalProps {
  stats: SessionStats | null;
  onClose: () => void;
  onReset: () => void;
}

const SessionStatsModal: React.FC<SessionStatsModalProps> = ({ stats, onClose, onReset }) => {
  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-900 border-2 border-cyan-400/40 rounded-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">No Stats Yet</h2>
          <p className="text-slate-300 mb-6">Play some hands to start tracking your stats!</p>
          <button
            onClick={() => { playButtonClick(); onClose(); }}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const derived = calculateDerivedStats(stats);

  const handleDownload = () => {
    playButtonClick();
    downloadStats(stats);
  };

  const handleReset = () => {
    playButtonClick();
    if (confirm('Are you sure you want to reset all stats? This cannot be undone!')) {
      clearStats();
      onReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
      <div 
        className="relative max-w-4xl w-full my-8"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.3), inset 0 0 40px rgba(6, 182, 212, 0.08)',
          borderRadius: '12px',
        }}
      >
        {/* Corners */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-cyan-400 opacity-80"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))' }}></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-cyan-400 opacity-80"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))' }}></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-cyan-400 opacity-80"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))' }}></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyan-400 opacity-80"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))' }}></div>

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2"
                style={{ textShadow: '0 0 20px rgba(6, 182, 212, 1)' }}>
              📊 SESSION STATS
            </h2>
            <p className="text-slate-400 text-sm">
              {stats.playerAlias} • Session Duration: {derived.durationText}
            </p>
          </div>

          {/* Profit/Loss Banner */}
          <div className={`text-center py-4 mb-6 rounded-lg ${
            derived.isProfit ? 'bg-green-500/20 border border-green-400/40' : 'bg-red-500/20 border border-red-400/40'
          }`}>
            <div className="text-sm uppercase tracking-wider text-slate-300 mb-1">Net Profit/Loss</div>
            <div className={`text-4xl font-black ${derived.isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {derived.isProfit ? '+' : ''}{derived.netProfit.toLocaleString()} CHIPS
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {derived.profitPerHand} chips per hand
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {/* Hands Statistics */}
            <StatCard
              label="Hands Played"
              value={stats.handsPlayed}
              icon="🎴"
              color="cyan"
            />
            <StatCard
              label="Hands Won"
              value={stats.handsWon}
              icon="🏆"
              color="green"
            />
            <StatCard
              label="Win Rate"
              value={`${derived.winRate}%`}
              icon="📈"
              color="purple"
            />

            {/* Money Statistics */}
            <StatCard
              label="Biggest Pot"
              value={stats.biggestPot.toLocaleString()}
              icon="💰"
              color="yellow"
            />
            <StatCard
              label="Biggest Win"
              value={stats.biggestWin.toLocaleString()}
              icon="💎"
              color="green"
            />
            <StatCard
              label="Biggest Loss"
              value={stats.biggestLoss.toLocaleString()}
              icon="📉"
              color="red"
            />

            {/* Action Statistics */}
            <StatCard
              label="Total Bets"
              value={stats.totalBets}
              icon="💵"
              color="blue"
            />
            <StatCard
              label="Total Raises"
              value={stats.totalRaises}
              icon="📈"
              color="green"
            />
            <StatCard
              label="Total Folds"
              value={stats.totalFolds}
              icon="🚫"
              color="red"
            />

            {/* All-In Statistics */}
            <StatCard
              label="All-In Attempts"
              value={stats.allInAttempts}
              icon="🎯"
              color="orange"
            />
            <StatCard
              label="All-In Wins"
              value={stats.allInWins}
              icon="✨"
              color="green"
            />
            <StatCard
              label="All-In Success"
              value={`${derived.allInSuccessRate}%`}
              icon="🔥"
              color="orange"
            />

            {/* Showdown Statistics */}
            <StatCard
              label="Showdowns"
              value={stats.showdownsReached}
              icon="👁️"
              color="purple"
            />
            <StatCard
              label="Showdown Wins"
              value={stats.showdownsWon}
              icon="🎊"
              color="pink"
            />
            <StatCard
              label="Showdown Success"
              value={`${derived.showdownSuccessRate}%`}
              icon="⭐"
              color="cyan"
            />
          </div>

          {/* Streak Info */}
          {stats.currentStreak !== 0 && (
            <div className={`text-center py-3 rounded-lg mb-6 ${
              stats.currentStreak > 0 ? 'bg-green-500/10 border border-green-400/30' : 'bg-red-500/10 border border-red-400/30'
            }`}>
              <span className={`text-sm font-bold ${stats.currentStreak > 0 ? 'text-green-400' : 'text-red-400'}`}>
                Current Streak: {Math.abs(stats.currentStreak)} {stats.currentStreak > 0 ? 'Wins' : 'Losses'} 🔥
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleDownload}
              className="py-3 px-4 bg-blue-600/20 hover:bg-blue-600/30 border-2 border-blue-400/40 text-blue-300 font-bold rounded-lg transition-all hover:scale-105"
            >
              📥 Export JSON
            </button>
            <button
              onClick={handleReset}
              className="py-3 px-4 bg-red-600/20 hover:bg-red-600/30 border-2 border-red-400/40 text-red-300 font-bold rounded-lg transition-all hover:scale-105"
            >
              🗑️ Reset Stats
            </button>
            <button
              onClick={() => { playButtonClick(); onClose(); }}
              className="py-3 px-4 bg-cyan-600/20 hover:bg-cyan-600/30 border-2 border-cyan-400/40 text-cyan-300 font-bold rounded-lg transition-all hover:scale-105"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color: 'cyan' | 'purple' | 'green' | 'red' | 'yellow' | 'blue' | 'orange' | 'pink';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorClasses = {
    cyan: 'border-cyan-400/30 bg-cyan-500/10',
    purple: 'border-purple-400/30 bg-purple-500/10',
    green: 'border-green-400/30 bg-green-500/10',
    red: 'border-red-400/30 bg-red-500/10',
    yellow: 'border-yellow-400/30 bg-yellow-500/10',
    blue: 'border-blue-400/30 bg-blue-500/10',
    orange: 'border-orange-400/30 bg-orange-500/10',
    pink: 'border-pink-400/30 bg-pink-500/10',
  };

  const textColorClasses = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    pink: 'text-pink-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} transition-all hover:scale-105`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-black ${textColorClasses[color]}`}>{value}</div>
    </div>
  );
};

export default SessionStatsModal;
