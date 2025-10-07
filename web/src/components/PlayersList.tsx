import React from 'react';

interface PlayersListProps {
  players?: any[];
  walletAddress?: string;
}

const PlayersList: React.FC<PlayersListProps> = ({ players = [], walletAddress = '' }) => {
  // Helper to truncate wallet address
  const truncateAddress = (address: string) => {
    if (!address) return 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get seated players - filter out null/undefined and ensure they have required properties
  const seatedPlayers = players.filter(p => p && (p.name || p.seat));

  return (
    <div className="glass-card p-4 flex flex-col h-full overflow-hidden">
      <h3 className="font-bold text-base text-brand-cyan mb-3 uppercase tracking-wider flex items-center gap-2">
        <span className="text-xl">👥</span>
        Players at Table
        <span className="text-xs text-brand-text-dark ml-auto">({seatedPlayers.length}/6)</span>
      </h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="space-y-2">
          {seatedPlayers.length > 0 ? (
            seatedPlayers.map((player, i) => (
              <div 
                key={i} 
                className="bg-gradient-to-r from-brand-cyan/10 to-transparent border-l-2 border-brand-cyan p-2 rounded-r text-xs hover:bg-brand-cyan/20 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-brand-gold flex items-center gap-1">
                    <span className="text-sm">{player.avatar || '🎮'}</span>
                    {player.name || `Player ${player.seat}`}
                  </span>
                  <span className="text-brand-text-dark text-[10px]">Seat {player.seat}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[10px] text-brand-cyan break-all">
                    {truncateAddress(player.address || player.walletAddress || '')}
                  </span>
                </div>
                {player.stack && (
                  <div className="mt-1 text-[10px] text-brand-electric">
                    💰 {player.stack.toLocaleString()} SHIDO
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-brand-text-dark text-xs py-4">
              <p>No players seated yet</p>
              <p className="text-[10px] mt-1">Click "JACK IN" to join!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayersList;
