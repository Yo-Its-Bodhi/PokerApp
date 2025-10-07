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
    <div className="glass-card p-4 flex flex-col h-full overflow-hidden">
      <h3 className="font-bold text-base text-brand-electric mb-3 uppercase tracking-wider flex items-center gap-2">
        <span>🎮</span> Game Log
      </h3>
      <div className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden text-xs custom-scrollbar pr-2">
        {displayLog.map((log, i) => (
          <div 
            key={i} 
            className={`pl-2 py-1 rounded border-l-2 transition-all break-words ${
              log.type === 'street-change'
                ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 font-bold text-center py-2 shadow-lg' 
                : log.type === 'flop' || log.type === 'turn' || log.type === 'river' || log.type === 'deal' 
                ? 'border-brand-gold bg-brand-gold/10 text-brand-gold font-semibold' 
                : log.type === 'raise' || log.type === 'bet'
                ? 'border-brand-magenta bg-brand-magenta/10 text-brand-magenta'
                : log.type === 'call'
                ? 'border-brand-electric bg-brand-electric/10 text-brand-electric'
                : log.type === 'fold'
                ? 'border-red-500 bg-red-500/10 text-red-400'
                : log.type === 'system'
                ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan animate-pulse'
                : 'border-brand-cyan/30 text-brand-text'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="font-medium break-words flex-1 min-w-0">
                {log.action}
              </span>
              <span className="text-brand-text-dark text-[10px] whitespace-nowrap opacity-60 flex-shrink-0">{log.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={gameLogEndRef} />
      </div>
    </div>
  );
};

export default GameLog;
