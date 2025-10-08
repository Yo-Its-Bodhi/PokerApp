import React from 'react';

export interface PlayerStats {
  address: string;
  alias: string;
  avatar: string;
  totalWon: number;
  totalLost: number;
  handsPlayed: number;
  handsWon: number;
  biggestPot: number;
  totalRakePaid: number;
  winRate: number; // percentage
}

interface LeaderboardProps {
  onClose: () => void;
  currentPlayerStats?: PlayerStats;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose, currentPlayerStats }) => {
  // Mock leaderboard data - in production, this would come from backend/blockchain
  const mockLeaderboard: PlayerStats[] = [
    {
      address: '0x1234...5678',
      alias: 'ShidoWhale',
      avatar: '🐋',
      totalWon: 5000000,
      totalLost: 2000000,
      handsPlayed: 342,
      handsWon: 198,
      biggestPot: 250000,
      totalRakePaid: 45000,
      winRate: 57.9
    },
    {
      address: '0x8765...4321',
      alias: 'PokerPro',
      avatar: '😎',
      totalWon: 3500000,
      totalLost: 1800000,
      handsPlayed: 256,
      handsWon: 142,
      biggestPot: 180000,
      totalRakePaid: 32000,
      winRate: 55.5
    },
    {
      address: '0xabcd...efgh',
      alias: 'LuckyAce',
      avatar: '🍀',
      totalWon: 2800000,
      totalLost: 2200000,
      handsPlayed: 412,
      handsWon: 185,
      biggestPot: 120000,
      totalRakePaid: 28000,
      winRate: 44.9
    },
    {
      address: '0x9999...1111',
      alias: 'BluffKing',
      avatar: '👑',
      totalWon: 2100000,
      totalLost: 1500000,
      handsPlayed: 187,
      handsWon: 98,
      biggestPot: 95000,
      totalRakePaid: 18500,
      winRate: 52.4
    },
    {
      address: '0x7777...8888',
      alias: 'CardShark',
      avatar: '🦈',
      totalWon: 1800000,
      totalLost: 2500000,
      handsPlayed: 531,
      handsWon: 234,
      biggestPot: 88000,
      totalRakePaid: 51000,
      winRate: 44.1
    }
  ];

  // Add current player if available
  const leaderboardData = currentPlayerStats 
    ? [...mockLeaderboard, currentPlayerStats].sort((a, b) => b.totalWon - a.totalWon)
    : mockLeaderboard;

  // Calculate rankings
  const mostWonRanking = [...leaderboardData].sort((a, b) => b.totalWon - a.totalWon);
  const mostLostRanking = [...leaderboardData].sort((a, b) => b.totalLost - a.totalLost);
  const mostPlayedRanking = [...leaderboardData].sort((a, b) => b.handsPlayed - a.handsPlayed);
  const bestWinRateRanking = [...leaderboardData]
    .filter(p => p.handsPlayed >= 50) // Min 50 hands for win rate ranking
    .sort((a, b) => b.winRate - a.winRate);
  const biggestPotRanking = [...leaderboardData].sort((a, b) => b.biggestPot - a.biggestPot);

  const [activeTab, setActiveTab] = React.useState<'won' | 'lost' | 'played' | 'winrate' | 'bigpot'>('won');

  const getCurrentRanking = () => {
    switch (activeTab) {
      case 'won': return mostWonRanking;
      case 'lost': return mostLostRanking;
      case 'played': return mostPlayedRanking;
      case 'winrate': return bestWinRateRanking;
      case 'bigpot': return biggestPotRanking;
      default: return mostWonRanking;
    }
  };

  const getStatValue = (player: PlayerStats) => {
    switch (activeTab) {
      case 'won': return `${(player.totalWon / 1000).toFixed(0)}K SHIDO`;
      case 'lost': return `${(player.totalLost / 1000).toFixed(0)}K SHIDO`;
      case 'played': return `${player.handsPlayed} hands`;
      case 'winrate': return `${player.winRate.toFixed(1)}% (${player.handsWon}/${player.handsPlayed})`;
      case 'bigpot': return `${(player.biggestPot / 1000).toFixed(0)}K SHIDO`;
      default: return '';
    }
  };

  const tabStyles = "px-4 py-2 font-bold transition-all duration-300 border-b-2";
  const activeTabStyles = "border-cyan-400 text-cyan-400 bg-cyan-400/10";
  const inactiveTabStyles = "border-transparent text-gray-400 hover:text-cyan-300 hover:border-cyan-600";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden transition-all duration-500"
           style={{
             background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.95) 100%)',
             backdropFilter: 'blur(20px)',
             border: '2px solid rgba(6, 182, 212, 0.3)',
             boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)'
           }}>
        {/* 🔥 EXACT LOBBY CARD STYLE CORNERS 🔥 */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none z-50"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none z-50"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none z-50"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none z-50"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        
        {/* Corner glow dots */}
        <div className="absolute top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-50"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-50"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-50"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-50"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        
        {/* Header */}
        <div className="relative p-6 overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(168, 85, 247, 0.15))',
          borderBottom: '2px solid rgba(6, 182, 212, 0.3)'
        }}>
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🏆</div>
              <div>
                <h2 className="text-3xl font-black text-cyan-400 drop-shadow-lg" style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.8)' }}>LEADERBOARD</h2>
                <p className="text-cyan-200 text-sm font-semibold">Hall of Poker Legends</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-cyan-300 hover:text-cyan-100 transition-colors text-3xl font-bold hover:rotate-90 transition-transform duration-300"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-950/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('won')}
            className={`${tabStyles} ${activeTab === 'won' ? activeTabStyles : inactiveTabStyles}`}
          >
            💰 Most Won
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`${tabStyles} ${activeTab === 'lost' ? activeTabStyles : inactiveTabStyles}`}
          >
            💸 Most Lost
          </button>
          <button
            onClick={() => setActiveTab('played')}
            className={`${tabStyles} ${activeTab === 'played' ? activeTabStyles : inactiveTabStyles}`}
          >
            🎮 Most Played
          </button>
          <button
            onClick={() => setActiveTab('winrate')}
            className={`${tabStyles} ${activeTab === 'winrate' ? activeTabStyles : inactiveTabStyles}`}
          >
            🎯 Best Win Rate
          </button>
          <button
            onClick={() => setActiveTab('bigpot')}
            className={`${tabStyles} ${activeTab === 'bigpot' ? activeTabStyles : inactiveTabStyles}`}
          >
            💎 Biggest Pot
          </button>
        </div>

        {/* Leaderboard Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-3">
            {getCurrentRanking().map((player, index) => {
              const isCurrentPlayer = currentPlayerStats?.address === player.address;
              const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
              
              return (
                <div
                  key={player.address}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                    isCurrentPlayer
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                      : index === 0
                      ? 'bg-gradient-to-r from-cyan-600/10 to-cyan-500/10 border-cyan-500/30'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-cyan-600 hover:bg-slate-800/80'
                  }`}
                >
                  {/* Rank */}
                  <div className="text-3xl font-black w-16 text-center">
                    {rankEmoji}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-4xl">{player.avatar}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-lg flex items-center gap-2">
                        {player.alias}
                        {isCurrentPlayer && (
                          <span className="text-xs bg-cyan-500 text-black px-2 py-0.5 rounded-full font-black">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-mono truncate">
                        {player.address}
                      </div>
                    </div>
                  </div>

                  {/* Main Stat */}
                  <div className="text-right">
                    <div className={`font-black text-xl ${
                      index === 0 ? 'text-cyan-400' : 
                      index === 1 ? 'text-gray-300' : 
                      index === 2 ? 'text-orange-400' : 
                      'text-white'
                    }`}>
                      {getStatValue(player)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Stats */}
        {currentPlayerStats && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-t-2 border-cyan-500/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-xs uppercase font-bold mb-1">Net Profit</div>
                <div className={`text-2xl font-black ${
                  currentPlayerStats.totalWon - currentPlayerStats.totalLost > 0 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {((currentPlayerStats.totalWon - currentPlayerStats.totalLost) / 1000).toFixed(0)}K
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase font-bold mb-1">Win Rate</div>
                <div className="text-2xl font-black text-blue-400">
                  {currentPlayerStats.winRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase font-bold mb-1">Total Rake</div>
                <div className="text-2xl font-black text-purple-400">
                  {(currentPlayerStats.totalRakePaid / 1000).toFixed(0)}K
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase font-bold mb-1">Hands</div>
                <div className="text-2xl font-black text-cyan-400">
                  {currentPlayerStats.handsPlayed}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
