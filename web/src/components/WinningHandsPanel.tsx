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
    <div 
      className="relative backdrop-blur-md shadow-2xl overflow-hidden h-full flex flex-col transition-all duration-500"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(6, 182, 212, 0.3)',
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)'
      }}
    >
      {/* 🔥 EXACT LOBBY CARD STYLE CORNERS 🔥 */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none z-10"
           style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none z-10"
           style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none z-10"
           style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none z-10"
           style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
      
      {/* Corner glow dots */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
           style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
      <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
           style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
           style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
           style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>

      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
          <span className="text-slate-400">🏆</span> Recent Winners
        </h3>
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-2">
        {recentHands.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">
            No hands played yet
          </p>
        ) : (
          recentHands.slice(0, 10).map((hand, index) => (
            <div
              key={hand.handNumber}
              className={`p-3 rounded border-l-2 transition-all ${
                index === 0
                  ? 'border-l-amber-400 bg-amber-900/20'
                  : 'border-l-slate-400 bg-slate-800/30'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-mono text-slate-500">
                  Hand #{hand.handNumber}
                </span>
                <span className="text-xs text-amber-300 font-medium">
                  {hand.potSize.toLocaleString()} SHIDO
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`font-medium text-sm ${
                    hand.winner === 'You' 
                      ? 'text-emerald-300' 
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
    </div>
  );
};

export default WinningHandsPanel;
