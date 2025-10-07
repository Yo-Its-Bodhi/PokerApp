/**
 * SHOW/MUCK BUTTONS COMPONENT
 * 
 * Provides Show and Muck options at showdown based on poker rules:
 * - Must show: All-in called, last aggressor on river bet
 * - Can muck: River checked through, opponent showed winner
 */

import React from 'react';

interface ShowMuckButtonsProps {
  mustShow: boolean;
  canMuck: boolean;
  onShow: () => void;
  onMuck: () => void;
}

const ShowMuckButtons: React.FC<ShowMuckButtonsProps> = ({ mustShow, canMuck, onShow, onMuck }) => {
  if (mustShow) {
    // Only show button (no muck option)
    return (
      <div className="glass-card p-4 border-2 border-yellow-500/70 bg-yellow-500/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⚠️</span>
          <p className="text-yellow-400 text-sm font-bold">You must show your hand</p>
        </div>
        <button 
          className="btn bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-black w-full py-3 shadow-lg"
          onClick={onShow}
        >
          🃏 SHOW CARDS
        </button>
        <p className="text-xs text-yellow-300/60 mt-2 text-center">
          All-in or last aggressor - mandatory reveal
        </p>
      </div>
    );
  }

  if (canMuck) {
    // Both options
    return (
      <div className="glass-card p-4 border-2 border-brand-cyan/70 bg-brand-cyan/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🎯</span>
          <p className="text-brand-cyan text-sm font-bold">Showdown - Your Choice</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black flex-1 py-3 shadow-lg"
            onClick={onShow}
          >
            🃏 SHOW
          </button>
          <button 
            className="btn bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black flex-1 py-3 shadow-lg"
            onClick={onMuck}
          >
            🚫 MUCK
          </button>
        </div>
        <p className="text-xs text-brand-text-dark mt-2 text-center">
          Show to claim pot, or muck to concede
        </p>
      </div>
    );
  }

  return null;
};

export default ShowMuckButtons;
