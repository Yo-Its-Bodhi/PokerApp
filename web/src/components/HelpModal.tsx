// Help & Tutorial System
import React, { useState } from 'react';
import { POKER_SHORTCUTS, KeyboardShortcutBadge } from '../utils/keyboardShortcuts.tsx';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'rules' | 'features'>('shortcuts');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden animate-slideInDown"
        style={{
          border: '3px solid rgba(6, 182, 212, 0.5)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))' }}></div>

        {/* Header */}
        <div className="relative p-6 border-b border-cyan-400/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-cyan-400 uppercase tracking-wider"
                style={{ textShadow: '0 0 20px rgba(6, 182, 212, 0.8)', fontFamily: 'monospace' }}>
              ⚡ Help & Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-600/20 border border-red-500/50 
                         text-red-400 font-bold hover:bg-red-600/40 transition-all duration-200 hover:scale-110"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'shortcuts', label: 'Keyboard' },
              { id: 'rules', label: 'Rules' },
              { id: 'features', label: 'Features' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide transition-all duration-200
                           ${activeTab === tab.id 
                             ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300 shadow-glow-cyan' 
                             : 'bg-slate-800/50 border border-slate-600 text-slate-400 hover:border-cyan-500/50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'shortcuts' && <KeyboardShortcutsTab />}
          {activeTab === 'rules' && <RulesTab />}
          {activeTab === 'features' && <FeaturesTab />}
        </div>
      </div>
    </div>
  );
}

function KeyboardShortcutsTab() {
  const shortcuts = [
    { key: POKER_SHORTCUTS.FOLD.display, desc: 'Fold your hand' },
    { key: POKER_SHORTCUTS.CALL.display, desc: 'Call or Check' },
    { key: POKER_SHORTCUTS.RAISE.display, desc: 'Raise or Bet' },
    { key: POKER_SHORTCUTS.ALL_IN.display, desc: 'Go All In' },
    { key: POKER_SHORTCUTS.CONFIRM.display, desc: 'Confirm action' },
    { key: POKER_SHORTCUTS.MUTE.display, desc: 'Mute/Unmute sound' },
    { key: POKER_SHORTCUTS.STATS.display, desc: 'Toggle statistics' },
    { key: POKER_SHORTCUTS.HELP.display, desc: 'Show this help menu' },
    { key: POKER_SHORTCUTS.ESCAPE.display, desc: 'Close modals' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-slate-300 text-base leading-relaxed mb-4">
        Use these keyboard shortcuts for faster gameplay:
      </p>
      
      {shortcuts.map((shortcut, i) => (
        <div 
          key={i}
          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 
                     hover:border-cyan-500/30 transition-all duration-200"
        >
          <span className="text-slate-200 text-base">{shortcut.desc}</span>
          <KeyboardShortcutBadge shortcutKey={shortcut.key} className="ml-4" />
        </div>
      ))}
    </div>
  );
}

function RulesTab() {
  return (
    <div className="space-y-4 text-slate-300 text-base leading-relaxed">
      <section>
        <h3 className="text-cyan-400 font-bold text-lg mb-2">Texas Hold'em Basics</h3>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Each player receives 2 hole cards (private)</li>
          <li>5 community cards are dealt face-up (shared by all)</li>
          <li>Make the best 5-card hand using any combination of your 2 cards + 5 community cards</li>
        </ul>
      </section>

      <section>
        <h3 className="text-cyan-400 font-bold text-lg mb-2">Betting Rounds</h3>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li><strong>Pre-Flop:</strong> After receiving hole cards</li>
          <li><strong>Flop:</strong> After first 3 community cards</li>
          <li><strong>Turn:</strong> After 4th community card</li>
          <li><strong>River:</strong> After 5th community card</li>
        </ul>
      </section>

      <section>
        <h3 className="text-cyan-400 font-bold text-lg mb-2">Hand Rankings (High to Low)</h3>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Royal Flush</li>
          <li>Straight Flush</li>
          <li>Four of a Kind</li>
          <li>Full House</li>
          <li>Flush</li>
          <li>Straight</li>
          <li>Three of a Kind</li>
          <li>Two Pair</li>
          <li>Pair</li>
          <li>High Card</li>
        </ol>
      </section>
    </div>
  );
}

function FeaturesTab() {
  const features = [
    { icon: '⚡', title: 'Player Levels', desc: 'Earn XP and level up based on hands played and win rate' },
    { icon: '📊', title: 'Live Statistics', desc: 'Track your performance with real-time stats and analytics' },
    { icon: '🎯', title: 'Smart AI', desc: 'Play against adaptive AI opponents with realistic play styles' },
    { icon: '⏱️', title: 'Action Timer', desc: '30s base time + 30s time bank for critical decisions' },
    { icon: '💰', title: 'Rake System', desc: '5% rake capped at 3 big blinds per pot' },
    { icon: '🏆', title: 'Leaderboard', desc: 'Compete globally and track top players' },
    { icon: '🎨', title: 'Themes', desc: 'Customize your table with multiple theme options' },
    { icon: '🔊', title: 'Sound Effects', desc: 'Immersive audio with volume control' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((feature, i) => (
        <div 
          key={i}
          className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-all duration-200"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">{feature.icon}</span>
            <div>
              <h4 className="text-cyan-400 font-bold text-base mb-1">{feature.title}</h4>
              <p className="text-slate-300 text-sm leading-normal">{feature.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Help Button Component (to place in header/corner)
export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 
                   text-cyan-400 font-bold text-lg hover:bg-cyan-500/40 hover:scale-110 hover:shadow-glow-cyan
                   transition-all duration-200 active:scale-95"
        title="Help & Shortcuts (?)"
      >
        ?
      </button>
      
      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
