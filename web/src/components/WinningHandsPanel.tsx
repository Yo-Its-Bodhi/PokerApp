import React from 'react';

interface WinningHandsPanelProps {
  recentHands: Array<{
    handNumber: number;
    winner: string;
    handType: string;
    potSize: number;
    timestamp: number;
  }>;
}

const WinningHandsPanel: React.FC<WinningHandsPanelProps> = ({ recentHands }) => {
  return (
    <div className="glass-card p-4 h-full overflow-hidden flex flex-col">
      <h3 className="text-lg font-bold mb-3 text-slate-200 border-b border-slate-700/50 pb-2">
        🏆 Recent Winners
      </h3>
      
      <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {recentHands.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">
            No hands played yet
          </p>
        ) : (
          recentHands.slice(0, 10).map((hand, index) => (
            <div
              key={hand.handNumber}
              className={`p-3 rounded-lg transition-all ${
                index === 0
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50'
                  : 'bg-slate-800/40 border border-slate-700/30'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-mono text-slate-400">
                  Hand #{hand.handNumber}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {hand.potSize.toLocaleString()} SHIDO
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    hand.winner === 'You' 
                      ? 'text-green-400' 
                      : 'text-slate-300'
                  }`}>
                    {hand.winner === 'You' ? '🎉 You' : '👤 Opponent'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {hand.handType}
                  </p>
                </div>
                
                <div className="text-xs text-slate-500">
                  {new Date(hand.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {recentHands.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Your Wins: {recentHands.filter(h => h.winner === 'You').length}</span>
            <span>Opponent Wins: {recentHands.filter(h => h.winner !== 'You').length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinningHandsPanel;
