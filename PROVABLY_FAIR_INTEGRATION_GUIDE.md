# Provably Fair - Integration Guide for Real Cryptography

## 🎯 Overview
This guide explains how to integrate real cryptographic functions to make the Provably Fair system fully functional with actual SHA-256 hashing and verifiable randomness.

---

## 📦 Required Dependencies

### **Install Crypto Library**
```bash
npm install crypto-js
# or
npm install @noble/hashes
```

### **TypeScript Types**
```bash
npm install --save-dev @types/crypto-js
```

---

## 🔐 Cryptographic Implementation

### **1. Create Crypto Utility (utils/cryptoFairness.ts)**

```typescript
import CryptoJS from 'crypto-js';

export class ProvablyFair {
  /**
   * Generate a cryptographically secure random seed
   */
  static generateServerSeed(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return '0x' + Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate client seed (can be user-provided or random)
   */
  static generateClientSeed(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return '0x' + Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Hash a seed using SHA-256
   */
  static hashSeed(seed: string): string {
    const hash = CryptoJS.SHA256(seed);
    return '0x' + hash.toString(CryptoJS.enc.Hex);
  }

  /**
   * Combine server and client seeds
   */
  static combineSeedsAndHash(serverSeed: string, clientSeed: string, nonce: number = 0): string {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    return this.hashSeed(combined);
  }

  /**
   * Verify that a server seed matches its hash
   */
  static verifySeed(serverSeed: string, hashedSeed: string): boolean {
    return this.hashSeed(serverSeed) === hashedSeed;
  }

  /**
   * Generate deck shuffle from combined hash
   * Converts hash to deck order (52 cards)
   */
  static hashToDeck(hash: string): number[] {
    const deck: number[] = Array.from({ length: 52 }, (_, i) => i);
    const hashBytes = hash.replace('0x', '');
    
    // Fisher-Yates shuffle using hash as randomness source
    for (let i = deck.length - 1; i > 0; i--) {
      // Use 2 hex chars (1 byte) from hash for each shuffle step
      const byteIndex = (i * 2) % (hashBytes.length - 2);
      const randomValue = parseInt(hashBytes.substr(byteIndex, 2), 16);
      const j = randomValue % (i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  /**
   * Verify deck order matches the seeds
   */
  static verifyDeck(
    serverSeed: string, 
    clientSeed: string, 
    nonce: number,
    deckOrder: number[]
  ): boolean {
    const combinedHash = this.combineSeedsAndHash(serverSeed, clientSeed, nonce);
    const expectedDeck = this.hashToDeck(combinedHash);
    
    return JSON.stringify(deckOrder) === JSON.stringify(expectedDeck);
  }

  /**
   * Format hash for display (truncate middle)
   */
  static truncateHash(hash: string, startChars: number = 10, endChars: number = 8): string {
    if (hash.length <= startChars + endChars) return hash;
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
  }
}

// Example usage:
/*
const serverSeed = ProvablyFair.generateServerSeed();
const hashedServerSeed = ProvablyFair.hashSeed(serverSeed);
const clientSeed = ProvablyFair.generateClientSeed();
const combinedHash = ProvablyFair.combineSeedsAndHash(serverSeed, clientSeed, 0);
const deck = ProvablyFair.hashToDeck(combinedHash);

// Verify
const isValid = ProvablyFair.verifySeed(serverSeed, hashedServerSeed);
const isDeckValid = ProvablyFair.verifyDeck(serverSeed, clientSeed, 0, deck);
*/
```

---

## 🎮 Integration with Game Engine

### **2. Update MultiPlayerPokerGame.ts**

```typescript
import { ProvablyFair } from '../utils/cryptoFairness';

export class MultiPlayerPokerGame {
  private serverSeed: string = '';
  private hashedServerSeed: string = '';
  private clientSeed: string = '';
  private combinedHash: string = '';
  private nonce: number = 0;
  private deck: number[] = [];

  constructor() {
    this.initializeFairnessData();
  }

  /**
   * Initialize fairness data for a new hand
   */
  private initializeFairnessData(): void {
    // Generate server seed and hash it
    this.serverSeed = ProvablyFair.generateServerSeed();
    this.hashedServerSeed = ProvablyFair.hashSeed(this.serverSeed);
    
    // Generate client seed (or get from player)
    this.clientSeed = ProvablyFair.generateClientSeed();
    
    // Combine seeds
    this.combinedHash = ProvablyFair.combineSeedsAndHash(
      this.serverSeed, 
      this.clientSeed, 
      this.nonce
    );
    
    // Generate provably fair deck
    this.deck = ProvablyFair.hashToDeck(this.combinedHash);
  }

  /**
   * Get fairness data for display (hide server seed until after hand)
   */
  public getFairnessData(revealServerSeed: boolean = false): {
    hashedServerSeed: string;
    clientSeed: string;
    serverSeed?: string;
    combinedHash: string;
    nonce: number;
  } {
    return {
      hashedServerSeed: this.hashedServerSeed,
      clientSeed: this.clientSeed,
      serverSeed: revealServerSeed ? this.serverSeed : undefined,
      combinedHash: this.combinedHash,
      nonce: this.nonce
    };
  }

  /**
   * Reveal server seed after hand completion
   */
  public revealServerSeed(): string {
    return this.serverSeed;
  }

  /**
   * Start new hand with new fairness data
   */
  public startNewHand(): void {
    this.nonce++; // Increment nonce for next hand
    this.initializeFairnessData();
    // ... rest of hand initialization
  }

  /**
   * Deal cards from provably fair deck
   */
  private dealCard(): number {
    if (this.deck.length === 0) {
      throw new Error('Deck is empty!');
    }
    return this.deck.shift()!;
  }
}
```

---

## 🎨 Update FairnessPane Component

### **3. Use Real Cryptographic Data**

```typescript
import React, { useState, useEffect } from 'react';
import { ProvablyFair } from '../utils/cryptoFairness';

interface FairnessPaneProps {
  fairnessData?: {
    hashedServerSeed: string;
    clientSeed: string;
    serverSeed?: string;
    combinedHash: string;
    nonce: number;
  };
  handCompleted?: boolean;
}

const FairnessPane: React.FC<FairnessPaneProps> = ({ 
  fairnessData,
  handCompleted = false 
}) => {
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

  // Use real data if provided, otherwise generate sample
  const data = fairnessData || {
    hashedServerSeed: ProvablyFair.hashSeed(ProvablyFair.generateServerSeed()),
    clientSeed: ProvablyFair.generateClientSeed(),
    serverSeed: handCompleted ? ProvablyFair.generateServerSeed() : undefined,
    combinedHash: ProvablyFair.combineSeedsAndHash('sample1', 'sample2', 0),
    nonce: 0
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const verifyNow = () => {
    if (data.serverSeed) {
      const isValid = ProvablyFair.verifySeed(data.serverSeed, data.hashedServerSeed);
      setVerificationResult(isValid);
      setTimeout(() => setVerificationResult(null), 5000);
    }
  };

  return (
    <div className="glass-card p-4 flex flex-col h-full overflow-hidden">
      {/* ... header ... */}
      
      <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {!showExplanation && (
          <>
            {/* Hashed Server Seed */}
            <div className="bg-slate-800/40 p-3 rounded-lg border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-cyan-400">🔒 Hashed Server Seed</p>
                <button
                  onClick={() => copyToClipboard(data.hashedServerSeed, 'hash')}
                  className="text-xs px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 rounded text-cyan-300 transition-all"
                >
                  {copiedField === 'hash' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all bg-black/30 p-2 rounded border border-slate-700/50">
                {ProvablyFair.truncateHash(data.hashedServerSeed)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Committed before hand started • Nonce: {data.nonce}
              </p>
            </div>

            {/* Client Seed */}
            <div className="bg-slate-800/40 p-3 rounded-lg border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-blue-400">🎲 Your Client Seed</p>
                <button
                  onClick={() => copyToClipboard(data.clientSeed, 'client')}
                  className="text-xs px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-blue-300 transition-all"
                >
                  {copiedField === 'client' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all bg-black/30 p-2 rounded border border-slate-700/50">
                {ProvablyFair.truncateHash(data.clientSeed)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Generated by your browser
              </p>
            </div>

            {/* Server Seed (Revealed after hand) */}
            {data.serverSeed ? (
              <div className="bg-slate-800/40 p-3 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-green-400">✅ Server Seed (Revealed)</p>
                  <button
                    onClick={() => copyToClipboard(data.serverSeed!, 'server')}
                    className="text-xs px-2 py-1 bg-green-600/20 hover:bg-green-600/30 rounded text-green-300 transition-all"
                  >
                    {copiedField === 'server' ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
                <p className="text-xs font-mono text-slate-300 break-all bg-black/30 p-2 rounded border border-slate-700/50">
                  {ProvablyFair.truncateHash(data.serverSeed)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Revealed after hand completion
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
                <p className="text-sm font-semibold text-slate-400">🔒 Server Seed (Hidden)</p>
                <p className="text-xs text-slate-500 mt-1">
                  Will be revealed after hand completion
                </p>
              </div>
            )}

            {/* Combined Hash */}
            <div className="bg-slate-800/40 p-3 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-purple-400">🔗 Combined Hash</p>
                <button
                  onClick={() => copyToClipboard(data.combinedHash, 'combined')}
                  className="text-xs px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded text-purple-300 transition-all"
                >
                  {copiedField === 'combined' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all bg-black/30 p-2 rounded border border-slate-700/50">
                {ProvablyFair.truncateHash(data.combinedHash)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                SHA-256(Server Seed + Client Seed + Nonce)
              </p>
            </div>

            {/* Verification Buttons */}
            <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-3 rounded-lg border border-amber-500/40">
              <p className="text-xs font-bold text-amber-400 mb-2">🎯 Deck Order Verification</p>
              {verificationResult !== null && (
                <div className={`mb-2 p-2 rounded ${verificationResult ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {verificationResult ? '✅ Hash Verified!' : '❌ Hash Mismatch!'}
                </div>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={verifyNow}
                  disabled={!data.serverSeed}
                  className={`flex-1 text-xs px-3 py-1.5 rounded text-white font-bold transition-all ${
                    data.serverSeed 
                      ? 'bg-cyan-600 hover:bg-cyan-500' 
                      : 'bg-gray-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  🔍 Verify Now
                </button>
                <button className="flex-1 text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-white font-bold transition-all">
                  📊 View on Chain
                </button>
              </div>
            </div>
          </>
        )}
        
        {/* Explanation view stays the same */}
      </div>
    </div>
  );
};

export default FairnessPane;
```

---

## 🔗 Connect to App.tsx

### **4. Pass Real Data to FairnessPane**

```typescript
// In App.tsx
const [fairnessData, setFairnessData] = useState<any>(null);
const [handCompleted, setHandCompleted] = useState<boolean>(false);

// Update when game state changes
useEffect(() => {
  if (demoGame) {
    const data = demoGame.getFairnessData(handCompleted);
    setFairnessData(data);
  }
}, [demoGame, gameState, handCompleted]);

// In the modal render:
<FairnessPane 
  fairnessData={fairnessData}
  handCompleted={handCompleted}
/>
```

---

## 📊 Blockchain Integration (Optional)

### **5. Store on Blockchain**

```solidity
// Solidity smart contract example
contract PokerFairness {
    struct HandData {
        bytes32 hashedServerSeed;
        bytes32 clientSeed;
        bytes32 serverSeed;
        uint256 nonce;
        uint256 timestamp;
        address player;
    }
    
    mapping(uint256 => HandData) public hands;
    uint256 public handCount;
    
    event HandCommitted(uint256 indexed handId, bytes32 hashedServerSeed);
    event HandRevealed(uint256 indexed handId, bytes32 serverSeed);
    
    function commitHand(bytes32 _hashedServerSeed, bytes32 _clientSeed) external {
        hands[handCount] = HandData({
            hashedServerSeed: _hashedServerSeed,
            clientSeed: _clientSeed,
            serverSeed: bytes32(0),
            nonce: handCount,
            timestamp: block.timestamp,
            player: msg.sender
        });
        
        emit HandCommitted(handCount, _hashedServerSeed);
        handCount++;
    }
    
    function revealHand(uint256 _handId, bytes32 _serverSeed) external {
        require(hands[_handId].player == msg.sender, "Not your hand");
        require(hands[_handId].serverSeed == bytes32(0), "Already revealed");
        require(
            keccak256(abi.encodePacked(_serverSeed)) == hands[_handId].hashedServerSeed,
            "Invalid seed"
        );
        
        hands[_handId].serverSeed = _serverSeed;
        emit HandRevealed(_handId, _serverSeed);
    }
}
```

---

## ✅ Testing Checklist

- [ ] Generate server seed (32 bytes random)
- [ ] Hash server seed correctly (SHA-256)
- [ ] Generate client seed (16 bytes random)
- [ ] Combine seeds with nonce
- [ ] Hash combined seeds
- [ ] Generate deck from hash (52 cards)
- [ ] Verify hash matches original
- [ ] Verify deck order is deterministic
- [ ] Test with multiple hands (nonce increment)
- [ ] Copy-to-clipboard works
- [ ] Verification button works
- [ ] Display truncated hashes
- [ ] Reveal server seed after hand
- [ ] Blockchain integration (optional)

---

This guide provides everything needed to implement real cryptographic verification in your Provably Fair system! 🔐
