// Session Summary Screen - Professional Performance Review
import React from 'react';

export interface SessionSummaryData {
  startTime: number;
  endTime: number;
  buyIn: number;
  finalStack: number;
  handsPlayed: number;
  handsWon: number;
  biggestWin: number;
  biggestLoss: number;
  bestHand: string;
  worstHand: string;
  totalWagered: number;
  rakePaid: number;
  stackHistory: { hand: number; stack: number }[];
}

interface SessionSummaryProps {
  data: SessionSummaryData;
  onClose: () => void;
  onPlayAgain: () => void;
}

export default function SessionSummary({ data, onClose, onPlayAgain }: SessionSummaryProps) {
  const sessionDuration = Math.floor((data.endTime - data.startTime) / 1000 / 60); // minutes
  const profitLoss = data.finalStack - data.buyIn;
  const isProfitable = profitLoss > 0;
  const winRate = data.handsPlayed > 0 ? ((data.handsWon / data.handsPlayed) * 100).toFixed(1) : '0';
  const roi = data.buyIn > 0 ? ((profitLoss / data.buyIn) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden animate-slideInDown"
        style={{
          border: '3px solid rgba(6, 182, 212, 0.5)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>

        {/* Header */}
        <div className="relative p-8 border-b border-cyan-400/30">
          <h2 className="text-3xl font-black text-cyan-400 uppercase tracking-wider text-center mb-2"
              style={{ textShadow: '0 0 20px rgba(6, 182, 212, 0.8)', fontFamily: 'monospace' }}>
            📊 Session Summary
          </h2>
          <p className="text-slate-400 text-sm text-center">
            Session Duration: {sessionDuration} minutes
          </p>
        </div>

        {/* Main Stats - Hero Cards */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profit/Loss Card */}
          <div 
            className={`p-6 rounded-lg border-2 ${isProfitable ? 'bg-emerald-950/30 border-emerald-500' : 'bg-red-950/30 border-red-500'}`}
            style={{
              boxShadow: isProfitable 
                ? '0 0 30px rgba(16, 185, 129, 0.3)' 
                : '0 0 30px rgba(239, 68, 68, 0.3)'
            }}
          >
            <div className="text-center">
              <p className="text-slate-400 text-sm uppercase tracking-wide mb-2">Profit/Loss</p>
              <p className={`text-4xl font-black ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                {isProfitable ? '+' : ''}{profitLoss.toLocaleString()}
              </p>
              <p className="text-slate-300 text-lg mt-2">SHIDO</p>
              <p className="text-slate-500 text-xs mt-2">ROI: {isProfitable ? '+' : ''}{roi}%</p>
            </div>
          </div>

          {/* Win Rate Card */}
          <div 
            className="p-6 rounded-lg border-2 bg-cyan-950/30 border-cyan-500"
            style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)' }}
          >
            <div className="text-center">
              <p className="text-slate-400 text-sm uppercase tracking-wide mb-2">Win Rate</p>
              <p className="text-4xl font-black text-cyan-400">{winRate}%</p>
              <p className="text-slate-300 text-lg mt-2">{data.handsWon} / {data.handsPlayed}</p>
              <p className="text-slate-500 text-xs mt-2">Hands Won</p>
            </div>
          </div>

          {/* Biggest Win Card */}
          <div 
            className="p-6 rounded-lg border-2 bg-amber-950/30 border-amber-500"
            style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.3)' }}
          >
            <div className="text-center">
              <p className="text-slate-400 text-sm uppercase tracking-wide mb-2">Biggest Win</p>
              <p className="text-4xl font-black text-amber-400">+{data.biggestWin.toLocaleString()}</p>
              <p className="text-slate-300 text-lg mt-2">SHIDO</p>
              <p className="text-slate-500 text-xs mt-2">{data.bestHand || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="px-8 pb-8">
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
            <h3 className="text-cyan-400 font-bold text-lg mb-4 uppercase tracking-wide">Detailed Statistics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem label="Buy-In" value={`${data.buyIn.toLocaleString()} SHIDO`} />
              <StatItem label="Final Stack" value={`${data.finalStack.toLocaleString()} SHIDO`} />
              <StatItem label="Hands Played" value={data.handsPlayed.toString()} />
              <StatItem label="Hands Won" value={data.handsWon.toString()} />
              <StatItem label="Total Wagered" value={`${data.totalWagered.toLocaleString()} SHIDO`} />
              <StatItem label="Rake Paid" value={`${data.rakePaid.toLocaleString()} SHIDO`} />
              <StatItem label="Biggest Loss" value={`-${data.biggestLoss.toLocaleString()} SHIDO`} />
              <StatItem label="Best Hand" value={data.bestHand || 'N/A'} />
            </div>
          </div>

          {/* Stack Over Time Chart (Simple) */}
          {data.stackHistory && data.stackHistory.length > 0 && (
            <div className="mt-6 bg-slate-800/50 rounded-lg border border-slate-700 p-6">
              <h3 className="text-cyan-400 font-bold text-lg mb-4 uppercase tracking-wide">Stack Progress</h3>
              <StackChart data={data.stackHistory} buyIn={data.buyIn} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-8 pt-0 flex gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 
                       text-white font-black text-lg rounded-lg uppercase tracking-wider
                       transition-all duration-200 hover:scale-105 active:scale-95
                       border-2 border-emerald-400"
            style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}
          >
            🎮 Play Again
          </button>
          
          <button
            onClick={onClose}
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg rounded-lg uppercase tracking-wide
                       transition-all duration-200 hover:scale-105 active:scale-95
                       border-2 border-slate-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-slate-200 text-base font-semibold">{value}</p>
    </div>
  );
}

// Simple line chart for stack history
function StackChart({ 
  data, 
  buyIn 
}: { 
  data: { hand: number; stack: number }[]; 
  buyIn: number;
}) {
  if (data.length === 0) return null;

  const maxStack = Math.max(...data.map(d => d.stack), buyIn);
  const minStack = Math.min(...data.map(d => d.stack), buyIn);
  const range = maxStack - minStack || 1;

  return (
    <div className="relative w-full h-48 bg-slate-900/50 rounded-lg p-4">
      {/* Buy-in reference line */}
      <div 
        className="absolute left-4 right-4 border-t-2 border-dashed border-slate-600"
        style={{ top: `${((maxStack - buyIn) / range) * 100}%` }}
      >
        <span className="absolute -top-3 -right-2 text-xs text-slate-500">Buy-in</span>
      </div>

      {/* Line path */}
      <svg className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={data.map((point, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = ((maxStack - point.stack) / range) * 100;
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(6, 182, 212, 0.8)"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Points */}
        {data.map((point, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = ((maxStack - point.stack) / range) * 100;
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r="4"
              fill="rgb(6, 182, 212)"
              style={{ filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 1))' }}
            />
          );
        })}
      </svg>

      {/* Axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 px-4">
        <span>Hand 1</span>
        <span>Hand {data[data.length - 1]?.hand || data.length}</span>
      </div>
    </div>
  );
}
