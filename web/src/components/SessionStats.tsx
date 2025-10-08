import React from 'react';

interface SessionStatsProps {
  buyIn: number;
  currentStack: number;
  shidoToUsd?: number; // Exchange rate: 1 SHIDO = X USD
}

const SessionStats: React.FC<SessionStatsProps> = ({ 
  buyIn, 
  currentStack,
  shidoToUsd = 0.00015 // Default rate, can be updated with live price
}) => {
  const profitLoss = currentStack - buyIn;
  const profitLossPercent = buyIn > 0 ? ((profitLoss / buyIn) * 100) : 0;
  const isProfit = profitLoss > 0;
  const isBreakEven = profitLoss === 0;

  // Convert to USD
  const buyInUsd = buyIn * shidoToUsd;
  const currentStackUsd = currentStack * shidoToUsd;
  const profitLossUsd = profitLoss * shidoToUsd;

  return (
    <div 
      className="backdrop-blur-sm rounded-lg p-4 transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
        border: '2px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 0 15px rgba(16, 185, 129, 0.2), inset 0 0 15px rgba(16, 185, 129, 0.05)'
      }}
    >
      <div 
        className="text-xs uppercase tracking-widest font-black mb-3 flex items-center gap-2"
        style={{
          color: 'rgba(16, 185, 129, 0.9)',
          textShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
        }}
      >
        <span>💼</span> Session Stats
      </div>

      <div className="space-y-3">
        {/* Buy-in */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Buy-in:</span>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-200">
              {buyIn.toLocaleString()} SHIDO
            </div>
            <div className="text-[10px] text-slate-500">
              ${buyInUsd.toFixed(2)} USD
            </div>
          </div>
        </div>

        {/* Current Stack */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Current Stack:</span>
          <div className="text-right">
            <div className="text-sm font-bold text-emerald-300">
              {currentStack.toLocaleString()} SHIDO
            </div>
            <div className="text-[10px] text-emerald-500/70">
              ${currentStackUsd.toFixed(2)} USD
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-600/30"></div>

        {/* Profit/Loss */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">P/L:</span>
          <div className="text-right">
            <div 
              className={`text-base font-black ${
                isProfit ? 'text-green-400' : 
                isBreakEven ? 'text-slate-400' : 
                'text-red-400'
              }`}
              style={{
                textShadow: isProfit 
                  ? '0 0 10px rgba(74, 222, 128, 0.5)' 
                  : isBreakEven 
                  ? 'none'
                  : '0 0 10px rgba(248, 113, 113, 0.5)'
              }}
            >
              {isProfit && '+'}{profitLoss.toLocaleString()} SHIDO
            </div>
            <div className={`text-[10px] ${
              isProfit ? 'text-green-500/70' : 
              isBreakEven ? 'text-slate-500' : 
              'text-red-500/70'
            }`}>
              {isProfit && '+'}{isBreakEven ? '±' : ''}{profitLossPercent.toFixed(1)}% • ${Math.abs(profitLossUsd).toFixed(2)} USD
            </div>
          </div>
        </div>
      </div>

      {/* Performance indicator */}
      <div className="mt-3 pt-3 border-t border-slate-600/30">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Performance:</span>
          <span className={`font-bold flex items-center gap-1 ${
            isProfit ? 'text-green-400' : 
            isBreakEven ? 'text-slate-400' : 
            'text-red-400'
          }`}>
            {isProfit ? '📈 Winning' : isBreakEven ? '➖ Break Even' : '📉 Losing'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SessionStats;
