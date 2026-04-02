import React, { useState, useEffect, useRef } from 'react';
import PlayerTimer from './PlayerTimer';
import Card from './Card';
import PotDisplay from './PotDisplay';
import ChipStack from './ChipStack';
import ChipAnimation from './ChipAnimation';
import ActionBox from './ActionBox';
import PlayerStatsTooltip from './PlayerStatsTooltip';
import AnimatedNumber from './AnimatedNumber';
import PlayerAura from './PlayerAura';
import { calculatePlayerLevel, getLevelBadgeColor } from '../utils/playerLevel';

interface RealisticTableProps {
  players: any[];
  communityCards: number[];
  pot: number;
  sidePots?: Array<{ amount: number; eligiblePlayers: number[] }>;
  currentPlayer: number;
  mySeat: number;
  myCards: any[];
  opponentCards?: any[];
  showOpponentCards?: boolean;
  playerAlias?: string;
  myAvatar?: string;
  theme?: 'dark' | 'classic' | 'light' | 'executive' | 'neon' | 'vegas' | 'monaco' | 'golden' | 'cyber' | 'gatsby';
  revealedCards?: number;
  timerState?: {
    playerId: string;
    baseTimeMs: number;
    baseMaxMs: number;
    timeBankMs: number;
    timeBankMaxMs: number;
    usingTimeBank: boolean;
  };
  onRequestTimeBank?: () => void;
  onSitAtSeat?: (seat: number) => void;
  maxPlayers?: number; // Total player count (2-6)
  playerStreaks?: Map<number, number>; // Win/loss streaks for aura system
}

const cardToString = (cardNum: number): { suit: string, rank: string, color: string } => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suit = suits[Math.floor(cardNum / 13)];
  const rank = ranks[cardNum % 13];
  const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
  return { suit, rank, color };
};

const shortAddress = (address?: string): string => {
  if (!address || !address.startsWith('0x') || address.length < 10) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const seatAngles = [0, 58, 122, 180, 238, 302];

const getSeatPoint = (
  seatNum: number,
  radiusX: number,
  radiusY: number,
  offsetX = 0,
  offsetY = 0
) => {
  const angle = seatAngles[seatNum - 1] ?? 0;
  const radian = (angle * Math.PI) / 180;
  return {
    x: 50 + radiusX * Math.cos(radian) + offsetX,
    y: 50 + radiusY * Math.sin(radian) + offsetY,
    angle,
    radian,
  };
};

const RealisticTable: React.FC<RealisticTableProps> = ({
  players,
  communityCards,
  pot,
  sidePots = [],
  currentPlayer,
  mySeat,
  myCards,
  opponentCards = [],
  showOpponentCards = false,
  playerAlias,
  myAvatar = '👤',
  theme = 'classic',
  revealedCards = 0,
  timerState,
  onRequestTimeBank,
  onSitAtSeat,
  maxPlayers = 6, // Default to 6-player table
  playerStreaks = new Map() // Win/loss streaks
}) => {

  // Calculate SB/BB positions based on active players
  // In heads-up: dealer (button) is SB, other player is BB
  // With more players: dealer+1 is SB, dealer+2 is BB
  const activePlayers = players.filter((p: any) => p && typeof p.seat === 'number');
  const dealerSeat = activePlayers.find(p => p.isDealer)?.seat;
  const activeSeats = activePlayers.map(p => p.seat).sort((a, b) => a - b);
  
  let smallBlindSeat: number | undefined;
  let bigBlindSeat: number | undefined;
  
  if (dealerSeat && activeSeats.length >= 2) {
    const dealerIndex = activeSeats.indexOf(dealerSeat);
    
    if (activeSeats.length === 2) {
      // Heads-up: dealer is SB, other is BB
      smallBlindSeat = dealerSeat;
      bigBlindSeat = activeSeats.find(s => s !== dealerSeat);
    } else {
      // Multi-player: dealer+1 is SB, dealer+2 is BB
      const sbIndex = (dealerIndex + 1) % activeSeats.length;
      const bbIndex = (dealerIndex + 2) % activeSeats.length;
      smallBlindSeat = activeSeats[sbIndex];
      bigBlindSeat = activeSeats[bbIndex];
    }
  }

  // Animation state for betting animations
  const [activeChipAnimation, setActiveChipAnimation] = useState<{
    amount: number;
    fromSeat: number;
    isAllIn: boolean;
  } | null>(null);
  const [activeActionBox, setActiveActionBox] = useState<{
    action: 'call' | 'raise' | 'check' | 'fold' | 'allin';
    amount?: number;
    playerName: string;
    seat: number;
  } | null>(null);
  const [shouldPulsePot, setShouldPulsePot] = useState(false);

  // Hover state for player stats tooltip
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);

  // Track previous player states to detect actions
  const prevPlayersRef = useRef(players);
  const prevCurrentPlayerRef = useRef(currentPlayer);

  const tableThemes = {
    executive: {
      room: 'radial-gradient(120% 120% at 50% 10%, rgba(23, 61, 52, 0.56) 0%, rgba(10, 20, 18, 0.94) 62%, rgba(5, 9, 8, 1) 100%)',
      roomOverlay: 'linear-gradient(145deg, rgba(13, 45, 36, 0.62) 0%, rgba(7, 14, 12, 0) 52%, rgba(39, 26, 10, 0.36) 100%)',
      railOuter: 'linear-gradient(160deg, #d8b56f 0%, #af7f38 42%, #71491c 100%)',
      railInner: 'linear-gradient(150deg, #4a351d 0%, #2f2011 55%, #190f08 100%)',
      felt: 'radial-gradient(140% 130% at 50% 42%, #2f735d 0%, #255746 44%, #183a2f 100%)',
      feltEdge: 'rgba(237, 198, 122, 0.62)',
      railBorder: 'rgba(247, 226, 176, 0.44)',
      marker: 'rgba(250, 239, 208, 0.56)',
      markerOpacity: 0.48,
      surfaceShadow: '0 40px 92px rgba(0, 0, 0, 0.78), inset 0 4px 16px rgba(255, 231, 181, 0.54), inset 0 -20px 36px rgba(0, 0, 0, 0.66)',
    },
    classic: {
      room: 'radial-gradient(120% 120% at 50% 10%, rgba(19, 53, 46, 0.45) 0%, rgba(8, 16, 22, 0.95) 60%, rgba(3, 7, 11, 1) 100%)',
      roomOverlay: 'linear-gradient(145deg, rgba(10, 34, 30, 0.5) 0%, rgba(8, 16, 22, 0) 50%, rgba(31, 18, 11, 0.35) 100%)',
      railOuter: 'linear-gradient(155deg, #8e6538 0%, #65411f 44%, #3d2610 100%)',
      railInner: 'linear-gradient(155deg, #2e2418 0%, #1b140c 55%, #0f0b07 100%)',
      felt: 'radial-gradient(140% 130% at 50% 42%, #1e4d44 0%, #163931 44%, #0f2823 100%)',
      feltEdge: 'rgba(193, 159, 103, 0.42)',
      railBorder: 'rgba(220, 184, 122, 0.33)',
      marker: 'rgba(234, 226, 203, 0.45)',
      markerOpacity: 0.36,
      surfaceShadow: '0 34px 80px rgba(0, 0, 0, 0.7), inset 0 3px 12px rgba(220, 184, 122, 0.25), inset 0 -16px 32px rgba(0, 0, 0, 0.6)',
    },
    dark: {
      room: 'radial-gradient(120% 120% at 50% 10%, rgba(54, 20, 20, 0.45) 0%, rgba(13, 14, 20, 0.96) 60%, rgba(5, 6, 9, 1) 100%)',
      roomOverlay: 'linear-gradient(145deg, rgba(32, 14, 20, 0.5) 0%, rgba(8, 10, 16, 0) 54%, rgba(14, 18, 30, 0.35) 100%)',
      railOuter: 'linear-gradient(160deg, #6d2d2d 0%, #431818 44%, #280d0d 100%)',
      railInner: 'linear-gradient(150deg, #241414 0%, #160c0c 55%, #0d0707 100%)',
      felt: 'radial-gradient(140% 130% at 50% 42%, #2f1823 0%, #1f1017 44%, #12090f 100%)',
      feltEdge: 'rgba(193, 113, 113, 0.38)',
      railBorder: 'rgba(194, 124, 124, 0.3)',
      marker: 'rgba(235, 210, 210, 0.36)',
      markerOpacity: 0.34,
      surfaceShadow: '0 34px 82px rgba(0, 0, 0, 0.76), inset 0 3px 13px rgba(202, 121, 121, 0.24), inset 0 -18px 35px rgba(0, 0, 0, 0.64)',
    },
    light: {
      room: 'radial-gradient(120% 120% at 50% 10%, rgba(86, 116, 140, 0.34) 0%, rgba(27, 36, 52, 0.92) 58%, rgba(8, 11, 18, 1) 100%)',
      roomOverlay: 'linear-gradient(145deg, rgba(26, 55, 95, 0.38) 0%, rgba(7, 12, 24, 0) 52%, rgba(64, 49, 21, 0.28) 100%)',
      railOuter: 'linear-gradient(160deg, #b7b4a8 0%, #8a877d 42%, #5e5a52 100%)',
      railInner: 'linear-gradient(150deg, #52504a 0%, #37342f 55%, #201f1c 100%)',
      felt: 'radial-gradient(140% 130% at 50% 42%, #32506f 0%, #243a52 44%, #18293b 100%)',
      feltEdge: 'rgba(209, 214, 223, 0.44)',
      railBorder: 'rgba(218, 216, 210, 0.3)',
      marker: 'rgba(240, 245, 250, 0.45)',
      markerOpacity: 0.38,
      surfaceShadow: '0 34px 78px rgba(0, 0, 0, 0.66), inset 0 3px 12px rgba(255, 255, 255, 0.2), inset 0 -16px 32px rgba(0, 0, 0, 0.5)',
    },
  };

  // Auto-detect player actions and trigger animations - DISABLED to prevent loops
  // This was causing infinite chip animations
  // TODO: Re-implement with better debouncing/tracking if needed
  useEffect(() => {
    // Update refs only, no animation triggers
    prevPlayersRef.current = players;
    prevCurrentPlayerRef.current = currentPlayer;
  }, [players, currentPlayer]);

  const themeMap: Record<NonNullable<RealisticTableProps['theme']>, keyof typeof tableThemes> = {
    executive: 'executive',
    classic: 'classic',
    dark: 'dark',
    light: 'light',
    neon: 'executive',
    vegas: 'classic',
    monaco: 'executive',
    golden: 'executive',
    cyber: 'dark',
    gatsby: 'executive',
  };

  const resolvedThemeKey = themeMap[theme] ?? 'executive';

  const currentTheme = tableThemes[resolvedThemeKey];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-2 py-3 sm:px-3 sm:py-4 md:p-5 xl:p-6">
      <div className="fixed inset-0 pointer-events-none" style={{ background: currentTheme.room, zIndex: 0 }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: currentTheme.roomOverlay, zIndex: 0 }} />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          opacity: 0.34,
          backgroundColor: 'rgba(15, 10, 14, 0.35)',
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255, 145, 145, 0.08) 0 1px, transparent 1px 26px), repeating-linear-gradient(-45deg, rgba(255, 145, 145, 0.08) 0 1px, transparent 1px 26px), radial-gradient(circle at 50% 50%, rgba(255, 176, 176, 0.1) 0 14%, transparent 14% 100%)',
          backgroundSize: '64px 64px, 64px 64px, 120px 120px',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.12]"
        style={{
          zIndex: 0,
          backgroundImage:
            'radial-gradient(circle at 16% 20%, rgba(0, 189, 255, 0.24) 0 2px, transparent 3px), radial-gradient(circle at 78% 72%, rgba(17, 235, 180, 0.18) 0 2px, transparent 3px)',
          backgroundSize: '160px 160px, 190px 190px',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, transparent 36%, rgba(1, 3, 8, 0.72) 100%)', zIndex: 0 }}
      />

      <div className="relative z-10 aspect-[16/10] w-full" style={{ maxWidth: 'min(1320px, 97vw)' }}>
        <div className="absolute inset-[2.2%] rounded-[50%] bg-black/55 blur-3xl" style={{ zIndex: 1 }} />

        <div
          className="absolute inset-0 rounded-[50%] border"
          style={{
            zIndex: 10,
            background: currentTheme.railOuter,
            borderColor: currentTheme.railBorder,
            boxShadow: currentTheme.surfaceShadow,
          }}
        >
          <div
            className="absolute rounded-[50%] border"
            style={{
              inset: '2.4%',
              background: currentTheme.railInner,
              borderColor: resolvedThemeKey === 'executive' ? 'rgba(255, 231, 181, 0.16)' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              className="absolute rounded-[50%] overflow-hidden"
              style={{
                inset: '4.6%',
                background: currentTheme.felt,
                boxShadow: `inset 0 0 0 2px ${currentTheme.feltEdge}, inset 0 12px 28px rgba(255, 255, 255, 0.12), inset 0 -30px 42px rgba(0, 0, 0, 0.64)`,
              }}
            >
              <div
                className="absolute inset-0 rounded-[50%] opacity-[0.2]"
                style={{
                  backgroundImage:
                    'linear-gradient(35deg, transparent 0%, rgba(255, 255, 255, 0.08) 40%, transparent 60%), repeating-radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.04) 0 2px, transparent 2px 7px)',
                }}
              />

              <div className="absolute rounded-[50%] border" style={{ inset: '8%', borderColor: 'rgba(255, 255, 255, 0.08)' }} />
              <div className="absolute rounded-[50%] border" style={{ inset: '15%', borderColor: 'rgba(255, 255, 255, 0.06)' }} />

              <div className="absolute inset-0 rounded-[50%]" style={{ color: currentTheme.marker, opacity: currentTheme.markerOpacity }}>
                <svg className="h-full w-full" viewBox="0 0 800 500">
                  <circle cx="400" cy="250" r="56" fill="none" stroke="currentColor" strokeWidth="1.75" />
                  {seatAngles.map((angle, i) => (
                    <circle
                      key={i}
                      cx={400 + 280 * Math.cos((angle * Math.PI) / 180)}
                      cy={250 + 160 * Math.sin((angle * Math.PI) / 180)}
                      r="38"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  ))}
                </svg>
              </div>
              
              {/* Betting Circles - Show chips for each player's bet */}
              {[1, 2, 3, 4, 5, 6].map((seatNum) => {
                const player = players.find(p => p && p.seat === seatNum);
                if (!player || player.bet === 0) return null;
                const betPos = getSeatPoint(seatNum, 34, 31, 0, 1.5);
                
                const isCurrentPlayer = currentPlayer === seatNum;
                
                return (
                  <div
                    key={`bet-${seatNum}`}
                    className="absolute flex items-center justify-center"
                    style={{
                      zIndex: 15,
                      left: `${betPos.x}%`,
                      top: `${betPos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {/* Soft spotlight effect from above - circular glow on betting chips */}
                    {isCurrentPlayer && (
                      <div 
                        className="absolute"
                        style={{
                          width: 'clamp(96px, 14vw, 160px)',
                          height: 'clamp(96px, 14vw, 160px)',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle at center, rgba(255, 227, 161, 0.24) 0%, rgba(255, 227, 161, 0.11) 35%, rgba(7, 10, 18, 0) 100%)',
                          boxShadow: '0 0 46px rgba(255, 201, 105, 0.2)',
                          transform: 'translate(-50%, -50%)',
                          left: '50%',
                          top: '50%',
                          pointerEvents: 'none',
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          filter: 'blur(4px)'
                        }}
                      />
                    )}
                    <ChipStack amount={player.bet} size="medium" animate={true} />
                  </div>
                );
              })}
              
              {/* Dealer/SB/BB Chips - Positioned outside the betting circles */}
              {[1, 2, 3, 4, 5, 6].map((seatNum) => {
                const player = players.find(p => p && p.seat === seatNum);
                if (!player) return null;

                let xOffset = 0;
                let yOffset = 2;
                if (seatNum === 2) {
                  xOffset = -5;
                  yOffset = 4;
                }
                if (seatNum === 3) {
                  xOffset = 5;
                  yOffset = 1;
                }
                if (seatNum === 4) {
                  yOffset = 7;
                }

                const indicatorPos = getSeatPoint(seatNum, 39, 36, xOffset, yOffset);
                
                // Determine which chip to show (priority: Dealer > BB > SB)
                let chipType: 'dealer' | 'sb' | 'bb' | null = null;
                if (player.isDealer) chipType = 'dealer';
                else if (seatNum === bigBlindSeat) chipType = 'bb';
                else if (seatNum === smallBlindSeat) chipType = 'sb';
                
                if (!chipType) return null;
                
                return (
                  <div
                    key={`indicator-${seatNum}`}
                    className="absolute"
                    style={{
                      zIndex: 16,
                      left: `${indicatorPos.x}%`,
                      top: `${indicatorPos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                        chipType === 'dealer' 
                          ? 'bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 text-black border-amber-400 animate-pulse' 
                          : chipType === 'sb'
                          ? 'bg-blue-500 text-white border-blue-300 shadow-lg'
                          : 'bg-red-600 text-white border-red-400 shadow-lg'
                      }`}
                      style={chipType === 'dealer' ? {
                        boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                      } : {}}
                    >
                      {chipType === 'dealer' ? 'D' : chipType === 'sb' ? 'SB' : 'BB'}
                    </div>
                  </div>
                );
              })}
              
              {/* Center: Community Cards & Pot */}
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                {/* Pot Display with pulsing animation */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <PotDisplay 
                    mainPot={pot} 
                    sidePots={sidePots?.map(sp => ({ amount: sp.amount, players: sp.eligiblePlayers.map(String) }))} 
                    shouldPulse={shouldPulsePot} 
                  />
                </div>
                
                {/* Community Cards - Slightly smaller */}
                <div className="flex justify-center gap-1.5 sm:gap-2">
                  {communityCards && communityCards.length > 0 ? (
                    communityCards.map((card, i) => {
                      const cardData = cardToString(card);
                      const isRevealed = i < revealedCards;
                      return (
                        <div key={i} style={{ transform: 'scale(clamp(0.78, 1vw, 0.92))' }}>
                          <Card
                            suit={cardData.suit}
                            rank={cardData.rank}
                            color={cardData.color}
                            size="medium"
                            animationDelay={i * 0.15}
                            faceDown={!isRevealed}
                            showFlipAnimation={isRevealed}
                            theme={resolvedThemeKey}
                          />
                        </div>
                      );
                    })
                  ) : (
                    [0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-[clamp(58px,8vw,80px)] w-[clamp(40px,5.8vw,56px)] rounded-[0.7rem] border border-dashed border-slate-300/30 bg-slate-100/5"
                      ></div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Player Positions (Oval arrangement) */}
              {[1, 2, 3, 4, 5, 6].map((seatNum) => {
                const player = players.find(p => p && p.seat === seatNum);
                const isMe = seatNum === mySeat;
                const seatPos = getSeatPoint(seatNum, 58, 54);
                
                // Higher z-index for seats 5 and 6 to prevent cutoff
                const zIndex = (seatNum === 5 || seatNum === 6) ? 'z-50' : 'z-30';
                
                // 🌟 ACTIVE PLAYER SPOTLIGHT: Dim non-active players who haven't folded
                const shouldDim = currentPlayer !== null && currentPlayer !== seatNum && !player?.folded;
                
                return (
                  <div
                    key={seatNum}
                    className={`absolute ${zIndex} transition-opacity duration-300`}
                    style={{
                      opacity: shouldDim ? 0.56 : 1,
                      left: `${seatPos.x}%`,
                      top: `${seatPos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {player ? (
                      <div className={`relative transition-all duration-500 ${
                        player.folded 
                          ? 'opacity-40 grayscale blur-[0.5px]' 
                          : ''
                      }`}>
                        
                        {/* Player Layout: Cards behind Avatar → Avatar → Name → Stack */}
                        <div className="relative flex flex-col items-center gap-2">
                          
                          {/* CARDS - Larger, more spread, more tilted - FULL OPACITY unless folded */}
                          {isMe && myCards && myCards.length > 0 && (
                            <div 
                              className="absolute transition-opacity duration-300" 
                              style={{ 
                                top: 'clamp(-56px, -7vw, -38px)',
                                left: '50%', 
                                transform: 'translateX(-50%)', 
                                zIndex: 0,
                                opacity: 1
                              }}
                            >
                              <div className="relative" style={{ width: 'clamp(78px, 10vw, 108px)', height: 'clamp(58px, 7vw, 80px)' }}>
                                {myCards.map((card, i) => {
                                  const cardData = cardToString(card);
                                  const rotation = i === 0 ? -11 : 11;
                                  const xOffset = i === 0 ? -20 : 20;
                                  
                                  // Check if human player is showing/mucking cards at showdown
                                  const isMucked = player?.hasMucked;
                                  const justRevealed = player?.hasShownCards;
                                  
                                  // Determine animation class for human player's cards
                                  let animationClass = '';
                                  if (isMucked) {
                                    animationClass = i === 0 ? 'showdown-card-muck' : 'showdown-card-muck-stagger';
                                  } else if (justRevealed) {
                                    animationClass = i === 0 ? 'showdown-card-reveal' : 'showdown-card-reveal-stagger';
                                  }
                                  
                                  return (
                                    <div 
                                      key={i}
                                      className={`absolute card-showdown-transition ${animationClass}`}
                                      style={{ 
                                        left: `calc(50% + ${xOffset}px)`,
                                        top: '0',
                                        transform: `translateX(-50%) rotate(${rotation}deg) scale(1.02)`,
                                        zIndex: i
                                      }}
                                    >
                                      <Card
                                        suit={cardData.suit}
                                        rank={cardData.rank}
                                        color={cardData.color}
                                        size="small"
                                        animationDelay={i * 0.1}
                                        disableDealAnimation={isMucked || justRevealed}
                                        theme={resolvedThemeKey}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Opponent cards: render backs while in hand even if public state omits hidden card values */}
                          {!isMe && !player.folded && (player.inHand || (player.cards && player.cards.length > 0)) && (
                            <div 
                              className="absolute transition-opacity duration-300" 
                              style={{ 
                                top: 'clamp(-56px, -7vw, -38px)',
                                left: '50%', 
                                transform: 'translateX(-50%)', 
                                zIndex: 0,
                                opacity: 1
                              }}
                            >
                              <div className="relative" style={{ width: 'clamp(78px, 10vw, 108px)', height: 'clamp(58px, 7vw, 80px)' }}>
                                {/* Show card backs for AI players (or actual cards at showdown) */}
                                {(player.cards && player.cards.length > 0 ? player.cards : [0, 0]).map((card: number, i: number) => {
                                  // At showdown OR if player must show cards (all-in), show actual cards
                                  const mustShowCards = player.mustShowCards || player.showingCards;
                                  const isShowdown = (showOpponentCards && seatNum === 4 && opponentCards && opponentCards.length > 0) || mustShowCards;
                                  const isMucked = player.hasMucked;
                                  const justRevealed = player.hasShownCards;
                                  
                                  const rotation = i === 0 ? -11 : 11;
                                  const xOffset = i === 0 ? -20 : 20;
                                  
                                  // Determine animation class
                                  let animationClass = '';
                                  if (isMucked) {
                                    // Muck animation
                                    animationClass = i === 0 ? 'showdown-card-muck' : 'showdown-card-muck-stagger';
                                  } else if (justRevealed && mustShowCards) {
                                    // Reveal animation with stagger
                                    animationClass = i === 0 ? 'showdown-card-reveal' : 'showdown-card-reveal-stagger';
                                  }
                                  
                                  if (isShowdown) {
                                    // Show actual cards at showdown or when all-in
                                    const cardData = cardToString(mustShowCards ? card : (opponentCards[i] || card));
                                    return (
                                      <div 
                                        key={i}
                                        className={`absolute card-showdown-transition ${animationClass}`}
                                        style={{ 
                                          left: `calc(50% + ${xOffset}px)`,
                                          top: '0',
                                          transform: `translateX(-50%) rotate(${rotation}deg) scale(1.02)`,
                                          zIndex: i
                                        }}
                                      >
                                        <Card
                                          suit={cardData.suit}
                                          rank={cardData.rank}
                                          color={cardData.color}
                                          size="small"
                                          animationDelay={i * 0.1}
                                          showFlipAnimation={false}
                                          disableDealAnimation={isMucked || justRevealed}
                                          theme={resolvedThemeKey}
                                        />
                                      </div>
                                    );
                                  } else {
                                    // Show card backs for hidden cards (with reduced opacity)
                                    return (
                                      <div 
                                        key={i}
                                        className={`absolute opacity-70 card-showdown-transition ${isMucked ? (i === 0 ? 'showdown-card-muck' : 'showdown-card-muck-stagger') : ''}`}
                                        style={{ 
                                          left: `calc(50% + ${xOffset}px)`,
                                          top: '0',
                                          transform: `translateX(-50%) rotate(${rotation}deg) scale(1.02)`,
                                          zIndex: i
                                        }}
                                      >
                                        <Card
                                          faceDown={true}
                                          size="small"
                                          animationDelay={i * 0.1}
                                          disableDealAnimation={isMucked}
                                          theme={resolvedThemeKey}
                                        />
                                      </div>
                                    );
                                  }
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* AVATAR circle - Even Larger with Hover Tooltip */}
                          <div 
                            className={`relative flex h-[clamp(52px,6.4vw,80px)] w-[clamp(52px,6.4vw,80px)] cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 text-[clamp(1rem,2.2vw,1.9rem)] shadow-lg transition-all duration-300 hover:scale-[1.03] ${
                              currentPlayer === seatNum && !timerState
                                ? 'border-2 border-teal-400 active-player-glow'
                                : 'border-2 border-amber-300/50'
                            } ${currentPlayer === seatNum && timerState ? 'active-player-glow' : ''}`} 
                            style={{ 
                              zIndex: 10,
                              boxShadow: '0 14px 26px rgba(0, 0, 0, 0.55), inset 0 1px 4px rgba(255, 255, 255, 0.18)'
                            }}
                            onMouseEnter={() => setHoveredSeat(seatNum)}
                            onMouseLeave={() => setHoveredSeat(null)}
                          >
                            {/* Active player indicator ring */}
                            {currentPlayer === seatNum && (() => {
                              const getTimerColor = () => {
                                if (!timerState) return { border: 'rgba(20, 184, 166, 0.7)', shadow: '0 0 12px rgba(20, 184, 166, 0.35)' };
                                const timeInSeconds = timerState.baseTimeMs / 1000;
                                if (timeInSeconds > 15) {
                                  return { border: 'rgba(20, 184, 166, 0.7)', shadow: '0 0 12px rgba(20, 184, 166, 0.35)' };
                                } else if (timeInSeconds > 5) {
                                  return { border: 'rgba(234, 179, 8, 0.7)', shadow: '0 0 12px rgba(234, 179, 8, 0.35)' };
                                } else {
                                  return { border: 'rgba(239, 68, 68, 0.7)', shadow: '0 0 12px rgba(239, 68, 68, 0.35)' };
                                }
                              };
                              const colors = getTimerColor();
                              
                              return (
                                <div className="absolute -inset-1.5 rounded-full border-2 transition-colors duration-300"
                                     style={{ 
                                       borderColor: colors.border,
                                       boxShadow: colors.shadow
                                     }} />
                              );
                            })()}
                            
                            {/* Player Aura - Win/Loss Streak Effects */}
                            <PlayerAura 
                              winStreak={playerStreaks.get(seatNum) || 0}
                              isActive={!player.folded && !player.busted}
                            />
                            
                            {(() => {
                              const avatarValue = isMe ? myAvatar : player.avatar;
                              if (avatarValue && avatarValue.startsWith('IMG:')) {
                                return (
                                  <img
                                    src={`/avatars/${avatarValue.replace('IMG:', '')}.png`}
                                    alt="avatar"
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                );
                              }
                              if (avatarValue && avatarValue !== '👤' && avatarValue !== '🎮') {
                                return <span>{avatarValue}</span>;
                              }

                              const fallbackName =
                                player.displayName || (isMe ? playerAlias : '') || player.name || 'Player';
                              const fallbackInitial = fallbackName.trim().charAt(0).toUpperCase();
                              return <span className="font-black tracking-wide text-slate-100">{fallbackInitial}</span>;
                            })()}
                            
                            {/* Timer border - wraps around avatar as a colored ring - ALL PLAYERS */}
                            {currentPlayer === seatNum && timerState && (
                              <PlayerTimer
                                playerId={seatNum.toString()}
                                isActive={true}
                                baseTimeMs={timerState.baseTimeMs}
                                baseMaxMs={timerState.baseMaxMs}
                                timeBankMs={timerState.timeBankMs}
                                timeBankMaxMs={timerState.timeBankMaxMs}
                                usingTimeBank={timerState.usingTimeBank}
                                onRequestTimeBank={isMe ? onRequestTimeBank : undefined}
                              />
                            )}

                            {/* Timeout Warning Indicator */}
                            {player.timeoutWarning && (
                              <div 
                                className="absolute -top-2 -right-2 z-50 bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg animate-pulse"
                                title="Warning: 1 timeout - another timeout will remove you from the hand"
                              >
                                ⚠️
                              </div>
                            )}

                            {/* Timeout Counter (if player has any timeouts) */}
                            {(player.timeouts ?? 0) > 0 && !player.timeoutWarning && (
                              <div 
                                className="absolute -top-1 -right-1 z-50 bg-amber-600 rounded-full w-7 h-7 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-md"
                                title={`Timeouts: ${player.timeouts}/2`}
                              >
                                {player.timeouts}
                              </div>
                            )}
                            
                            {/* Player Stats Tooltip on Hover */}
                            {hoveredSeat === seatNum && (
                              <PlayerStatsTooltip
                                player={{
                                  name: player.displayName || player.name || shortAddress(player.walletAddress || player.playerId) || 'Opponent',
                                  avatar: player.avatar,
                                  stack: player.stack || 0,
                                  handsPlayed: player.handsPlayed || 0,
                                  handsWon: player.handsWon || 0,
                                  biggestPot: player.biggestPot || 0,
                                  currentBuyIn: player.currentBuyIn || player.stack
                                }}
                                isMe={isMe}
                                playerAlias={playerAlias}
                              />
                            )}
                            
                            {/* Player Level Badge */}
                            {(() => {
                              const levelInfo = calculatePlayerLevel(
                                player.handsPlayed || 0,
                                player.handsWon || 0
                              );
                              const colors = getLevelBadgeColor(levelInfo.level);
                              
                              return (
                                <div 
                                  className={`absolute -bottom-1.5 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-r ${colors.bg} border-2 ${colors.border} text-[clamp(10px,1.1vw,14px)] font-black text-white shadow-lg`}
                                  style={{
                                    width: 'clamp(24px, 2.6vw, 38px)',
                                    height: 'clamp(24px, 2.6vw, 38px)',
                                    boxShadow: `0 2px 8px ${colors.glow}`,
                                  }}
                                  title={`Level ${levelInfo.level} - ${levelInfo.progressPercent}% to next level`}
                                >
                                  {levelInfo.level}
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* 3. NAME - Overlaps avatar bottom slightly */}
                          <div className="-mt-1.5 min-w-[clamp(96px,11vw,136px)] rounded-md border border-slate-500/45 bg-slate-900/85 px-3 py-1 text-center backdrop-blur-sm" style={{ zIndex: 11 }}>
                            <div className="truncate text-[clamp(11px,1.4vw,15px)] font-semibold text-slate-100">
                              {player.displayName || (isMe ? playerAlias : '') || player.name || shortAddress(player.walletAddress || player.playerId) || 'Opponent'}
                            </div>
                          </div>
                          
                          {/* 4. STACK (Money in the bank) */}
                          <div className="min-w-[clamp(96px,11vw,136px)] rounded-md border border-amber-300/35 bg-slate-950/80 px-3 py-1 text-center backdrop-blur-sm">
                            <div className="text-[clamp(10px,1.25vw,14px)] font-bold text-amber-200">
                              <AnimatedNumber value={player.stack || 0} duration={0.3} separator="," /> SHIDO
                            </div>
                          </div>
                          
                          {/* 5. LAST ACTION - Shows recent action with color coding (below stack) */}
                          {player.lastAction && (
                            <div className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                              player.lastAction.type === 'raise' || player.lastAction.type === 'bet' 
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' 
                                : player.lastAction.type === 'call' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                                : player.lastAction.type === 'fold' 
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : player.lastAction.type === 'allin'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 animate-pulse'
                                : 'bg-slate-500/20 text-slate-400 border border-slate-500/40'
                            }`}>
                              {player.lastAction.text}
                            </div>
                          )}
                          
                        </div>
                      </div>
                    ) : (
                      /* Empty Seat - Clickable */
                      <div
                        className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                          mySeat > 0 && mySeat !== seatNum
                            ? 'opacity-40 cursor-not-allowed'
                            : 'cursor-pointer hover:scale-105'
                        }`}
                        onClick={() => {
                          if (mySeat > 0 && mySeat !== seatNum) {
                            return; // Already seated elsewhere
                          }
                          onSitAtSeat && onSitAtSeat(seatNum);
                        }}
                      >
                        <div className={`h-[clamp(62px,7.8vw,92px)] w-[clamp(62px,7.8vw,92px)] rounded-full border border-dashed flex flex-col items-center justify-center transition-all ${
                          mySeat > 0 && mySeat !== seatNum
                            ? 'border-white/15 bg-white/5'
                            : 'border-amber-300/45 bg-amber-400/10 hover:border-amber-200 hover:bg-amber-300/15 hover:shadow-lg hover:shadow-amber-200/20'
                        }`}>
                          <span className={`text-[clamp(10px,1.15vw,12px)] font-semibold tracking-wide ${
                            mySeat > 0 && mySeat !== seatNum ? 'text-white/25' : 'text-amber-200/80'
                          }`}>SEAT {seatNum}</span>
                          <span className={`text-[10px] ${
                            mySeat > 0 && mySeat !== seatNum ? 'text-white/15' : 'text-amber-200/55'
                          }`}>EMPTY</span>
                        </div>
                        {mySeat === 0 && (
                          <div className="rounded-md border border-amber-300/45 bg-amber-500/15 px-3 py-1 backdrop-blur-sm transition-all hover:border-amber-200 hover:bg-amber-300/20">
                            <span className="text-[11px] font-semibold tracking-wide text-amber-100">JOIN</span>
                          </div>
                        )}
                        {mySeat > 0 && mySeat !== seatNum && (
                          <span className="text-red-400/60 text-xs">Occupied</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
            </div>
          </div>
        </div>

        {/* Betting Animations - Chip sliding animations */}
        {activeChipAnimation && (
          <ChipAnimation
            {...activeChipAnimation}
            onComplete={() => {
              setActiveChipAnimation(null);
            }}
          />
        )}

        {/* Action Boxes - Float above players showing their actions */}
        {activeActionBox && (
          <ActionBox
            {...activeActionBox}
            onComplete={() => setActiveActionBox(null)}
          />
        )}
        
      </div>
    </div>
  );
};

export default React.memo(RealisticTable);
