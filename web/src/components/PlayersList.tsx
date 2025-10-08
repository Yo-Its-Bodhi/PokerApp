import React from 'react';

interface PlayersListProps {
  players?: any[];
  walletAddress?: string;
}

const PlayersList: React.FC<PlayersListProps> = ({ 
  players = [], 
  walletAddress = ''
}) => {
  // Helper to truncate wallet address
  const truncateAddress = (address: string) => {
    if (!address) return 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get seated players - filter out null/undefined and ensure they have required properties
  const seatedPlayers = players.filter(p => p && (p.name || p.seat));

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

      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
          <span className="text-slate-400">👥</span> Players at Table
        </h3>
        <span className="text-xs text-slate-400">({seatedPlayers.length}/6)</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {seatedPlayers.length > 0 ? (
            seatedPlayers.map((player, i) => {
              // Match chat color system by seat number
              const seatNum = player.seat || 0;
              const seatColors = [
                { border: 'border-slate-400', bg: 'bg-slate-800/40', text: 'text-slate-300', hover: 'hover:bg-slate-800/60' },      // Seat 0/default
                { border: 'border-blue-400', bg: 'bg-blue-900/20', text: 'text-blue-300', hover: 'hover:bg-blue-900/30' },        // Seat 1
                { border: 'border-emerald-400', bg: 'bg-emerald-900/20', text: 'text-emerald-300', hover: 'hover:bg-emerald-900/30' }, // Seat 2
                { border: 'border-amber-400', bg: 'bg-amber-900/20', text: 'text-amber-300', hover: 'hover:bg-amber-900/30' },      // Seat 3
                { border: 'border-rose-400', bg: 'bg-rose-900/20', text: 'text-rose-300', hover: 'hover:bg-rose-900/30' },         // Seat 4
                { border: 'border-violet-400', bg: 'bg-violet-900/20', text: 'text-violet-300', hover: 'hover:bg-violet-900/30' },   // Seat 5
                { border: 'border-orange-400', bg: 'bg-orange-900/20', text: 'text-orange-300', hover: 'hover:bg-orange-900/30' },   // Seat 6
              ];
              const colorScheme = seatColors[seatNum % seatColors.length];
              
              return (
                <div 
                  key={i} 
                  className={`border-l-2 ${colorScheme.border} ${colorScheme.bg} p-3 rounded text-sm ${colorScheme.hover} transition-colors`}
                >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-medium ${colorScheme.text} flex items-center gap-1`}>
                    <span className="text-sm">{player.avatar || '🎮'}</span>
                    {player.name || `Player ${player.seat}`}
                  </span>
                  <span className="text-slate-400 text-xs">Seat {player.seat}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-xs text-blue-300 break-all">
                    {truncateAddress(player.address || player.walletAddress || '')}
                  </span>
                </div>
                {player.stack && (
                  <div className="mt-1 text-xs text-emerald-300">
                    💰 {player.stack.toLocaleString()} SHIDO
                  </div>
                )}
              </div>
              );
            })
          ) : (
            <div className="text-center text-slate-500 text-sm py-4">
              <p>No players seated yet</p>
              <p className="text-xs mt-1">Click "JACK IN" to join!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayersList;
