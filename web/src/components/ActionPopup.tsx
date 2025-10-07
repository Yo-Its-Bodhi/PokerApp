/**
 * ACTION POPUP COMPONENT
 * 
 * Shows the last action taken in a small popup near the table.
 * Auto-fades after 3 seconds.
 */

import React, { useEffect, useState } from 'react';

interface ActionPopupProps {
  playerName: string;
  action: string;
  amount?: number;
  visible: boolean;
}

const ActionPopup: React.FC<ActionPopupProps> = ({ playerName, action, amount, visible }) => {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
  }, [visible]);

  if (!show) return null;

  // Action color coding
  const actionColors: { [key: string]: string } = {
    'fold': 'text-red-400 border-red-500/70 bg-red-500/10',
    'check': 'text-blue-400 border-blue-500/70 bg-blue-500/10',
    'call': 'text-green-400 border-green-500/70 bg-green-500/10',
    'bet': 'text-yellow-400 border-yellow-500/70 bg-yellow-500/10',
    'raise': 'text-orange-400 border-orange-500/70 bg-orange-500/10',
    'allin': 'text-purple-400 border-purple-500/70 bg-purple-500/10',
  };

  const actionLower = action.toLowerCase();
  const colorClass = actionColors[actionLower] || 'text-brand-cyan border-brand-cyan/70 bg-brand-cyan/10';

  return (
    <div className={`absolute top-4 right-4 z-50 glass-card px-4 py-3 border-2 ${colorClass} animate-fade-in shadow-[0_0_20px_rgba(0,255,255,0.3)] backdrop-blur-md`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-brand-gold">{playerName}</span>
        <span className="text-lg font-black">→</span>
        <span className={`text-sm font-black uppercase tracking-wider ${actionLower === 'fold' ? 'text-red-400' : actionLower === 'raise' || actionLower === 'allin' ? 'text-orange-400' : 'text-brand-electric'}`}>
          {action}
        </span>
        {amount && amount > 0 && (
          <span className="text-sm font-bold text-brand-gold ml-1">
            {amount.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActionPopup;
