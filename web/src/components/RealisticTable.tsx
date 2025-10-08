import React, { useState, useEffect, useRef } from 'react';
import PlayerTimer from './PlayerTimer';
import Card from './Card';
import PotDisplay from './PotDisplay';
import ChipStack from './ChipStack';
import ChipAnimation from './ChipAnimation';
import ActionBox from './ActionBox';
import PlayerStatsTooltip from './PlayerStatsTooltip';
import AnimatedNumber from './AnimatedNumber';
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
  theme?: 'dark' | 'classic' | 'light' | 'executive';
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
}

const cardToString = (cardNum: number): { suit: string, rank: string, color: string } => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suit = suits[Math.floor(cardNum / 13)];
  const rank = ranks[cardNum % 13];
  const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
  return { suit, rank, color };
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
  myAvatar = '🎮',
  theme = 'classic',
  revealedCards = 0,
  timerState,
  onRequestTimeBank,
  onSitAtSeat,
  maxPlayers = 6 // Default to 6-player table
}) => {

  // Calculate SB/BB positions based on active players
  // In heads-up: dealer (button) is SB, other player is BB
  // With more players: dealer+1 is SB, dealer+2 is BB
  const activePlayers = players.filter(p => p);
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

  // Theme configurations for realistic tables
  const tableThemes = {
    classic: {
      // Classic velvety green felt with wood rail - Purple carpet background
      outerRing: 'bg-gradient-to-b from-amber-950 via-stone-900 to-black',
      innerRing: 'bg-gradient-to-b from-amber-900 via-amber-950 to-stone-950',
      felt: 'bg-gradient-to-br from-emerald-800 via-green-700 to-emerald-900',
      border: 'border-amber-700',
      shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_2px_12px_rgba(120,53,15,0.4),inset_0_-8px_24px_rgba(0,0,0,0.7)]',
      background: 'purple'
    },
    executive: {
      // Charcoal satin velvet felt with gold rail - Black carpet background
      outerRing: 'bg-gradient-to-b from-yellow-700 via-yellow-600 to-yellow-800',
      innerRing: 'bg-gradient-to-b from-yellow-600 via-amber-500 to-yellow-700',
      felt: 'bg-gradient-to-br from-slate-800 via-slate-900 to-gray-950',
      border: 'border-yellow-600',
      shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_2px_12px_rgba(212,175,55,0.6),inset_0_-8px_24px_rgba(0,0,0,0.7)]',
      background: 'black'
    },
    dark: {
      // Dark red velvety felt with midnight blue rail - Dark blue carpet background
      outerRing: 'bg-gradient-to-b from-blue-950 via-blue-900 to-slate-950',
      innerRing: 'bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950',
      felt: 'bg-gradient-to-br from-red-950 via-red-900 to-black',
      border: 'border-blue-900',
      shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.7),inset_0_2px_12px_rgba(30,58,138,0.3),inset_0_-8px_24px_rgba(0,0,0,0.6)]',
      background: 'darkBlue'
    },
    light: {
      // Velvety gold satin felt with birch/pine rail - Sky blue background
      outerRing: 'bg-gradient-to-b from-stone-200 via-amber-50 to-stone-300',
      innerRing: 'bg-gradient-to-b from-amber-50 via-yellow-50 to-stone-200',
      felt: 'bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-700',
      border: 'border-stone-200',
      shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_2px_12px_rgba(250,250,249,0.5),inset_0_-8px_16px_rgba(0,0,0,0.1)]',
      background: 'skyBlue'
    }
  };

  // Auto-detect player actions and trigger animations - DISABLED to prevent loops
  // This was causing infinite chip animations
  // TODO: Re-implement with better debouncing/tracking if needed
  useEffect(() => {
    // Update refs only, no animation triggers
    prevPlayersRef.current = players;
    prevCurrentPlayerRef.current = currentPlayer;
  }, [players, currentPlayer]);

  const currentTheme = tableThemes[theme];
  
  // Background configurations
  const getBackgroundStyle = () => {
    switch(currentTheme.background) {
      case 'purple':
        return 'from-purple-950 via-gray-950 to-purple-900';
      case 'black':
        return 'from-gray-950 via-black to-gray-900';
      case 'darkBlue':
        return 'from-blue-950 via-slate-950 to-blue-900';
      case 'skyBlue':
        return 'from-sky-200 via-blue-100 to-sky-300';
      case 'creamWood':
        return 'from-orange-100 via-amber-100 to-orange-200';
      default:
        return 'from-red-950 via-gray-950 to-purple-950';
    }
  };
  
  const getCarpetColor = () => {
    switch(currentTheme.background) {
      case 'purple':
        return { base: '#1a0a0f', diamond1: '#3a1520', diamond2: '#2a0f18', accent: '#4a1a28', line: '#2a1015', dot: '#5a2030' };
      case 'black':
        return { base: '#0a0a0a', diamond1: '#1a1a1a', diamond2: '#0f0f0f', accent: '#2a2a2a', line: '#151515', dot: '#303030' };
      case 'darkBlue':
        return { base: '#0a0f1a', diamond1: '#1a2540', diamond2: '#0f1828', accent: '#1a3050', line: '#0f1a28', dot: '#2a4060' };
      case 'skyBlue':
        return { base: '#e0f2fe', diamond1: '#bae6fd', diamond2: '#d0ebfd', accent: '#7dd3fc', line: '#c0e5fd', dot: '#38bdf8' };
      case 'creamWood':
        return { base: '#fed7aa', diamond1: '#fdba74', diamond2: '#fdc794', accent: '#fb923c', line: '#fdba74', dot: '#f97316' };
      default:
        return { base: '#1a0a0f', diamond1: '#3a1520', diamond2: '#2a0f18', accent: '#4a1a28', line: '#2a1015', dot: '#5a2030' };
    }
  };
  
  const carpetColors = getCarpetColor();
  const carpetOpacity = (currentTheme.background === 'skyBlue' || currentTheme.background === 'creamWood') ? '0.25' : '0.4';
  const vignetteOpacity = (currentTheme.background === 'skyBlue' || currentTheme.background === 'creamWood') ? '0.2' : '0.7';

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Casino Carpet Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getBackgroundStyle()}`}>
        {/* Casino carpet pattern - Ornate geometric design */}
        <div className="absolute inset-0" style={{ opacity: carpetOpacity }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="casinoCarpet" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                {/* Base tile */}
                <rect x="0" y="0" width="100" height="100" fill={carpetColors.base} />
                
                {/* Diamond pattern */}
                <polygon points="50,10 70,50 50,90 30,50" fill={carpetColors.diamond1} opacity="0.6" />
                <polygon points="50,15 65,50 50,85 35,50" fill={carpetColors.diamond2} opacity="0.8" />
                
                {/* Corner accents */}
                <circle cx="10" cy="10" r="8" fill={carpetColors.accent} opacity="0.5" />
                <circle cx="90" cy="10" r="8" fill={carpetColors.accent} opacity="0.5" />
                <circle cx="10" cy="90" r="8" fill={carpetColors.accent} opacity="0.5" />
                <circle cx="90" cy="90" r="8" fill={carpetColors.accent} opacity="0.5" />
                
                {/* Decorative lines */}
                <line x1="0" y1="50" x2="100" y2="50" stroke={carpetColors.line} strokeWidth="1" opacity="0.4" />
                <line x1="50" y1="0" x2="50" y2="100" stroke={carpetColors.line} strokeWidth="1" opacity="0.4" />
                
                {/* Small dots for texture */}
                <circle cx="25" cy="25" r="2" fill={carpetColors.dot} opacity="0.6" />
                <circle cx="75" cy="25" r="2" fill={carpetColors.dot} opacity="0.6" />
                <circle cx="25" cy="75" r="2" fill={carpetColors.dot} opacity="0.6" />
                <circle cx="75" cy="75" r="2" fill={carpetColors.dot} opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#casinoCarpet)" />
          </svg>
        </div>
        {/* Carpet texture overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{ 
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
            backgroundSize: '100% 4px'
          }}></div>
        </div>
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black" style={{ opacity: vignetteOpacity }}></div>
      </div>
      
      {/* Oval Table Container - Optimized for 1920x1080 */}
      <div className="relative w-full max-w-6xl aspect-[16/10] z-10">
        
        {/* Bar Stools - Behind everything */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const radian = (angle * Math.PI) / 180;
          // Adjust horizontal radius for left/right seats (0° and 180°)
          // 0° = right seat (seat 1), 180° = left seat (seat 4)
          const isLeftOrRight = angle === 0 || angle === 180;
          const radiusX = isLeftOrRight ? 50 : 53; // Bring in left/right by 3%
          const radiusY = 49;
          const x = 50 + radiusX * Math.cos(radian);
          const y = 50 + radiusY * Math.sin(radian);
          
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}
            >
              {/* Stool Seat - Brown Leather Circle Only */}
              <div className="w-24 h-24 bg-gradient-to-br from-amber-700 via-amber-900 to-amber-950 rounded-full shadow-2xl border-4 border-amber-950">
                {/* Leather texture/tufting effect */}
                <div className="absolute inset-3 bg-amber-800/50 rounded-full"></div>
                <div className="absolute inset-5 border-2 border-amber-950/40 rounded-full"></div>
                {/* Center button */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-amber-950 rounded-full shadow-inner"></div>
              </div>
            </div>
          );
        })}
        
        {/* Table Shadow (dropped shadow beneath table) */}
        <div className="absolute inset-0 bg-black/60 blur-2xl transform translate-y-8 scale-95 rounded-[50%]" style={{ zIndex: 5 }}></div>
        
        {/* Outer Wood/Metal Rail */}
        <div className={`absolute inset-0 ${currentTheme.outerRing} rounded-[50%] ${currentTheme.shadow}`} style={{ zIndex: 10 }}>
          
          {/* Inner Rail Lip */}
          <div className={`absolute inset-4 ${currentTheme.innerRing} rounded-[50%] shadow-inner`}>
            
            {/* Playing Surface (Felt) */}
            <div className={`absolute inset-8 ${currentTheme.felt} rounded-[50%] border-4 ${currentTheme.border} shadow-[inset_0_4px_24px_rgba(0,0,0,0.5)]`}>
              
              {/* Subtle table markings */}
              <div className="absolute inset-0 rounded-[50%] opacity-30">
                <svg className="w-full h-full" viewBox="0 0 800 500">
                  {/* Dealer circle */}
                  <circle cx="400" cy="250" r="60" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                  {/* Player position circles */}
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <circle
                      key={i}
                      cx={400 + 280 * Math.cos((angle * Math.PI) / 180)}
                      cy={250 + 160 * Math.sin((angle * Math.PI) / 180)}
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      opacity="0.4"
                    />
                  ))}
                </svg>
              </div>
              
              {/* Betting Circles - Show chips for each player's bet */}
              {[1, 2, 3, 4, 5, 6].map((seatNum) => {
                const player = players.find(p => p && p.seat === seatNum);
                if (!player || player.bet === 0) return null;
                
                const angleMap = [0, 60, 120, 180, 240, 300];
                const angle = angleMap[seatNum - 1];
                const radian = (angle * Math.PI) / 180;
                
                // Position chips to match the betting circles
                // Adjust for better visual centering
                const radiusX = (seatNum === 1 || seatNum === 4) ? 33 : 35; // Seats 1&4 come in 2%
                const radiusY = 32;
                
                // Seat-specific horizontal adjustments
                let xOffset = 0;
                if (seatNum === 2) xOffset = -1; // Move left 1%
                if (seatNum === 3) xOffset = 1;  // Move right 1%
                if (seatNum === 5) xOffset = 1;  // Move right 1%
                if (seatNum === 6) xOffset = -1; // Move left 1%
                
                const x = 50 + radiusX * Math.cos(radian) + xOffset;
                const y = 50 + radiusY * Math.sin(radian) + 2; // Move down 2% (adjusted down 1% more)
                
                const isCurrentPlayer = currentPlayer === seatNum;
                
                return (
                  <div
                    key={`bet-${seatNum}`}
                    className="absolute z-15 flex items-center justify-center"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {/* Soft spotlight effect from above - circular glow on betting chips */}
                    {isCurrentPlayer && (
                      <div 
                        className="absolute"
                        style={{
                          width: '160px',
                          height: '160px',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle at center, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 70%, transparent 100%)',
                          boxShadow: '0 0 60px rgba(255,255,255,0.2), inset 0 0 40px rgba(255,255,255,0.1)',
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
                
                const angleMap = [0, 60, 120, 180, 240, 300];
                const angle = angleMap[seatNum - 1];
                const radian = (angle * Math.PI) / 180;
                
                // Position chips slightly outside the betting circle
                const radiusX = (seatNum === 1 || seatNum === 4) ? 38 : 40; // Further out than betting circles
                const radiusY = 37;
                
                // Seat-specific horizontal adjustments
                let xOffset = 0;
                if (seatNum === 2) xOffset = -1;
                if (seatNum === 3) xOffset = 1;
                if (seatNum === 5) xOffset = 1;
                if (seatNum === 6) xOffset = -1;
                
                // Seat-specific vertical adjustments (seat 4 dealer chip below player)
                let yOffset = 3;
                if (seatNum === 4) yOffset = 8; // Move dealer chip below for seat 4 (left side)
                
                // Adjust position for seats 2 and 3 to avoid bet amount overlay
                if (seatNum === 2) {
                  xOffset = -6; // Move further left for seat 2 (top right)
                  yOffset = 5;  // Move down slightly
                }
                if (seatNum === 3) {
                  xOffset = 6;  // Move further right for seat 3 (right side)
                  yOffset = 1;  // Move up slightly
                }
                
                const x = 50 + radiusX * Math.cos(radian) + xOffset;
                const y = 50 + radiusY * Math.sin(radian) + yOffset;
                
                // Determine which chip to show (priority: Dealer > BB > SB)
                let chipType: 'dealer' | 'sb' | 'bb' | null = null;
                if (player.isDealer) chipType = 'dealer';
                else if (seatNum === bigBlindSeat) chipType = 'bb';
                else if (seatNum === smallBlindSeat) chipType = 'sb';
                
                if (!chipType) return null;
                
                return (
                  <div
                    key={`indicator-${seatNum}`}
                    className="absolute z-16"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
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
                        boxShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.5)'
                      } : {}}
                    >
                      {chipType === 'dealer' ? 'D' : chipType === 'sb' ? 'SB' : 'BB'}
                    </div>
                  </div>
                );
              })}
              
              {/* Center: Community Cards & Pot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                {/* Pot Display with pulsing animation */}
                <div className="mb-6">
                  <PotDisplay 
                    mainPot={pot} 
                    sidePots={sidePots?.map(sp => ({ amount: sp.amount, players: sp.eligiblePlayers.map(String) }))} 
                    shouldPulse={shouldPulsePot} 
                  />
                </div>
                
                {/* Community Cards - Slightly smaller */}
                <div className="flex gap-2 justify-center">
                  {communityCards && communityCards.length > 0 ? (
                    communityCards.map((card, i) => {
                      const cardData = cardToString(card);
                      const isRevealed = i < revealedCards;
                      return (
                        <div key={i} style={{ transform: 'scale(0.9)' }}>
                          <Card
                            suit={cardData.suit}
                            rank={cardData.rank}
                            color={cardData.color}
                            size="medium"
                            animationDelay={i * 0.15}
                            faceDown={!isRevealed}
                            showFlipAnimation={isRevealed}
                            theme={theme}
                          />
                        </div>
                      );
                    })
                  ) : (
                    [0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-14 h-20 rounded-lg border-2 border-dashed border-white/20 bg-white/5"
                      ></div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Player Positions (Oval arrangement) */}
              {[1, 2, 3, 4, 5, 6].map((seatNum) => {
                const player = players.find(p => p && p.seat === seatNum);
                const isMe = seatNum === mySeat;
                
                // Oval positioning (evenly distributed around the table)
                // Starting from top (0°) and going clockwise, 60 degrees apart
                const angleMap = [
                  0,    // Seat 1 - Top (12 o'clock)
                  60,   // Seat 2 - Top right (2 o'clock)
                  120,  // Seat 3 - Bottom right (4 o'clock)
                  180,  // Seat 4 - Bottom (6 o'clock)
                  240,  // Seat 5 - Bottom left (8 o'clock)
                  300   // Seat 6 - Top left (10 o'clock)
                ];
                
                const angle = angleMap[seatNum - 1];
                const radian = (angle * Math.PI) / 180;
                
                // Ellipse formula for oval table - positioned OUTSIDE the rail
                const radiusX = 56; // Horizontal radius % (outside table)
                const radiusY = 52; // Vertical radius % (outside table)
                const x = 50 + radiusX * Math.cos(radian);
                const y = 50 + radiusY * Math.sin(radian);
                
                // Higher z-index for seats 5 and 6 to prevent cutoff
                const zIndex = (seatNum === 5 || seatNum === 6) ? 'z-50' : 'z-30';
                
                return (
                  <div
                    key={seatNum}
                    className={`absolute ${zIndex}`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {player ? (
                      <div className={`relative transition-all duration-500 ${
                        player.folded 
                          ? 'opacity-40 grayscale blur-[0.5px]' 
                          : 'opacity-100'
                      }`}>
                        
                        {/* Player Layout: Cards behind Avatar → Avatar → Name → Stack */}
                        <div className="relative flex flex-col items-center gap-2">
                          
                          {/* CARDS - Larger, more spread, more tilted */}
                          {isMe && myCards && myCards.length > 0 && (
                            <div className="absolute" style={{ top: '-60px', left: '50%', transform: 'translateX(-50%)', zIndex: 0 }}>
                              <div className="relative" style={{ width: '110px', height: '80px' }}>
                                {myCards.map((card, i) => {
                                  const cardData = cardToString(card);
                                  // Cards: larger, more spread, more tilted
                                  const rotation = i === 0 ? -15 : 15; // More tilt (was -12/12)
                                  const xOffset = i === 0 ? -24 : 24; // More spread (was -20/20)
                                  
                                  return (
                                    <div 
                                      key={i}
                                      className="absolute"
                                      style={{ 
                                        left: '50%',
                                        top: '0',
                                        transform: `translateX(calc(-50% + ${xOffset}px)) rotate(${rotation}deg) scale(1.15)`,
                                        zIndex: 0,
                                        transition: 'transform 0.3s ease'
                                      }}
                                    >
                                      <Card
                                        suit={cardData.suit}
                                        rank={cardData.rank}
                                        color={cardData.color}
                                        size="small"
                                        animationDelay={i * 0.3}
                                        theme={theme}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Opponent Cards (seat 4 when showdown) - Larger, more spread, more tilted */}
                          {!isMe && seatNum === 4 && showOpponentCards && opponentCards && opponentCards.length > 0 && (
                            <div className="absolute" style={{ top: '-60px', left: '50%', transform: 'translateX(-50%)', zIndex: 0 }}>
                              <div className="relative" style={{ width: '110px', height: '80px' }}>
                                {opponentCards.map((card, i) => {
                                  const cardData = cardToString(card);
                                  // Cards: larger, more spread, more tilted
                                  const rotation = i === 0 ? -15 : 15; // More tilt (was -12/12)
                                  const xOffset = i === 0 ? -24 : 24; // More spread (was -20/20)
                                  
                                  return (
                                    <div 
                                      key={i}
                                      className="absolute"
                                      style={{ 
                                        left: '50%',
                                        top: '0',
                                        transform: `translateX(calc(-50% + ${xOffset}px)) rotate(${rotation}deg) scale(1.15)`,
                                        zIndex: 0,
                                        transition: 'transform 0.3s ease'
                                      }}
                                    >
                                      <Card
                                        suit={cardData.suit}
                                        rank={cardData.rank}
                                        color={cardData.color}
                                        size="small"
                                        animationDelay={i * 0.3}
                                        showFlipAnimation={true}
                                        theme={theme}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* AVATAR circle - Even Larger with Hover Tooltip */}
                          <div 
                            className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-4xl shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 ${
                              currentPlayer === seatNum && !timerState
                                ? 'border-2 border-cyan-400'
                                : 'border-2 border-amber-500/50'
                            }`} 
                            style={{ 
                              zIndex: 10,
                              ...(currentPlayer === seatNum ? {
                                boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.4)',
                                animation: 'activePlayerGlow 2s ease-in-out infinite'
                              } : {})
                            }}
                            onMouseEnter={() => setHoveredSeat(seatNum)}
                            onMouseLeave={() => setHoveredSeat(null)}
                          >
                            {isMe && myAvatar && myAvatar.startsWith('IMG:') ? (
                              <img
                                src={`/avatars/${myAvatar.replace('IMG:', '')}.png`}
                                alt="avatar"
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span>{isMe ? myAvatar : (player.avatar || '🎮')}</span>
                            )}
                            
                            {/* Timer border - wraps around avatar as a colored ring */}
                            {isMe && currentPlayer === seatNum && timerState && (
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
                                  name: player.name || 'Opponent',
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
                                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r ${colors.bg} rounded-full w-10 h-10 flex items-center justify-center text-white text-sm font-black border-3 ${colors.border} shadow-lg`}
                                  style={{
                                    boxShadow: `0 0 15px ${colors.glow}, 0 0 25px ${colors.glow}`
                                  }}
                                  title={`Level ${levelInfo.level} - ${levelInfo.progressPercent}% to next level`}
                                >
                                  {levelInfo.level}
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* 3. NAME - Overlaps avatar bottom slightly */}
                          <div className="bg-slate-900/90 backdrop-blur-sm px-4 py-1.5 rounded-lg border border-slate-700 min-w-[120px] text-center -mt-2" style={{ zIndex: 11 }}>
                            <div className="text-slate-200 font-semibold text-base truncate">
                              {isMe ? (playerAlias || 'You') : player.name || 'Opponent'}
                            </div>
                          </div>
                          
                          {/* 4. STACK (Money in the bank) */}
                          <div className="bg-slate-900/90 backdrop-blur-sm px-4 py-1.5 rounded-lg border border-amber-500/40 min-w-[120px] text-center">
                            <div className="text-amber-400 font-bold text-sm">
                              <AnimatedNumber value={player.stack || 0} duration={0.3} separator="," /> SHIDO
                            </div>
                          </div>
                          
                          {/* 5. LAST ACTION - Shows recent action with color coding (below stack) */}
                          {player.lastAction && (
                            <div className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                              player.lastAction.type === 'raise' || player.lastAction.type === 'bet' 
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
                                : player.lastAction.type === 'call' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                                : player.lastAction.type === 'fold' 
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                : player.lastAction.type === 'allin'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)] animate-pulse'
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
                            : 'cursor-pointer hover:scale-110'
                        }`}
                        onClick={() => {
                          if (mySeat > 0 && mySeat !== seatNum) {
                            return; // Already seated elsewhere
                          }
                          onSitAtSeat && onSitAtSeat(seatNum);
                        }}
                      >
                        <div className={`w-24 h-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                          mySeat > 0 && mySeat !== seatNum
                            ? 'border-white/10 bg-white/5'
                            : 'border-amber-500/40 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-400/20 hover:shadow-lg hover:shadow-amber-500/30'
                        }`}>
                          <span className={`text-xs font-semibold ${
                            mySeat > 0 && mySeat !== seatNum ? 'text-white/20' : 'text-amber-400/70 group-hover:text-amber-300'
                          }`}>SEAT {seatNum}</span>
                          <span className={`text-[10px] ${
                            mySeat > 0 && mySeat !== seatNum ? 'text-white/15' : 'text-amber-400/50'
                          }`}>EMPTY</span>
                        </div>
                        {mySeat === 0 && (
                          <div className="bg-amber-500/20 backdrop-blur-sm px-3 py-1 rounded-lg border border-amber-500/40 hover:bg-amber-500/30 hover:border-amber-400 transition-all">
                            <span className="text-amber-300 font-semibold text-xs">JOIN</span>
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

export default RealisticTable;
