import React, { useState, useEffect } from 'react';
import { playButtonClick, playSliderTick } from '../utils/audioSystem';

interface ActionsProps {
  onAction: (action: string, amount?: number) => void;
  onStandUp: () => void;
  onRebuy?: (amount?: number) => void;
  onShowMuck?: (showCards: boolean) => void;
  currentBet?: number;
  playerStack?: number;
  myBet?: number;
  isMyTurn?: boolean;
  currentPlayer?: number;
  mySeat?: number;
  awaitingShowMuckDecision?: boolean;
  autoFold?: boolean;
  autoCheck?: boolean;
  onAutoFoldChange?: (value: boolean) => void;
  onAutoCheckChange?: (value: boolean) => void;
  isOverlay?: boolean;
  sitOutNextHand?: boolean;
  onSitOutToggle?: () => void;
}

const Actions: React.FC<ActionsProps> = ({ 
  onAction, 
  onStandUp,
  onRebuy,
  onShowMuck,
  currentBet = 0, 
  playerStack = 100000, 
  myBet = 0,
  isMyTurn = true,
  currentPlayer,
  mySeat,
  awaitingShowMuckDecision = false,
  autoFold = false,
  autoCheck = false,
  onAutoFoldChange,
  onAutoCheckChange,
  isOverlay = false,
  sitOutNextHand = false,
  onSitOutToggle
}) => {
  const maxBet = Math.min(100000, playerStack);
  const [raiseAmount, setRaiseAmount] = useState(Math.min(20000, maxBet));

  const callAmount = currentBet - myBet;
  const minRaise = currentBet * 2;
  const isAllIn = playerStack === 0;

  const [lastTickValue, setLastTickValue] = useState(raiseAmount);

  const handleRaiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setRaiseAmount(newValue);
    
    if (Math.abs(newValue - lastTickValue) >= 5000) {
      playSliderTick();
      setLastTickValue(newValue);
    }
  };

  const isBusted = playerStack === 0 && myBet === 0;

  useEffect(() => {
    if (awaitingShowMuckDecision && onShowMuck) {
      const timeout = setTimeout(() => {
        onShowMuck(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [awaitingShowMuckDecision, onShowMuck]);
  // Neon Underground Overlay Mode - Cyberpunk button layout at bottom of table
  if (isOverlay) {
    return (
      <div 
        className="flex items-center gap-3 px-6 py-3 backdrop-blur-md rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.9) 100%)',
          border: '2px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)'
        }}
      >
        {awaitingShowMuckDecision && onShowMuck ? (
          <>
            <button
              onClick={() => { playButtonClick(); onShowMuck(true); }}
              className="px-6 py-3 bg-green-500/80 hover:bg-green-400/90 backdrop-blur-sm text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/50 border border-green-400/30 hover:border-green-300/50 text-sm uppercase tracking-wider hover:scale-105"
            >
              SHOW
            </button>
            <button
              onClick={() => { playButtonClick(); onShowMuck(false); }}
              className="px-6 py-3 bg-red-500/80 hover:bg-red-400/90 backdrop-blur-sm text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/50 border border-red-400/30 hover:border-red-300/50 text-sm uppercase tracking-wider hover:scale-105"
            >
              MUCK
            </button>
          </>
        ) : isBusted && onRebuy ? (
          <>
            <button
              onClick={() => onRebuy(100000)}
              className="px-6 py-3 bg-green-500/80 hover:bg-green-400/90 backdrop-blur-sm text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/50 border border-green-400/30 hover:border-green-300/50 text-sm uppercase tracking-wider hover:scale-105"
            >
              ADD 100K
            </button>
            <button
              onClick={onStandUp}
              className="px-6 py-3 bg-slate-600/80 hover:bg-slate-500/90 backdrop-blur-sm text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-slate-500/50 border border-slate-500/30 hover:border-slate-400/50 text-sm uppercase tracking-wider hover:scale-105"
            >
              LEAVE
            </button>
          </>
        ) : (
          <>
            {/* FOLD */}
            <button
              onClick={() => { playButtonClick(); onAction('fold'); }}
              disabled={!isMyTurn}
              className={`px-4 py-2 rounded-lg font-bold transition-all text-sm uppercase tracking-wider hover:scale-105 ${
                !isMyTurn
                  ? 'bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50 backdrop-blur-sm border border-slate-600/30'
                  : 'backdrop-blur-sm text-white font-black tracking-widest'
              }`}
              style={isMyTurn ? {
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                border: '2px solid rgba(239, 68, 68, 0.6)',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.4), inset 0 0 15px rgba(239, 68, 68, 0.1)',
                textShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
              } : {}}
              onMouseEnter={isMyTurn ? (e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3))';
                e.currentTarget.style.border = '2px solid rgba(239, 68, 68, 1)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.2)';
              } : undefined}
              onMouseLeave={isMyTurn ? (e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))';
                e.currentTarget.style.border = '2px solid rgba(239, 68, 68, 0.6)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4), inset 0 0 15px rgba(239, 68, 68, 0.1)';
              } : undefined}
            >
              FOLD
            </button>

            {/* CHECK/CALL */}
            <button
              onClick={() => { playButtonClick(); onAction(callAmount > 0 ? 'call' : 'check', callAmount); }}
              disabled={!isMyTurn || isAllIn}
              className={`px-4 py-2 rounded-lg font-bold transition-all text-sm uppercase tracking-wider hover:scale-105 ${
                !isMyTurn || isAllIn
                  ? 'bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50 backdrop-blur-sm border border-slate-600/30'
                  : 'backdrop-blur-sm text-white font-black tracking-widest'
              }`}
              style={(isMyTurn && !isAllIn) ? {
                background: callAmount > 0 
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.2))'
                  : 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
                border: callAmount > 0 
                  ? '2px solid rgba(6, 182, 212, 0.6)'
                  : '2px solid rgba(34, 197, 94, 0.6)',
                boxShadow: callAmount > 0
                  ? '0 0 15px rgba(6, 182, 212, 0.4), inset 0 0 15px rgba(6, 182, 212, 0.1)'
                  : '0 0 15px rgba(34, 197, 94, 0.4), inset 0 0 15px rgba(34, 197, 94, 0.1)',
                textShadow: callAmount > 0
                  ? '0 0 8px rgba(6, 182, 212, 0.8)'
                  : '0 0 8px rgba(34, 197, 94, 0.8)'
              } : {}}
              onMouseEnter={(isMyTurn && !isAllIn) ? (e) => {
                const isCall = callAmount > 0;
                e.currentTarget.style.background = isCall 
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(14, 165, 233, 0.3))'
                  : 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3))';
                e.currentTarget.style.border = isCall 
                  ? '2px solid rgba(6, 182, 212, 1)'
                  : '2px solid rgba(34, 197, 94, 1)';
                e.currentTarget.style.boxShadow = isCall
                  ? '0 0 25px rgba(6, 182, 212, 0.6), inset 0 0 20px rgba(6, 182, 212, 0.2)'
                  : '0 0 25px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(34, 197, 94, 0.2)';
              } : undefined}
              onMouseLeave={(isMyTurn && !isAllIn) ? (e) => {
                const isCall = callAmount > 0;
                e.currentTarget.style.background = isCall 
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.2))'
                  : 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))';
                e.currentTarget.style.border = isCall 
                  ? '2px solid rgba(6, 182, 212, 0.6)'
                  : '2px solid rgba(34, 197, 94, 0.6)';
                e.currentTarget.style.boxShadow = isCall
                  ? '0 0 15px rgba(6, 182, 212, 0.4), inset 0 0 15px rgba(6, 182, 212, 0.1)'
                  : '0 0 15px rgba(34, 197, 94, 0.4), inset 0 0 15px rgba(34, 197, 94, 0.1)';
              } : undefined}
            >
              {callAmount > 0 ? `CALL $${callAmount}` : 'CHECK'}
            </button>

            {/* BET/RAISE with slider */}
            <div className="flex items-center gap-2">
              <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10 min-w-[140px]">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span>{currentBet === 0 ? 'Bet' : 'Raise'}</span>
                  <span className="font-bold">${raiseAmount}</span>
                </div>
                <input
                  type="range"
                  min={minRaise}
                  max={maxBet}
                  step={1000}
                  value={raiseAmount}
                  onChange={handleRaiseChange}
                  disabled={!isMyTurn}
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: isMyTurn 
                      ? `linear-gradient(to right, ${currentBet === 0 ? '#3b82f6' : '#06b6d4'} 0%, ${currentBet === 0 ? '#3b82f6' : '#06b6d4'} ${((raiseAmount - minRaise) / (maxBet - minRaise)) * 100}%, rgba(255,255,255,0.2) ${((raiseAmount - minRaise) / (maxBet - minRaise)) * 100}%, rgba(255,255,255,0.2) 100%)`
                      : 'rgba(255,255,255,0.1)'
                  }}
                />
              </div>
              <button
                onClick={() => { playButtonClick(); onAction(currentBet === 0 ? 'bet' : 'raise', raiseAmount); }}
                disabled={!isMyTurn || raiseAmount < minRaise || raiseAmount > maxBet || isAllIn}
                className={`px-4 py-2 rounded-lg font-bold transition-all text-sm uppercase tracking-wider hover:scale-105 ${
                  !isMyTurn || raiseAmount < minRaise || raiseAmount > maxBet || isAllIn
                    ? 'bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50 backdrop-blur-sm border border-slate-600/30'
                    : currentBet === 0
                      ? 'bg-blue-500/80 hover:bg-blue-400/90 backdrop-blur-sm text-white shadow-lg hover:shadow-blue-500/50 border border-blue-400/30 hover:border-blue-300/50'
                      : 'bg-green-500/80 hover:bg-green-400/90 backdrop-blur-sm text-white shadow-lg hover:shadow-green-500/50 border border-green-400/30 hover:border-green-300/50'
                }`}
              >
                {currentBet === 0 ? 'BET' : 'RAISE'}
              </button>
            </div>

            {/* ALL IN */}
            <button
              onClick={() => { playButtonClick(); onAction('raise', playerStack); }}
              disabled={!isMyTurn || isAllIn}
              className={`px-4 py-2 rounded-lg font-bold transition-all text-sm uppercase tracking-wider hover:scale-105 ${
                !isMyTurn || isAllIn
                  ? 'bg-slate-700/30 text-slate-400 cursor-not-allowed opacity-50 backdrop-blur-sm border border-slate-600/30'
                  : 'bg-orange-500/80 hover:bg-orange-400/90 backdrop-blur-sm text-white shadow-lg hover:shadow-orange-500/50 border border-orange-400/30 hover:border-orange-300/50'
              }`}
            >
              ALL IN
            </button>

            {/* AUTO-ACTIONS & SIT OUT */}
            <div className="flex flex-col gap-1.5 ml-4">
              {onAutoFoldChange && (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={autoFold}
                    onChange={(e) => onAutoFoldChange(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-cyan-400/50 bg-slate-800/50 checked:bg-cyan-500 checked:border-cyan-400 cursor-pointer transition-all"
                  />
                  <span className="text-xs text-cyan-300 group-hover:text-cyan-200 transition-colors font-medium uppercase tracking-wide">
                    Auto-Fold
                  </span>
                </label>
              )}
              {onAutoCheckChange && (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={autoCheck}
                    onChange={(e) => onAutoCheckChange(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-cyan-400/50 bg-slate-800/50 checked:bg-cyan-500 checked:border-cyan-400 cursor-pointer transition-all"
                  />
                  <span className="text-xs text-cyan-300 group-hover:text-cyan-200 transition-colors font-medium uppercase tracking-wide">
                    Auto-Check
                  </span>
                </label>
              )}
              
              {/* Sit Out Next Hand Toggle */}
              {onSitOutToggle && (
                <label className="flex items-center gap-2 cursor-pointer group mt-1">
                  <input
                    type="checkbox"
                    checked={sitOutNextHand}
                    onChange={() => { playButtonClick(); onSitOutToggle(); }}
                    className="w-4 h-4 rounded border-2 border-slate-400/50 bg-slate-800/50 checked:bg-slate-500 checked:border-slate-400 cursor-pointer transition-all"
                  />
                  <span className={`text-xs transition-colors font-medium uppercase tracking-wide ${
                    sitOutNextHand ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300'
                  }`}>
                    {sitOutNextHand ? '⏸️ Sitting Out' : 'Sit Out'}
                  </span>
                </label>
              )}
            </div>

          </>
        )}
      </div>
    );
  }

  // Original Panel Mode
  return (
    <div className="glass-card p-4 flex flex-col h-full">
      {awaitingShowMuckDecision && onShowMuck && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50">
            <p className="text-purple-300 text-center font-bold text-lg mb-1">
              You Folded
            </p>
            <p className="text-slate-300 text-center text-sm">
              Do you want to show your cards or muck them?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { playButtonClick(); onShowMuck(true); }}
              className="px-4 py-3 bg-gradient-to-br from-green-500/90 via-emerald-500/90 to-green-600/90 hover:from-green-400 hover:via-emerald-400 hover:to-green-500 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-green-500/50 border border-green-400/30 hover:border-green-300/50 text-sm uppercase tracking-wider"
            >
              SHOW
            </button>
            
            <button
              onClick={() => { playButtonClick(); onShowMuck(false); }}
              className="px-4 py-3 bg-gradient-to-br from-red-500/90 via-orange-500/90 to-red-600/90 hover:from-red-400 hover:via-orange-400 hover:to-red-500 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-red-500/50 border border-red-400/30 hover:border-red-300/50 text-sm uppercase tracking-wider"
            >
              MUCK
            </button>
          </div>

          <p className="text-slate-400 text-xs text-center">
            Showing your cards reveals your play style. Mucking keeps them hidden.
          </p>
        </div>
      )}

      {!awaitingShowMuckDecision && isBusted && onRebuy && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/50">
            <p className="text-red-300 text-center font-bold text-lg mb-1">
              BUSTED!
            </p>
            <p className="text-slate-300 text-center text-sm">
              You're out of chips. Add more to continue playing!
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onRebuy(100000)}
              className="w-full px-4 py-3 bg-gradient-to-br from-green-500/90 via-emerald-500/90 to-green-600/90 hover:from-green-400 hover:via-emerald-400 hover:to-green-500 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-green-500/50 border border-green-400/30 hover:border-green-300/50 text-sm uppercase tracking-wider"
            >
              ADD 100,000 SHIDO
            </button>
            
            <button
              onClick={() => onRebuy(250000)}
              className="w-full px-4 py-3 bg-gradient-to-br from-blue-500/90 via-cyan-500/90 to-blue-600/90 hover:from-blue-400 hover:via-cyan-400 hover:to-blue-500 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/50 border border-blue-400/30 hover:border-blue-300/50 text-sm uppercase tracking-wider"
            >
              ADD 250,000 SHIDO
            </button>
            
            <button
              onClick={() => onRebuy(500000)}
              className="w-full px-4 py-3 bg-gradient-to-br from-purple-500/90 via-pink-500/90 to-purple-600/90 hover:from-purple-400 hover:via-pink-400 hover:to-purple-500 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-purple-500/50 border border-purple-400/30 hover:border-purple-300/50 text-sm uppercase tracking-wider"
            >
              ADD 500,000 SHIDO
            </button>
          </div>

          <button
            onClick={onStandUp}
            className="w-full px-4 py-2 bg-gradient-to-br from-slate-700/50 via-slate-800/50 to-slate-700/50 hover:from-slate-600/60 hover:via-slate-700/60 hover:to-slate-600/60 text-slate-300 hover:text-slate-200 rounded-lg font-semibold transition-all shadow-md border border-slate-600/30 hover:border-slate-500/40 text-sm uppercase tracking-wider"
          >
            LEAVE TABLE
          </button>
        </div>
      )}

      {!isBusted && !awaitingShowMuckDecision && (
        <>
          {!isMyTurn && (
            <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50">
              <p className="text-cyan-300 text-sm text-center font-semibold">
                Not your turn
              </p>
            </div>
          )}
          
          {isAllIn && isMyTurn && (
            <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/50">
              <p className="text-red-300 text-sm text-center font-semibold">
                You're ALL-IN! Waiting for opponent...
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => { playButtonClick(); onAction('check'); }}
                disabled={!isMyTurn || callAmount > 0}
                className={`px-3 py-2 rounded-lg font-bold transition-all text-xs uppercase tracking-wider ${
                  !isMyTurn || callAmount > 0
                    ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed opacity-50 border border-slate-600/30'
                    : 'bg-gradient-to-br from-green-500/90 via-emerald-500/90 to-green-600/90 hover:from-green-400 hover:via-emerald-400 hover:to-green-500 text-white shadow-lg hover:shadow-green-500/50 border border-green-400/30 hover:border-green-300/50'
                }`}
              >
                CHECK
              </button>
              <button
                onClick={() => { playButtonClick(); onAction('call', callAmount); }}
                disabled={!isMyTurn || callAmount === 0 || isAllIn}
                className={`px-3 py-2 rounded-lg font-bold transition-all text-xs uppercase tracking-wider ${
                  !isMyTurn || callAmount === 0 || isAllIn
                    ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed opacity-50 border border-slate-600/30'
                    : 'bg-gradient-to-br from-blue-500/90 via-cyan-500/90 to-blue-600/90 hover:from-blue-400 hover:via-cyan-400 hover:to-blue-500 text-white shadow-lg hover:shadow-blue-500/50 border border-blue-400/30 hover:border-blue-300/50'
                }`}
              >
                {callAmount === 0 ? 'CALL' : callAmount > 0 ? `CALL ${callAmount.toLocaleString()}` : 'CALL'}
              </button>
            </div>

            <div className={`space-y-1 ${!isMyTurn ? 'opacity-50' : ''}`}>
              <div className="flex justify-between text-xs">
                <span className="text-cyan-400 font-semibold">Raise:</span>
                <span className="text-white font-bold">{raiseAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={minRaise}
                max={maxBet}
                step={1000}
                value={raiseAmount}
                onChange={handleRaiseChange}
                disabled={!isMyTurn}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                  !isMyTurn ? 'cursor-not-allowed' : ''
                }`}
                style={{
                  background: isMyTurn
                    ? `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((raiseAmount - minRaise) / (maxBet - minRaise)) * 100}%, #1e293b ${((raiseAmount - minRaise) / (maxBet - minRaise)) * 100}%, #1e293b 100%)`
                    : '#475569'
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{minRaise.toLocaleString()}</span>
                <span>{maxBet.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-start">
              <div className="space-y-1.5">
                <button
                  onClick={() => { playButtonClick(); onAction('raise', playerStack); }}
                  disabled={!isMyTurn || isAllIn}
                  className={`w-full px-3 py-2 rounded-lg font-bold transition-all text-xs uppercase tracking-wider ${
                    !isMyTurn || isAllIn
                      ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed opacity-50 border border-slate-600/30'
                      : 'bg-gradient-to-br from-red-500/90 via-rose-500/90 to-red-600/90 hover:from-red-400 hover:via-rose-400 hover:to-red-500 text-white shadow-lg hover:shadow-red-500/50 border border-red-400/30 hover:border-red-300/50'
                  }`}
                >
                  ALL IN
                </button>
                <button
                  onClick={() => { playButtonClick(); onAction('fold'); }}
                  disabled={!isMyTurn}
                  className={`w-full px-3 py-2 rounded-lg font-bold transition-all text-xs uppercase tracking-wider ${
                    !isMyTurn
                      ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed opacity-50 border border-slate-600/30'
                      : 'bg-gradient-to-br from-slate-600/90 via-slate-700/90 to-slate-600/90 hover:from-slate-500 hover:via-slate-600 hover:to-slate-500 text-white shadow-lg hover:shadow-slate-500/50 border border-slate-500/30 hover:border-slate-400/50'
                  }`}
                >
                  FOLD
                </button>
              </div>

              <button
                onClick={() => { playButtonClick(); onAction(currentBet === 0 ? 'bet' : 'raise', raiseAmount); }}
                disabled={!isMyTurn || raiseAmount < minRaise || raiseAmount > maxBet || isAllIn}
                className={`px-3 py-2 rounded-lg font-bold transition-all text-xs uppercase tracking-wider h-full ${
                  !isMyTurn || raiseAmount < minRaise || raiseAmount > maxBet || isAllIn
                    ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed opacity-50 border border-slate-600/30'
                    : 'bg-gradient-to-br from-orange-500/90 via-orange-600/90 to-orange-700/90 hover:from-orange-400 hover:via-orange-500 hover:to-orange-600 text-white shadow-lg hover:shadow-orange-500/50 border border-orange-400/30 hover:border-orange-300/50'
                }`}
              >
                {currentBet === 0 ? 'BET' : 'RAISE'}
              </button>

              {onAutoFoldChange && onAutoCheckChange && (
                <div className="space-y-1.5 p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide">Auto</p>
                  
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={autoFold}
                        onChange={(e) => { playButtonClick(); onAutoFoldChange(e.target.checked); }}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 rounded border-2 border-slate-600 bg-slate-800 peer-checked:bg-red-500 peer-checked:border-red-400 transition-all flex items-center justify-center">
                        {autoFold && <span className="text-white text-[10px] font-bold"></span>}
                      </div>
                    </div>
                    <span className="text-slate-300 text-[10px] group-hover:text-slate-100 transition-colors select-none">
                      Fold
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={autoCheck}
                        onChange={(e) => { playButtonClick(); onAutoCheckChange(e.target.checked); }}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 rounded border-2 border-slate-600 bg-slate-800 peer-checked:bg-blue-500 peer-checked:border-blue-400 transition-all flex items-center justify-center">
                        {autoCheck && <span className="text-white text-[10px] font-bold"></span>}
                      </div>
                    </div>
                    <span className="text-slate-300 text-[10px] group-hover:text-slate-100 transition-colors select-none">
                      Check
                    </span>
                  </label>
                </div>
              )}
            </div>

            <button
              onClick={onStandUp}
              className="w-full px-3 py-1.5 bg-gradient-to-br from-slate-700/50 via-slate-800/50 to-slate-700/50 hover:from-slate-600/60 hover:via-slate-700/60 hover:to-slate-600/60 text-slate-300 hover:text-slate-200 rounded-lg font-semibold transition-all shadow-md border border-slate-600/30 hover:border-slate-500/40 text-xs uppercase tracking-wider"
            >
              STAND UP
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Actions;
