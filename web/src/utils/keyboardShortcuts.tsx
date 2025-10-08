// Keyboard Shortcuts System
import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  enabled?: boolean;
}

// Global keyboard shortcuts configuration
export const POKER_SHORTCUTS = {
  FOLD: { key: 'f', display: 'F', description: 'Fold' },
  CALL: { key: 'c', display: 'C', description: 'Call/Check' },
  RAISE: { key: 'r', display: 'R', description: 'Raise/Bet' },
  ALL_IN: { key: 'a', display: 'A', description: 'All In' },
  CONFIRM: { key: ' ', display: 'Space', description: 'Confirm Action' },
  HELP: { key: '?', display: '?', description: 'Show Help' },
  MUTE: { key: 'm', display: 'M', description: 'Mute/Unmute' },
  STATS: { key: 's', display: 'S', description: 'Toggle Stats' },
  ESCAPE: { key: 'Escape', display: 'Esc', description: 'Close Modal' },
};

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Ignore shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key.toLowerCase();
      const shortcut = shortcuts.find(s => s.key.toLowerCase() === key && (s.enabled ?? true));
      
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress, enabled]);
}

/**
 * Keyboard shortcut indicator component
 */
export function KeyboardShortcutBadge({ 
  shortcutKey, 
  className = '' 
}: { 
  shortcutKey: string; 
  className?: string;
}) {
  return (
    <span 
      className={`inline-flex items-center justify-center min-w-6 h-6 px-1.5 text-xs font-bold 
                  bg-slate-700/80 border border-slate-500 rounded 
                  text-slate-300 shadow-sm ${className}`}
      style={{ fontFamily: 'monospace' }}
    >
      {shortcutKey}
    </span>
  );
}
