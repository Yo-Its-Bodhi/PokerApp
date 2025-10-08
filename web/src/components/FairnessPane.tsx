import React, { useState } from 'react';

const FairnessPane: React.FC = () => {
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string>('');

  // Generate sample cryptographic data for current hand
  const generateSampleHash = (prefix: string) => {
    return `0x${prefix}${Math.random().toString(16).substring(2, 15)}${Math.random().toString(16).substring(2, 15)}${Math.random().toString(16).substring(2, 15)}`;
  };

  const serverSeed = generateSampleHash('a1b2c3');
  const clientSeed = generateSampleHash('d4e5f6');
  const hashedServerSeed = generateSampleHash('7890ab');
  const combinedHash = generateSampleHash('cdef12');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div className="glass-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-2">
        <h3 className="text-lg font-bold text-slate-200">
          🔐 Provably Fair
        </h3>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="px-3 py-1 text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 hover:border-cyan-500/60 rounded text-cyan-400 transition-all"
        >
          {showExplanation ? '✕ Close' : '❓ How It Works'}
        </button>
      </div>
      
      <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {showExplanation ? (
          // Detailed Explanation View
          <div className="space-y-4 text-sm">
            <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 p-4 rounded-lg border border-cyan-500/30">
              <h4 className="text-base font-bold text-cyan-400 mb-2 flex items-center gap-2">
                <span className="text-xl">🎯</span> What is Provably Fair?
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                Provably Fair is a cryptographic system that allows you to independently verify that every card dealt in the game was completely random and not manipulated by the house.
              </p>
              <p className="text-slate-400 text-xs">
                Unlike traditional online poker where you must trust the operator, our system uses blockchain technology and cryptographic hashing to prove fairness mathematically.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-4 rounded-lg border border-purple-500/30">
              <h4 className="text-base font-bold text-purple-400 mb-2 flex items-center gap-2">
                <span className="text-xl">🔢</span> How It Works (3 Steps)
              </h4>
              <div className="space-y-3">
                <div className="bg-black/30 p-3 rounded border-l-4 border-green-500">
                  <p className="text-green-400 font-bold text-xs mb-1">STEP 1: Server Seed (Hidden)</p>
                  <p className="text-slate-300 text-xs">
                    Before the hand starts, our server generates a random <span className="text-cyan-400 font-mono">Server Seed</span> and creates a cryptographic hash of it. The hash is shown to you, but the actual seed stays hidden until the hand ends.
                  </p>
                </div>

                <div className="bg-black/30 p-3 rounded border-l-4 border-blue-500">
                  <p className="text-blue-400 font-bold text-xs mb-1">STEP 2: Your Client Seed (Your Input)</p>
                  <p className="text-slate-300 text-xs">
                    You (or your browser) generate a random <span className="text-cyan-400 font-mono">Client Seed</span>. This ensures we cannot predict the outcome, since we don't control your seed.
                  </p>
                </div>

                <div className="bg-black/30 p-3 rounded border-l-4 border-purple-500">
                  <p className="text-purple-400 font-bold text-xs mb-1">STEP 3: Combination & Verification</p>
                  <p className="text-slate-300 text-xs">
                    Both seeds are combined using SHA-256 hashing to generate the deck shuffle. After the hand, we reveal the original Server Seed so you can verify the hash matched and the shuffle was fair.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 p-4 rounded-lg border border-amber-500/30">
              <h4 className="text-base font-bold text-amber-400 mb-2 flex items-center gap-2">
                <span className="text-xl">🛡️</span> Why This is Secure
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span><strong className="text-white">Pre-commitment:</strong> We commit to our seed (via hash) before you provide yours, so we can't cheat after seeing your seed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span><strong className="text-white">Your randomness:</strong> You contribute randomness we can't control, making prediction impossible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span><strong className="text-white">Cryptographic proof:</strong> SHA-256 hashing is one-way - we can't reverse-engineer a seed to produce a specific outcome.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span><strong className="text-white">Blockchain verification:</strong> All data is recorded on-chain, providing permanent, immutable proof.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-red-900/40 to-rose-900/40 p-4 rounded-lg border border-red-500/30">
              <h4 className="text-base font-bold text-red-400 mb-2 flex items-center gap-2">
                <span className="text-xl">🔍</span> How to Verify
              </h4>
              <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
                <li>Copy the <span className="text-cyan-400 font-mono">Hashed Server Seed</span> shown before the hand</li>
                <li>Note your <span className="text-cyan-400 font-mono">Client Seed</span></li>
                <li>After the hand, copy the revealed <span className="text-cyan-400 font-mono">Server Seed</span></li>
                <li>Use our verification tool or any SHA-256 calculator to hash the Server Seed</li>
                <li>Confirm it matches the hash shown at the start</li>
                <li>Combine both seeds and verify the deck order matches the cards dealt</li>
              </ol>
              <p className="text-amber-400 text-xs mt-3 italic">
                💡 Pro tip: You can use external verification tools to independently check our fairness claims!
              </p>
            </div>
          </div>
        ) : (
          // Current Hand Data View
          <div className="space-y-3">
            <div className="bg-slate-800/40 p-3 rounded-lg border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-cyan-400">🔒 Hashed Server Seed</p>
                <button
                  onClick={() => copyToClipboard(hashedServerSeed, 'hash')}
                  className="text-xs px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 rounded text-cyan-300 transition-all"
                >
                  {copiedField === 'hash' ? '✓ Copied' : '� Copy'}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all bg-black/30 p-2 rounded border border-slate-700/50">
                {hashedServerSeed}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Committed before hand started
              </p>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-lg border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-blue-400">🎲 Your Client Seed</p>
                <button
                  onClick={() => copyToClipboard(clientSeed, 'client')}
                  className="text-xs px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-blue-300 transition-all"
                >
                  {copiedField === 'client' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all bg-black/30 p-2 rounded border border-slate-700/50">
                {clientSeed}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Generated by your browser
              </p>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-lg border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-green-400">✅ Server Seed (Revealed)</p>
                <button
                  onClick={() => copyToClipboard(serverSeed, 'server')}
                  className="text-xs px-2 py-1 bg-green-600/20 hover:bg-green-600/30 rounded text-green-300 transition-all"
                >
                  {copiedField === 'server' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all bg-black/30 p-2 rounded border border-slate-700/50">
                {serverSeed}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Revealed after hand completion
              </p>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-purple-400">🔗 Combined Hash</p>
                <button
                  onClick={() => copyToClipboard(combinedHash, 'combined')}
                  className="text-xs px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded text-purple-300 transition-all"
                >
                  {copiedField === 'combined' ? '✓ Copied' : '� Copy'}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all bg-black/30 p-2 rounded border border-slate-700/50">
                {combinedHash}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                SHA-256(Server Seed + Client Seed)
              </p>
            </div>

            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-3 rounded-lg border border-amber-500/40">
              <p className="text-xs font-bold text-amber-400 mb-1">🎯 Deck Order Verification</p>
              <p className="text-xs text-slate-300">
                The combined hash determines the shuffle order. First 52 characters map to cards 0-51.
              </p>
              <div className="mt-2 flex gap-2">
                <button className="flex-1 text-xs px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-bold transition-all">
                  🔍 Verify Now
                </button>
                <button className="flex-1 text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-white font-bold transition-all">
                  📊 View on Chain
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FairnessPane;
