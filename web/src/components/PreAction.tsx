/**
 * PRE-ACTION COMPONENT
 * 
 * Allows players to queue actions before it's their turn
 */

import React from 'react';

interface PreActionProps {
  onSetPreAction: (action: string, amount?: number) => void;
  currentBet: number;
  playerChips: number;
  disabled?: boolean;
}

const PreAction: React.FC<PreActionProps> = ({
  onSetPreAction,
  currentBet,
  playerChips,
  disabled = false
}) => {
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null);
  const [raiseAmount, setRaiseAmount] = React.useState(currentBet * 2);

  const actions = [
    {
      id: 'fold_to_any',
      label: 'Fold to Any Bet',
      enabled: true,
      color: 'red'
    },
    {
      id: 'check_fold',
      label: 'Check / Fold',
      enabled: currentBet > 0,
      color: 'orange'
    },
    {
      id: 'call',
      label: `Call ${currentBet.toLocaleString()}`,
      enabled: currentBet > 0 && currentBet <= playerChips,
      color: 'cyan'
    },
    {
      id: 'raise',
      label: 'Raise to:',
      enabled: playerChips > currentBet * 2,
      color: 'green'
    }
  ];

  const handleActionClick = (actionId: string) => {
    if (selectedAction === actionId) {
      // Deselect
      setSelectedAction(null);
      onSetPreAction('clear');
    } else {
      // Select
      setSelectedAction(actionId);
      if (actionId === 'raise') {
        onSetPreAction(actionId, raiseAmount);
      } else {
        onSetPreAction(actionId);
      }
    }
  };

  const handleRaiseAmountChange = (amount: number) => {
    setRaiseAmount(amount);
    if (selectedAction === 'raise') {
      onSetPreAction('raise', amount);
    }
  };

  if (disabled) return null;

  return (
    <div className="glass-card p-4 border border-brand-cyan/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></div>
        <h4 className="text-sm font-bold text-brand-cyan uppercase tracking-wide">
          Pre-Action Queue
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <div key={action.id} className="flex flex-col gap-1">
            <button
              onClick={() => handleActionClick(action.id)}
              disabled={!action.enabled}
              className={`
                text-xs py-2 px-3 rounded transition-all duration-200 font-semibold
                ${!action.enabled ? 'opacity-30 cursor-not-allowed bg-gray-800' : ''}
                ${selectedAction === action.id 
                  ? `ring-2 ring-${action.color}-500 bg-${action.color}-500/30 shadow-lg` 
                  : `bg-${action.color}-900/20 hover:bg-${action.color}-500/20`
                }
              `}
              style={{
                backgroundColor: !action.enabled 
                  ? '#1a1a2e' 
                  : selectedAction === action.id
                    ? action.color === 'red' ? 'rgba(239, 68, 68, 0.3)' :
                      action.color === 'orange' ? 'rgba(249, 115, 22, 0.3)' :
                      action.color === 'cyan' ? 'rgba(6, 182, 212, 0.3)' :
                      'rgba(34, 197, 94, 0.3)'
                    : action.color === 'red' ? 'rgba(127, 29, 29, 0.2)' :
                      action.color === 'orange' ? 'rgba(124, 45, 18, 0.2)' :
                      action.color === 'cyan' ? 'rgba(21, 94, 117, 0.2)' :
                      'rgba(20, 83, 45, 0.2)',
                borderColor: selectedAction === action.id
                  ? action.color === 'red' ? '#ef4444' :
                    action.color === 'orange' ? '#f97316' :
                    action.color === 'cyan' ? '#06b6d4' :
                    '#22c55e'
                  : 'transparent',
                borderWidth: selectedAction === action.id ? '2px' : '1px'
              }}
            >
              {selectedAction === action.id && (
                <span className="mr-1">✓</span>
              )}
              {action.label}
            </button>

            {action.id === 'raise' && selectedAction === 'raise' && (
              <input
                type="number"
                value={raiseAmount}
                onChange={(e) => handleRaiseAmountChange(Number(e.target.value))}
                min={currentBet * 2}
                max={playerChips}
                step={1000}
                className="text-xs bg-brand-surface border border-green-500/50 rounded px-2 py-1 text-white focus:outline-none focus:border-green-500"
              />
            )}
          </div>
        ))}
      </div>

      {selectedAction && (
        <div className="mt-3 p-2 bg-brand-cyan/10 border border-brand-cyan/30 rounded">
          <p className="text-xs text-brand-cyan">
            <span className="animate-pulse">⚡</span> Action queued: Will execute when it's your turn
          </p>
        </div>
      )}
    </div>
  );
};

export default PreAction;
