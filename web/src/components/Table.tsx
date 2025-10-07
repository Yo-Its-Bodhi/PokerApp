import React, { useState } from 'react';
import PlayerTimer from './PlayerTimer';
import Card from './Card';
import PotDisplay from './PotDisplay';
import { getPlayerStateBorderClass } from './PlayerStateGlow';
import ChipStack from './ChipStack';
import { WinPopup } from './WinPopup';

interface TableProps {
  players: any[];
  communityCards: number[];
  pot: number;
  currentPlayer: number;
  mySeat: number;
  myCards: any[];
  opponentCards?: any[];
  showOpponentCards?: boolean;
  playerAlias?: string;
  avatarIndex?: number;
  myAvatar?: string;
  theme?: 'dark' | 'classic' | 'light' | 'executive';
  revealedCards?: number;
  winPopups?: {seat: number, amount: number}[];
  timerState?: {
    playerId: string;
    baseTimeMs: number;
    baseMaxMs: number;
    timeBankMs: number;
    timeBankMaxMs: number;
    usingTimeBank: boolean;
  };
  onAction: (action: string, amount?: number) => void;
  onStandUp: () => void;
  onSitAtSeat?: (seat: number) => void;
  onRequestTimeBank?: () => void;
}

const cardToString = (cardNum: number): { suit: string, rank: string, color: string } => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suit = suits[Math.floor(cardNum / 13)];
  const rank = ranks[cardNum % 13];
  const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
  return { suit, rank, color };
};

const Table: React.FC<TableProps> = ({ 
  players, 
  communityCards, 
  pot, 
  currentPlayer, 
  mySeat, 
  myCards,
  opponentCards = [],
  showOpponentCards = false,
  playerAlias,
  avatarIndex = 0,
  myAvatar = '🎮',
  theme = 'dark',
  revealedCards = 0,
  winPopups = [],
  timerState,
  onAction, 
  onStandUp,
  onSitAtSeat,
  onRequestTimeBank
}) => {
  const [betAmount, setBetAmount] = useState(10000);
  const [raiseAmount, setRaiseAmount] = useState(20000);

  // Theme-based table surface styles
  const tableStyles = {
    dark: {
      bg: 'bg-gradient-to-br from-slate-950 via-blue-950/80 to-black',
      border: 'border-blue-500/30',
      shadow: 'shadow-[0_0_60px_rgba(59,130,246,0.3),inset_0_2px_4px_rgba(255,255,255,0.05),inset_0_-2px_8px_rgba(0,0,0,0.8)]',
      gloss: 'bg-gradient-to-b from-white/5 via-transparent to-black/40',
      grid: 'bg-[linear-gradient(rgba(59,130,246,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.15)_1px,transparent_1px)]'
    },
    classic: {
      bg: 'bg-gradient-to-br from-green-900 via-green-800 to-green-950',
      border: 'border-amber-700/50',
      shadow: 'shadow-[0_0_40px_rgba(217,119,6,0.4),inset_0_4px_8px_rgba(0,0,0,0.5),inset_0_-4px_12px_rgba(0,0,0,0.7)]',
      gloss: 'bg-gradient-to-b from-yellow-200/8 via-transparent to-black/50',
      grid: 'bg-[linear-gradient(rgba(217,119,6,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(217,119,6,0.08)_1px,transparent_1px)]'
    },
    light: {
      bg: 'bg-gradient-to-br from-blue-100 via-slate-100 to-gray-200',
      border: 'border-blue-400/40',
      shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.2),inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.1)]',
      gloss: 'bg-gradient-to-b from-white/40 via-transparent to-gray-300/20',
      grid: 'bg-[linear-gradient(rgba(59,130,246,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.12)_1px,transparent_1px)]'
    },
    executive: {
      bg: 'bg-gradient-to-br from-black via-slate-950 to-black',
      border: 'border-yellow-600/40',
      shadow: 'shadow-[0_0_50px_rgba(212,175,55,0.3),inset_0_2px_8px_rgba(212,175,55,0.15),inset_0_-4px_16px_rgba(0,0,0,0.9)]',
      gloss: 'bg-gradient-to-b from-yellow-500/5 via-transparent to-black/60',
      grid: 'bg-[linear-gradient(rgba(212,175,55,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.08)_1px,transparent_1px)]'
    }
  };

  const currentStyle = tableStyles[theme];

  return (
    <div className="w-full h-full">
      {/* Main Table Area - Theme-based */}
      <div className={`relative ${currentStyle.bg} rounded-3xl border-2 ${currentStyle.border} ${currentStyle.shadow} p-8 h-full backdrop-blur-xl`}>
        {/* Enhanced gloss overlay */}
        <div className={`absolute inset-0 ${currentStyle.gloss} rounded-3xl pointer-events-none`}></div>
        
        {/* Grid overlay */}
        <div className={`absolute inset-0 opacity-5 ${currentStyle.grid} bg-[size:50px_50px] rounded-3xl`}></div>

        {/* Center Area: Community Cards & Pot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          {/* Enhanced Pot Display */}
          <div className="mb-6">
            <PotDisplay mainPot={pot} />
          </div>

          {/* Community Cards */}
          <div className="flex gap-2 justify-center">
            {communityCards && communityCards.length > 0 ? (
              communityCards.map((card, i) => {
                const cardData = cardToString(card);
                const isRevealed = i < revealedCards;
                return (
                  <Card
                    key={i}
                    suit={cardData.suit}
                    rank={cardData.rank}
                    color={cardData.color}
                    size="medium"
                    animationDelay={i * 0.15}
                    faceDown={!isRevealed}
                    showFlipAnimation={isRevealed}
                  />
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

        {/* Betting Area - Chip stacks for current bets (positioned between players and pot) */}
        {players.filter(p => p && p.bet > 0).map((player) => {
          // Position bet chips closer to center pot, in front of each player (moved up 1% for better centering)
          const betPositions: {[key: number]: string} = {
            1: 'bottom-36 left-1/2 -translate-x-1/2',  // Seat 1 - above player (was bottom-32)
            2: 'bottom-44 left-24',                     // Seat 2 - towards center (was bottom-40)
            3: 'top-[48%] left-20',                     // Seat 3 - towards center (was top-1/2)
            4: 'top-36 left-1/2 -translate-x-1/2',     // Seat 4 - below player (was top-32)
            5: 'top-[48%] right-20',                    // Seat 5 - towards center (was top-1/2)
            6: 'bottom-44 right-24',                    // Seat 6 - towards center (was bottom-40)
          };
          
          return (
            <div 
              key={`bet-${player.seat}`}
              className={`absolute ${betPositions[player.seat]} z-30`}
            >
              <ChipStack amount={player.bet} size="small" animate={true} />
            </div>
          );
        })}

        {/* Player Seats (6 positions around the table) */}
        {[1, 2, 3, 4, 5, 6].map((seatNum) => {
          const player = players.find(p => p && p.seat === seatNum);
          const isMe = seatNum === mySeat;
          const isActive = player && currentPlayer === seatNum;
          
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
              className={`absolute ${positions[seatNum - 1]} z-20 transition-all duration-500 ${
                player && player.folded ? 'opacity-40 grayscale blur-[2px] animate-fold-slide' : 'opacity-100'
              }`}
            >
              {player ? (
                <div className="relative">
                  {/* Timer - shows with seat-specific positioning (more compact) - stays on top */}
                  {isMe && currentPlayer === seatNum && timerState && (
                    <div className={`absolute z-50 ${
                      seatNum === 1 ? '-left-24 top-1/2 -translate-y-1/2' :      // Seat 1 - further left to avoid cards
                      seatNum === 2 ? '-top-24 left-1/2 -translate-x-1/2' :      // Seat 2 - further above
                      seatNum === 3 ? '-top-24 left-1/2 -translate-x-1/2' :      // Seat 3 - further above
                      seatNum === 4 ? '-right-24 top-1/2 -translate-y-1/2' :     // Seat 4 - further right to avoid cards
                      seatNum === 5 ? '-top-24 left-1/2 -translate-x-1/2' :      // Seat 5 - further above
                      '-top-24 left-1/2 -translate-x-1/2'                         // Seat 6 - further above
                    }`}>
                      <PlayerTimer
                        playerId={seatNum.toString()}
                        isActive={true}
                        baseTimeMs={timerState.baseTimeMs}
                        baseMaxMs={timerState.baseMaxMs}
                        timeBankMs={timerState.timeBankMs}
                        timeBankMaxMs={timerState.timeBankMaxMs}
                        usingTimeBank={timerState.usingTimeBank}
                        onRequestTimeBank={onRequestTimeBank}
                      />
                    </div>
                  )}
                  
                  {/* Avatar Circle - Position based on seat: top for most seats, bottom for seat 4 */}
                  <div className={`absolute left-1/2 -translate-x-1/2 z-30 ${
                    seatNum === 4 
                      ? 'bottom-0 translate-y-3/4'      // Seat 4 - bottom of card, 3/4 below
                      : 'top-0 -translate-y-3/4'        // All other seats - top of card, 3/4 above
                  }`}>
                    {(() => {
                      const avatarStr = isMe ? myAvatar : (player.avatar || '🎮');
                      const isImage = avatarStr.startsWith('IMG:');
                      
                      if (isImage) {
                        return (
                          <div className="w-16 h-16 flex items-center justify-center">
                            <img 
                              src={`/avatars/${avatarStr.replace('IMG:', '')}.png`} 
                              alt="avatar" 
                              className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.6)]"
                            />
                          </div>
                        );
                      }
                      
                      return (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 via-blue-950 to-black flex items-center justify-center text-3xl border-3 border-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.6),inset_0_2px_4px_rgba(255,255,255,0.1)]">
                          {avatarStr}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className={`glass-card p-4 ${seatNum === 4 ? 'pb-6' : 'pt-6'} min-w-[180px] border-2 relative transition-all duration-300 ${
                    currentPlayer === seatNum && timerState?.usingTimeBank 
                      ? 'border-red-500 shadow-[0_0_25px_rgba(255,0,0,0.7),inset_0_0_20px_rgba(255,0,0,0.1)] animate-[pulseRed_1s_ease-in-out_infinite] scale-105' 
                      : currentPlayer === seatNum 
                      ? 'border-brand-cyan shadow-[0_0_25px_rgba(0,255,255,0.7),inset_0_0_20px_rgba(0,255,255,0.1)] animate-[pulseTeal_1.5s_ease-in-out_infinite] scale-105' 
                      : 'border-blue-500/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]'
                  } ${isMe ? 'bg-gradient-to-br from-blue-900/30 to-slate-900/50' : 'bg-slate-950/60'}`} style={
                    currentPlayer === seatNum && timerState?.usingTimeBank 
                      ? {animation: 'pulseRed 1s ease-in-out infinite'} 
                      : currentPlayer === seatNum 
                      ? {animation: 'pulseTeal 1.5s ease-in-out infinite'} 
                      : {}
                  }>
                    {/* Dealer Button - Poker Chip Style with Glow */}
                    {player.isDealer && (
                      <div className="absolute -top-3 -left-3 z-10 animate-dealer-pulse">
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-4 border-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.8),0_4px_8px_rgba(0,0,0,0.6)]">
                          {/* Chip edge stripes */}
                          <div className="absolute inset-0 rounded-full" style={{
                            background: 'repeating-conic-gradient(from 0deg, rgba(0,0,0,0.3) 0deg 15deg, transparent 15deg 30deg)'
                          }}></div>
                          {/* Chip center */}
                          <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 border-2 border-yellow-700 flex items-center justify-center shadow-inner">
                            <span className="text-yellow-900 font-black text-sm drop-shadow-md">D</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Small Blind - Poker Chip Style */}
                    {player.isSmallBlind && (
                      <div className="absolute -top-3 -right-3 z-10">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 border-4 border-white flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                          {/* Chip edge stripes */}
                          <div className="absolute inset-0 rounded-full" style={{
                            background: 'repeating-conic-gradient(from 0deg, white 0deg 15deg, transparent 15deg 30deg)'
                          }}></div>
                          {/* Chip center */}
                          <div className="relative z-10 w-7 h-7 rounded-full bg-red-600 border-2 border-white flex items-center justify-center">
                            <span className="text-white font-black text-[10px]">SB</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Big Blind - Poker Chip Style */}
                    {player.isBigBlind && (
                      <div className="absolute -top-3 -right-3 z-10">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 border-4 border-white flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                          {/* Chip edge stripes */}
                          <div className="absolute inset-0 rounded-full" style={{
                            background: 'repeating-conic-gradient(from 0deg, white 0deg 15deg, transparent 15deg 30deg)'
                          }}></div>
                          {/* Chip center */}
                          <div className="relative z-10 w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
                            <span className="text-white font-black text-[10px]">BB</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mb-3 text-center">
                      <p className="font-bold text-sm text-brand-gold">{isMe ? (playerAlias || 'YOU') : (player.name || `PLAYER ${seatNum}`)}</p>
                      <p className="text-xs text-brand-gold-light font-semibold">{player.stack?.toLocaleString() || '0'} SHIDO</p>
                      {/* Last Action Label */}
                      {player.lastAction && (
                        <p className={`text-xs font-bold mt-1 ${
                          player.lastAction.type === 'fold' ? 'text-red-400' :
                          player.lastAction.type === 'check' ? 'text-gray-400' :
                          player.lastAction.type === 'call' ? 'text-green-400' :
                          player.lastAction.type === 'raise' || player.lastAction.type === 'bet' ? 'text-yellow-400' :
                          player.lastAction.type === 'allin' ? 'text-purple-400' :
                          'text-gray-400'
                        }`}>
                          {player.lastAction.text}
                        </p>
                      )}
                    </div>
                    
                    {/* Visual Chip Stack */}
                    <div className="flex justify-center mb-2">
                      <ChipStack amount={player.stack || 0} size="small" />
                    </div>
                    
                  {player.bet > 0 && (
                    <div className="text-center text-sm bg-gradient-to-r from-brand-gold/20 to-brand-gold-dark/20 rounded border border-brand-gold/40 px-2 py-1">
                      <span className="text-brand-gold-light">Bet: {player.bet.toLocaleString()}</span>
                    </div>
                  )}
                  {isMe && currentPlayer === seatNum && (
                    <div className="text-center text-xs mt-2 text-brand-gold font-bold uppercase tracking-wider animate-pulse">
                      ⏰ YOUR TURN
                    </div>
                  )}
                  </div>
                </div>
              ) : (
                <div 
                  className={`glass-card p-4 min-w-[180px] bg-brand-cyan/5 border-2 border-dashed border-brand-cyan/30 transition-all duration-300 group ${
                    mySeat > 0 && mySeat !== seatNum 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:border-brand-cyan hover:bg-brand-cyan/15 hover:shadow-glow-cyan cursor-pointer'
                  }`}
                  onClick={() => {
                    if (mySeat > 0 && mySeat !== seatNum) {
                      // Already seated elsewhere - do nothing
                      return;
                    }
                    onSitAtSeat && onSitAtSeat(seatNum);
                  }}
                >
                  <p className="text-center text-sm text-brand-cyan/70 group-hover:text-brand-cyan uppercase tracking-wide transition-colors">EMPTY SEAT</p>
                  <p className="text-center text-xs text-brand-cyan/50 group-hover:text-brand-cyan mt-1 transition-colors">SLOT #{seatNum}</p>
                  {mySeat === 0 && (
                    <button className="btn btn-primary w-full mt-2 text-xs py-1">JACK IN</button>
                  )}
                  {mySeat > 0 && mySeat !== seatNum && (
                    <p className="text-center text-xs text-red-400 mt-2">Already Seated</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Opponent Hand Cards - Show at showdown */}
        {showOpponentCards && opponentCards && opponentCards.length > 0 && (
          <div className={`absolute z-40 ${
            // Position to the LEFT of opponent's seat box to avoid overlap
            // Player at seat 1 → opponent at seat 4 (top center) → cards on left
            mySeat === 1 ? 'top-12 left-1/2 -translate-x-[14rem]' :       // Opponent at top, cards far left
            // Player at seat 4 → opponent at seat 1 (bottom center) → cards on left
            mySeat === 4 ? 'bottom-8 left-1/2 -translate-x-[14rem]' :     // Opponent at bottom, cards far left
            'top-12 left-1/2 -translate-x-[14rem]'                        // Default far left
          }`}>
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-1.5">
                {opponentCards.map((card: any, i: number) => {
                  const cardNum = typeof card === 'number' ? card : (typeof card === 'object' && card.card !== undefined ? card.card : 0);
                  const cardData = cardToString(cardNum);
                  return (
                    <Card
                      key={i}
                      suit={cardData.suit}
                      rank={cardData.rank}
                      color={cardData.color}
                      size="small"
                      animationDelay={i * 0.1}
                      faceDown={false}
                      showFlipAnimation={true}
                    />
                  );
                })}
              </div>
              {/* Label for opponent cards */}
              <div className="bg-red-500/20 border border-red-500/50 rounded px-2 py-0.5">
                <span className="text-red-300 text-xs font-bold">OPPONENT'S HAND</span>
              </div>
            </div>
          </div>
        )}

        {/* Your Cards - Positioned to right/left of player seats */}
        {mySeat > 0 && (
          <div className={`absolute z-40 ${
            mySeat === 1 ? 'bottom-8 left-1/2 translate-x-40' :      // Seat 1 - further right for spacing
            mySeat === 2 ? 'bottom-24 left-64' :                     // Seat 2 - more spacing
            mySeat === 3 ? 'top-1/3 left-60' :                       // Seat 3 - more spacing
            mySeat === 4 ? 'top-12 right-1/2 -translate-x-40' :      // Seat 4 - further right and down
            mySeat === 5 ? 'top-1/3 right-60' :                      // Seat 5 - more spacing
            'bottom-24 right-64'                                     // Seat 6 - more spacing
          }`}>
            <div className="flex gap-1.5">
              {myCards && myCards.length > 0 ? (
                myCards.map((card: any, i: number) => {
                  // Ensure card is treated as a number
                  const cardNum = typeof card === 'number' ? card : (typeof card === 'object' && card.card !== undefined ? card.card : 0);
                  const cardData = cardToString(cardNum);
                  return (
                    <Card
                      key={i}
                      suit={cardData.suit}
                      rank={cardData.rank}
                      color={cardData.color}
                      size="small"
                      animationDelay={i * 0.1}
                      faceDown={false}
                      showFlipAnimation={false}
                    />
                  );
                })
              ) : (
                // Placeholder cards if no cards yet - Very dark blue
                [0, 1].map((i) => (
                  <div 
                    key={i} 
                    className="w-14 h-20 rounded-lg border-2 border-dashed border-blue-950/60 bg-blue-950/20 backdrop-blur-sm"
                  ></div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Win Popups - Render for each winner */}
        {winPopups.map((win, idx) => (
          <WinPopup
            key={`${win.seat}-${idx}-${Date.now()}`}
            amount={win.amount}
            seatNum={win.seat}
          />
        ))}
      </div>
    </div>
  );
};

export default Table;
