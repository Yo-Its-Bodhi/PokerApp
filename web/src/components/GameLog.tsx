import React, { useEffect, useRef } from 'react';

interface GameLogProps {
  gameLog?: { action: string, player: string, timestamp: string, type?: string }[];
}

const GameLog: React.FC<GameLogProps> = ({ gameLog = [] }) => {
  const gameLogEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    gameLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [gameLog]);

  // Mock game log for demo
  const mockGameLog = [
    { action: 'Player_1 posted small blind (1,000)', player: 'Player_1', timestamp: '10:45:23', type: 'blind' },
    { action: 'Player_2 posted big blind (2,000)', player: 'Player_2', timestamp: '10:45:24', type: 'blind' },
    { action: 'Dealing hole cards...', player: 'Dealer', timestamp: '10:45:25', type: 'deal' },
    { action: 'Player_3 raises to 10,000', player: 'Player_3', timestamp: '10:45:27', type: 'raise' },
    { action: 'Player_4 calls 10,000', player: 'Player_4', timestamp: '10:45:29', type: 'call' },
    { action: 'You call 10,000', player: 'You', timestamp: '10:45:31', type: 'call' },
    { action: '>>> FLOP: K♥ Q♦ J♠', player: 'Dealer', timestamp: '10:45:33', type: 'flop' },
    { action: 'Player_1 checks', player: 'Player_1', timestamp: '10:45:35', type: 'check' },
    { action: 'Player_2 bets 20,000', player: 'Player_2', timestamp: '10:45:37', type: 'bet' },
    { action: 'Player_3 folds', player: 'Player_3', timestamp: '10:45:39', type: 'fold' },
    { action: 'Player_4 raises to 60,000', player: 'Player_4', timestamp: '10:45:42', type: 'raise' },
    { action: 'You call 60,000', player: 'You', timestamp: '10:45:45', type: 'call' },
    { action: '>>> TURN: 10♣', player: 'Dealer', timestamp: '10:45:47', type: 'turn' },
    { action: 'Player_2 checks', player: 'Player_2', timestamp: '10:45:49', type: 'check' },
    { action: 'Waiting for your action...', player: 'System', timestamp: '10:45:51', type: 'system' },
  ];

  const displayLog = gameLog.length > 0 ? gameLog : mockGameLog;

  return (
    <div 
      className="relative backdrop-blur-md shadow-2xl overflow-hidden flex flex-col h-full transition-all duration-500"
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

      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
          <span className="text-slate-400">🎮</span> Game Log
        </h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto min-h-0">
        <div className="space-y-1.5 text-sm">
        {displayLog.map((log, i) => (
          <div 
            key={i} 
            className={`pl-3 py-2 rounded border-l-2 transition-all break-words ${
              log.type === 'street-change'
                ? 'border-purple-400 bg-purple-900/20 text-purple-300 font-medium text-center py-2' 
                : log.type === 'flop' || log.type === 'turn' || log.type === 'river' || log.type === 'deal' 
                ? 'border-brand-gold bg-brand-gold/10 text-brand-gold font-semibold' 
                : log.type === 'raise' || log.type === 'bet'
                ? 'border-amber-400 bg-amber-900/20 text-amber-300'
                : log.type === 'call'
                ? 'border-blue-400 bg-blue-900/20 text-blue-300'
                : log.type === 'fold'
                ? 'border-red-400 bg-red-900/20 text-red-300'
                : log.type === 'system'
                ? 'border-orange-400 bg-orange-900/20 text-orange-300'
                : 'border-slate-400 bg-slate-800/30 text-slate-300'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="font-medium break-words flex-1 min-w-0 text-sm">
                {log.action}
              </span>
              <span className="text-slate-500 text-sm whitespace-nowrap opacity-60 flex-shrink-0">{log.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={gameLogEndRef} />
      </div>
      </div>
    </div>
  );
};

export default GameLog;
