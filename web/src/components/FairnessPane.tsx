import React from 'react';

const FairnessPane: React.FC = () => {
  return (
    <div className="glass-card p-4 flex flex-col h-full overflow-hidden">
      <h3 className="text-lg font-bold mb-3 text-slate-200 border-b border-slate-700/50 pb-2">
        🔐 Provably Fair
      </h3>
      
      <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
          <p className="text-sm font-semibold text-green-400 mb-2">✅ Blockchain Verified</p>
          <p className="text-xs text-slate-400">
            All hands are cryptographically secured and verifiable on-chain.
          </p>
        </div>

        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
          <p className="text-sm font-semibold text-blue-400 mb-2">🎲 RNG Certified</p>
          <p className="text-xs text-slate-400">
            Decentralized random number generation ensures fair card dealing.
          </p>
        </div>

        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
          <p className="text-sm font-semibold text-purple-400 mb-2">🔍 Transparent</p>
          <p className="text-xs text-slate-400">
            View complete hand history and verify every action on the blockchain explorer.
          </p>
        </div>

        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
          <p className="text-sm font-semibold text-amber-400 mb-2">🛡️ Secure</p>
          <p className="text-xs text-slate-400">
            Smart contracts hold all funds in escrow. No central authority can access player funds.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FairnessPane;
