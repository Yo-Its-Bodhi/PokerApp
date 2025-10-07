import React from 'react';

interface FairnessInfoProps {
  // Add any specific props needed for fairness data
}

const FairnessInfo: React.FC<FairnessInfoProps> = () => {
  return (
    <div className="glass-card p-4 flex flex-col h-full overflow-hidden">
      <h3 className="font-bold text-base text-brand-cyan mb-3 uppercase tracking-wider">🔐 Fairness</h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="text-xs space-y-3">
          <div>
            <label className="block text-brand-text-dark text-[10px] uppercase tracking-widest mb-1">Shoe_ID</label>
            <p className="font-mono text-[10px] text-brand-electric bg-black/30 p-2 rounded border border-brand-cyan/20">abc-123-def</p>
          </div>
          <div>
            <label className="block text-brand-text-dark text-[10px] uppercase tracking-widest mb-1">Commit_Hash</label>
            <p className="font-mono text-[10px] text-brand-text bg-black/30 p-2 rounded border border-brand-cyan/20 break-all">a1b2c3d4e5f6...</p>
          </div>
          <div>
            <label className="block text-brand-text-dark text-[10px] uppercase tracking-widest mb-1">Last_Reveal</label>
            <p className="font-mono text-[10px] text-brand-text bg-black/30 p-2 rounded border border-brand-cyan/20 break-all">z9y8x7w6v5u4...</p>
          </div>
          <div>
            <label className="block text-brand-text-dark text-[10px] uppercase tracking-widest mb-1">Network</label>
            <p className="text-[10px] text-brand-cyan bg-black/30 p-2 rounded border border-brand-cyan/20">Shido Chain (Chain ID: 9008)</p>
          </div>
          <div className="pt-2 border-t border-brand-cyan/20">
            <button className="w-full bg-gradient-to-r from-brand-cyan/20 to-brand-electric/20 hover:from-brand-cyan/30 hover:to-brand-electric/30 border border-brand-cyan/50 text-brand-cyan text-[10px] font-bold py-2 px-3 rounded transition-all uppercase tracking-wider">
              🔍 Verify Hand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FairnessInfo;
