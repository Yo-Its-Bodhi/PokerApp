import React, { useState } from 'react';

interface TableProps {
  players: any[];
  communityCards: number[];
  pot: number;
  currentPlayer: number;
  mySeat: number;
  myCards: any[];
  playerAlias?: string;
  avatarIndex?: number;
  onAction: (action: string, amount?: number) => void;
  onStandUp: () => void;
  onSitAtSeat?: (seat: number) => void;
}

const cardToString = (cardNum: number): { suit: string, rank: string, color: string } => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suit = suits[Math.floor(cardNum / 13)];
  const rank = ranks[cardNum % 13];
  const color = (suit === '♥' || suit === '♦') ? 'text-red-500' : 'text-white';
  return { suit, rank, color };
};

const Table: React.FC<TableProps> = ({ 
  players, 
  communityCards, 
  pot, 
  currentPlayer, 
  mySeat, 
  myCards, 
  playerAlias,
  avatarIndex = 0,
  onAction, 
  onStandUp,
  onSitAtSeat
}) => {
  const [betAmount, setBetAmount] = useState(10000);
  const [raiseAmount, setRaiseAmount] = useState(20000);
  
  // Avatar options (same as in App)
  const avatars = ['👑', '🎭', '🦊', '🐉', '🦁', '🐺', '🦅', '🐯', '🦈'];

  return (
    <div className="w-full h-full">
      {/* Main Table Area */}
      <div className="relative bg-gradient-to-br from-brand-surface via-brand-background to-black rounded-3xl border-2 border-brand-cyan shadow-glow-cyan p-8 overflow-hidden h-full">
        {/* Cyber grid overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Center Area: Community Cards & Pot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          {/* Pot */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-brand-gold mb-1">{pot.toLocaleString()} SHIDO</div>
            <div className="text-xs text-brand-gold-light uppercase tracking-widest">POT</div>
          </div>

          {/* Community Cards */}
          <div className="flex gap-2 justify-center">
            {communityCards && communityCards.length > 0 ? (
              communityCards.map((card, i) => {
                const cardData = cardToString(card);
                return (
                  <div 
                    key={i} 
                    className="glass-card w-20 h-28 flex items-center justify-center text-3xl font-bold bg-white shadow-lg transform transition-all hover:scale-110"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <span className={cardData.color}>{cardData.rank}{cardData.suit}</span>
                  </div>
                );
              })
            ) : (
              // Empty card placeholders
              [0, 1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="w-20 h-28 rounded-lg border-2 border-dashed border-white/30 bg-white/5"
                ></div>
              ))
            )}
          </div>
        </div>

        {/* Player Seats (6 positions around the table) */}
        {[1, 2, 3, 4, 5, 6].map((seatNum) => {
          const player = players.find(p => p.seat === seatNum);
          const isMe = seatNum === mySeat;
          const isActive = player && currentPlayer === players.findIndex(p => p.seat === seatNum);
          
          // Position seats around the table
          const positions = [
            'bottom-4 left-1/2 -translate-x-1/2',  // Seat 1 - Bottom center (player)
            'bottom-20 left-8',                     // Seat 2 - Bottom left
            'top-1/3 left-4',                       // Seat 3 - Middle left
            'top-8 left-1/2 -translate-x-1/2',     // Seat 4 - Top center
            'top-1/3 right-4',                      // Seat 5 - Middle right
            'bottom-20 right-8',                    // Seat 6 - Bottom right
          ];

          return (
            <div 
              key={seatNum} 
              className={`absolute ${positions[seatNum - 1]} z-20`}
            >
              {player ? (
                <div className="relative">
                  {/* Avatar Circle - Always on top, 1/4 on card, 3/4 off */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3/4 z-30">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple-dark via-brand-background to-black flex items-center justify-center text-3xl border-3 border-brand-gold shadow-glow-gold">
                      {isMe ? avatars[avatarIndex] : (player.avatar || avatars[player.avatarIndex || 0])}
                    </div>
                  </div>
                  
                  <div className={`glass-card p-4 pt-6 min-w-[180px] border-2 ${isActive ? 'border-brand-cyan animate-[pulseTeal_1.5s_ease-in-out_infinite]' : 'border-brand-gold/40'} ${isMe ? 'bg-brand-gold/10' : ''}`} style={isActive ? {animation: 'pulseTeal 1.5s ease-in-out infinite'} : {}}>
                    <div className="mb-3 text-center">
                      <p className="font-bold text-sm text-brand-gold">{isMe ? (playerAlias || 'YOU') : (player.name || `PLAYER ${seatNum}`)}</p>
                      <p className="text-xs text-brand-gold-light font-semibold">{player.stack?.toLocaleString() || '0'} SHIDO</p>
                    </div>
                  {player.bet > 0 && (
                    <div className="text-center text-sm bg-gradient-to-r from-brand-gold/20 to-brand-gold-dark/20 rounded border border-brand-gold/40 px-2 py-1">
                      <span className="text-brand-gold-light">Bet: {player.bet.toLocaleString()}</span>
                    </div>
                  )}
                  {isActive && (
                    <div className="text-center text-xs mt-2 text-brand-gold font-bold uppercase tracking-wider animate-pulse">
                      ⏰ YOUR TURN
                    </div>
                  )}
                  </div>
                </div>
              ) : (
                <div 
                  className="glass-card p-4 min-w-[180px] bg-brand-cyan/5 border-2 border-dashed border-brand-cyan/30 hover:border-brand-cyan hover:bg-brand-cyan/15 hover:shadow-glow-cyan cursor-pointer transition-all duration-300 group"
                  onClick={() => onSitAtSeat && onSitAtSeat(seatNum)}
                >
                  <p className="text-center text-sm text-brand-cyan/70 group-hover:text-brand-cyan uppercase tracking-wide transition-colors">EMPTY SEAT</p>
                  <p className="text-center text-xs text-brand-cyan/50 group-hover:text-brand-cyan mt-1 transition-colors">SLOT #{seatNum}</p>
                  {mySeat === 0 && (
                    <button className="btn btn-primary w-full mt-2 text-xs py-1">JACK IN</button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Your Cards - Positioned to right/left of player seats */}
        {mySeat > 0 && (
          <div className={`absolute z-30 ${
            mySeat === 1 ? 'bottom-4 left-1/2 translate-x-32' :     // Seat 1 - To the right with padding
            mySeat === 2 ? 'bottom-20 left-60' :                     // Seat 2 - To the right with padding
            mySeat === 3 ? 'top-1/3 left-56' :                       // Seat 3 - To the right with padding
            mySeat === 4 ? 'top-8 right-1/2 -translate-x-32' :       // Seat 4 - To the right with padding
            mySeat === 5 ? 'top-1/3 right-56' :                      // Seat 5 - To the left with padding
            'bottom-20 right-60'                                     // Seat 6 - To the left with padding
          }`}>
            <div className="flex gap-1.5">
              {myCards && myCards.length > 0 ? (
                myCards.map((card: any, i: number) => {
                  const cardData = cardToString(card);
                  return (
                    <div 
                      key={i} 
                      className="glass-card w-14 h-20 flex items-center justify-center text-xl font-bold bg-white shadow-lg border-2 border-brand-gold"
                    >
                      <span className={cardData.color}>{cardData.rank}{cardData.suit}</span>
                    </div>
                  );
                })
              ) : (
                // Placeholder cards if no cards yet
                [0, 1].map((i) => (
                  <div 
                    key={i} 
                    className="w-14 h-20 rounded-lg border-2 border-dashed border-white/30 bg-white/5"
                  ></div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;
