// EXAMPLE: How to integrate betting animations into App.tsx

import React, { useState } from 'react';
import ChipAnimation from './components/ChipAnimation';
import ActionBox from './components/ActionBox';
import Table from './components/Table';

function App() {
  // Existing states...
  const [players, setPlayers] = useState([]);
  const [pot, setPot] = useState(0);
  
  // NEW: Animation states
  const [activeChipAnimation, setActiveChipAnimation] = useState<any>(null);
  const [activeActionBox, setActiveActionBox] = useState<any>(null);
  const [playerLastActions, setPlayerLastActions] = useState<Record<number, string>>({});

  // NEW: Handle player actions with animations
  const handlePlayerAction = (seat: number, action: string, amount: number = 0) => {
    const player = players.find(p => p.seat === seat);
    
    // Show action box
    setActiveActionBox({
      action: action,
      amount: amount,
      playerName: player?.name || `Player ${seat}`,
      seat: seat
    });

    // Animate chips if betting/calling/raising
    if (amount > 0 && ['call', 'raise', 'allin'].includes(action)) {
      setActiveChipAnimation({
        amount: amount,
        fromSeat: seat,
        isAllIn: action === 'allin'
      });
    }

    // Update player's last action for border glow
    setPlayerLastActions(prev => ({
      ...prev,
      [seat]: action
    }));

    // Process the actual game logic
    processGameAction(seat, action, amount);
  };

  // Example: Demo mode action
  const triggerDemoAction = () => {
    // Simulate player 3 raising 50k
    handlePlayerAction(3, 'raise', 50000);
  };

  // Example: Demo all-in
  const triggerDemoAllIn = () => {
    // Simulate player 5 going all-in with 250k
    handlePlayerAction(5, 'allin', 250000);
  };

  return (
    <div className="app-container">
      {/* Main table with enhanced pot */}
      <Table
        players={players.map(p => ({
          ...p,
          lastAction: playerLastActions[p.seat] || 'inactive'
        }))}
        pot={pot}
        communityCards={communityCards}
        currentPlayer={currentPlayer}
        mySeat={mySeat}
        myCards={myCards}
        playerAlias={playerAlias}
        myAvatar={myAvatar}
        timerState={timerState}
        onAction={handlePlayerAction}
        onStandUp={handleStandUp}
        onSitAtSeat={handleSitAtSeat}
        onRequestTimeBank={handleRequestTimeBank}
      />

      {/* Chip animation overlay */}
      {activeChipAnimation && (
        <ChipAnimation
          amount={activeChipAnimation.amount}
          fromSeat={activeChipAnimation.fromSeat}
          isAllIn={activeChipAnimation.isAllIn}
          onComplete={() => {
            setActiveChipAnimation(null);
            // Optional: play sound effect
            // playSound('chip-arrive');
          }}
        />
      )}

      {/* Action box overlay */}
      {activeActionBox && (
        <ActionBox
          action={activeActionBox.action}
          amount={activeActionBox.amount}
          playerName={activeActionBox.playerName}
          seat={activeActionBox.seat}
          onComplete={() => {
            setActiveActionBox(null);
          }}
        />
      )}

      {/* Demo buttons (for testing) */}
      <div className="fixed bottom-4 right-4 flex gap-2 z-50">
        <button 
          onClick={triggerDemoAction}
          className="btn btn-primary"
        >
          Demo Raise
        </button>
        <button 
          onClick={triggerDemoAllIn}
          className="btn bg-red-500"
        >
          Demo All-In
        </button>
      </div>
    </div>
  );
}

// ============================================
// SOCKET INTEGRATION EXAMPLE
// ============================================

// Listen for actions from server
socket.on('player-action', (data) => {
  const { seat, action, amount } = data;
  handlePlayerAction(seat, action, amount);
});

// Send action to server
const sendAction = (action: string, amount: number = 0) => {
  socket.emit('action', { 
    seat: mySeat, 
    action, 
    amount 
  });
  
  // Trigger local animation immediately for responsiveness
  handlePlayerAction(mySeat, action, amount);
};

// ============================================
// POKER ENGINE INTEGRATION EXAMPLE
// ============================================

const processGameAction = (seat: number, action: string, amount: number) => {
  // Update player stack
  setPlayers(prev => prev.map(p => {
    if (p.seat === seat) {
      return {
        ...p,
        stack: p.stack - amount,
        bet: p.bet + amount
      };
    }
    return p;
  }));

  // Update pot
  setPot(prev => prev + amount);

  // Continue to next player
  advanceToNextPlayer();
};

// ============================================
// CLEAR ANIMATIONS ON NEW HAND
// ============================================

const startNewHand = () => {
  // Clear all animations
  setActiveChipAnimation(null);
  setActiveActionBox(null);
  setPlayerLastActions({});
  
  // Reset game state
  setPot(0);
  setCommunityCards([]);
  // ... other resets
};

export default App;
