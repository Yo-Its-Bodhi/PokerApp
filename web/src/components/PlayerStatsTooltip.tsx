import React from 'react';

interface PlayerStatsTooltipProps {
  player: {
    name: string;
    avatar?: string;
    stack: number;
    handsPlayed?: number;
    handsWon?: number;
    biggestPot?: number;
    currentBuyIn?: number;
  };
  isMe?: boolean;
  playerAlias?: string;
}

const PlayerStatsTooltip: React.FC<PlayerStatsTooltipProps> = ({ 
  player, 
  isMe = false,
  playerAlias 
}) => {
  const handsPlayed = player.handsPlayed || 0;
  const handsWon = player.handsWon || 0;
  const winRate = handsPlayed > 0 ? ((handsWon / handsPlayed) * 100).toFixed(1) : '0.0';
  const buyIn = player.currentBuyIn || player.stack;
  const profit = player.stack - buyIn;
  const isProfit = profit >= 0;

  return (
    <div 
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-[100]"
      style={{
        filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.6))'
      }}
    >
      {/* Arrow pointing up */}
      <div 
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent"
        style={{
          borderBottomColor: 'rgba(15, 23, 42, 0.98)'
        }}
      />
      
      {/* Tooltip content */}
      <div 
        className="rounded-xl border border-cyan-500/40 backdrop-blur-md p-4 min-w-[260px]"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700/50">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-2xl shadow-lg border border-amber-500/50">
            {isMe && playerAlias && playerAlias.startsWith('IMG:') ? (
              <img
                src={`/avatars/${playerAlias.replace('IMG:', '')}.png`}
                alt="avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{isMe ? playerAlias : (player.avatar || '🎮')}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-xs">
              {isMe ? '👤 Your Stats' : '👥 Opponent Stats'}
            </p>
          </div>
        </div>

        {/* Session Stats */}
        <div className="space-y-2">
          {/* Current Stack */}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">💰 Current Stack</span>
            <span className="text-amber-400 font-bold text-sm">
              {player.stack.toLocaleString()}
            </span>
          </div>

          {/* Buy-in */}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">🎫 Session Buy-in</span>
            <span className="text-slate-300 text-sm">
              {buyIn.toLocaleString()}
            </span>
          </div>

          {/* Profit/Loss */}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">
              {isProfit ? '📈 Session Profit' : '📉 Session Loss'}
            </span>
            <span className={`font-bold text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{profit.toLocaleString()}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700/50 my-2"></div>

          {/* Hands Played */}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">🎴 Hands Played</span>
            <span className="text-slate-200 text-sm font-semibold">
              {handsPlayed}
            </span>
          </div>

          {/* Hands Won */}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">🏆 Hands Won</span>
            <span className="text-green-400 text-sm font-semibold">
              {handsWon}
            </span>
          </div>

          {/* Win Rate */}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">📊 Win Rate</span>
            <span className={`text-sm font-bold ${
              parseFloat(winRate) >= 50 ? 'text-green-400' :
              parseFloat(winRate) >= 30 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {winRate}%
            </span>
          </div>

          {/* Biggest Pot */}
          {player.biggestPot && player.biggestPot > 0 && (
            <>
              <div className="border-t border-slate-700/50 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">💎 Biggest Pot</span>
                <span className="text-purple-400 text-sm font-bold">
                  {player.biggestPot.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs text-center italic">
            Session statistics • Live tracking
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsTooltip;
