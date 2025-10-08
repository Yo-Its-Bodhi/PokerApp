import React, { useState } from 'react';
import { Hand } from 'pokersolver';

interface HandStrengthProps {
  myCards: number[];
  communityCards: number[];
}

const HandStrength: React.FC<HandStrengthProps> = ({ myCards, communityCards }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Don't show if no cards
  if (!myCards || myCards.length === 0) {
    return null;
  }

  // Convert card numbers to pokersolver format
  const cardsToPokersolverFormat = (cardNumbers: number[]): string[] => {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
    
    return cardNumbers.map(num => {
      const rank = ranks[num % 13];
      const suit = suits[Math.floor(num / 13)];
      return rank + suit;
    });
  };

  let handDescription = 'High Card';
  let handRank = 0;
  let showDescription = false;

  try {
    // Combine hole cards with community cards
    const allCards = myCards.concat(communityCards);
    
    // Need at least 2 cards to evaluate
    if (allCards.length >= 2) {
      const formattedCards = cardsToPokersolverFormat(allCards);
      const handResult = Hand.solve(formattedCards);
      handDescription = handResult.descr;
      handRank = handResult.rank;
      showDescription = true;
    }
  } catch (error) {
    console.error('Error evaluating hand:', error);
    return null;
  }

  if (!showDescription) {
    return null;
  }

  // Get color based on hand strength
  const getHandColor = () => {
    if (handRank >= 8) return 'from-purple-500 to-pink-500'; // Royal Flush, Straight Flush
    if (handRank >= 7) return 'from-blue-500 to-cyan-500'; // Four of a Kind
    if (handRank >= 6) return 'from-green-500 to-emerald-500'; // Full House
    if (handRank >= 5) return 'from-yellow-500 to-orange-500'; // Flush
    if (handRank >= 4) return 'from-amber-500 to-yellow-500'; // Straight
    if (handRank >= 3) return 'from-rose-500 to-red-500'; // Three of a Kind
    if (handRank >= 2) return 'from-indigo-500 to-blue-500'; // Two Pair
    if (handRank >= 1) return 'from-slate-500 to-gray-500'; // Pair
    return 'from-slate-600 to-gray-700'; // High Card
  };

  // Get emoji based on hand strength
  const getHandEmoji = () => {
    if (handRank >= 8) return '👑'; // Royal/Straight Flush
    if (handRank >= 7) return '💎'; // Four of a Kind
    if (handRank >= 6) return '🏠'; // Full House
    if (handRank >= 5) return '🌊'; // Flush
    if (handRank >= 4) return '📏'; // Straight
    if (handRank >= 3) return '🎯'; // Three of a Kind
    if (handRank >= 2) return '👥'; // Two Pair
    if (handRank >= 1) return '👫'; // Pair
    return '🎴'; // High Card
  };

  return (
    <div 
      className="backdrop-blur-sm p-3 rounded-lg transition-all relative cursor-help"
      style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.2))',
        border: '2px solid rgba(6, 182, 212, 0.6)',
        boxShadow: '0 0 15px rgba(6, 182, 212, 0.4), inset 0 0 15px rgba(6, 182, 212, 0.1)'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getHandEmoji()}</span>
        <div>
          <div 
            className="text-xs uppercase tracking-widest font-black mb-1"
            style={{
              color: 'rgba(6, 182, 212, 0.9)',
              textShadow: '0 0 8px rgba(6, 182, 212, 0.8)'
            }}
          >
            YOUR HAND
          </div>
          <div 
            className="font-bold text-sm text-white"
            style={{
              textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
            }}
          >
            {handDescription}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div 
          className="absolute left-0 bottom-full mb-2 w-80 backdrop-blur-md rounded-lg p-4 z-50 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(15, 23, 42, 0.95))',
            border: '2px solid rgba(6, 182, 212, 0.5)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.5), inset 0 0 20px rgba(6, 182, 212, 0.1)'
          }}
        >
          <div className="text-cyan-400 font-bold text-sm mb-3 uppercase tracking-wide">
            📊 Hand Rankings (Best to Worst)
          </div>
          
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-bold">👑 Royal/Straight Flush</span>
              <span className="text-purple-300/70 text-[10px]">(Purple/Pink)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold">💎 Four of a Kind</span>
              <span className="text-blue-300/70 text-[10px]">(Blue/Cyan)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-bold">🏠 Full House</span>
              <span className="text-green-300/70 text-[10px]">(Green)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold">🌊 Flush</span>
              <span className="text-yellow-300/70 text-[10px]">(Yellow/Orange)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">📏 Straight</span>
              <span className="text-amber-300/70 text-[10px]">(Amber)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-rose-400 font-bold">🎯 Three of a Kind</span>
              <span className="text-rose-300/70 text-[10px]">(Rose/Red)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">👥 Two Pair</span>
              <span className="text-indigo-300/70 text-[10px]">(Indigo)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">👫 Pair</span>
              <span className="text-slate-300/70 text-[10px]">(Slate/Gray)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">🎴 High Card</span>
              <span className="text-slate-400/70 text-[10px]">(Dark Gray)</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-cyan-500/30">
            <div className="text-cyan-300 text-[10px] italic">
              💡 Color indicates your hand strength
            </div>
          </div>

          {/* Arrow pointer */}
          <div 
            className="absolute left-4 top-full w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid rgba(6, 182, 212, 0.5)'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HandStrength;
