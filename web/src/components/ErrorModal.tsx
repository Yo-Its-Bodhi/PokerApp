// Professional Error Handling UI
import React from 'react';

export interface GameError {
  type: 'crash' | 'connection' | 'timeout' | 'invalid-action' | 'unknown';
  message: string;
  timestamp: number;
  recoverable: boolean;
}

interface ErrorModalProps {
  error: GameError | null;
  onRecover?: () => void;
  onDismiss?: () => void;
  onRestart?: () => void;
}

export default function ErrorModal({ error, onRecover, onDismiss, onRestart }: ErrorModalProps) {
  if (!error) return null;

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'crash': return '⚠️';
      case 'connection': return '🔌';
      case 'timeout': return '⏱️';
      case 'invalid-action': return '🚫';
      default: return '❌';
    }
  };

  const getErrorTitle = (type: string) => {
    switch (type) {
      case 'crash': return 'Game Error Detected';
      case 'connection': return 'Connection Lost';
      case 'timeout': return 'Request Timeout';
      case 'invalid-action': return 'Invalid Action';
      default: return 'Unexpected Error';
    }
  };

  const getErrorDescription = (type: string) => {
    switch (type) {
      case 'crash':
        return 'The game encountered an unexpected issue. Your progress has been saved and you can resume play.';
      case 'connection':
        return 'Lost connection to the game server. Please check your internet connection and try again.';
      case 'timeout':
        return 'The request took too long to complete. The game state has been preserved.';
      case 'invalid-action':
        return 'That action cannot be performed at this time. Please try a different action.';
      default:
        return 'Something went wrong. We\'ve logged the error and you can attempt to continue.';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn"
      onClick={onDismiss}
    >
      {/* Error Modal */}
      <div 
        className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-red-950/30 to-slate-900 rounded-lg overflow-hidden animate-slideInDown"
        style={{
          border: '3px solid rgba(239, 68, 68, 0.5)',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Brackets - Red theme */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-red-500 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 1))' }}></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-red-500 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 1))' }}></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-red-500 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 1))' }}></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-red-500 opacity-80 pointer-events-none"
             style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 1))' }}></div>

        <div className="relative p-8 flex flex-col items-center gap-6">
          {/* Error Icon */}
          <div className="text-7xl animate-pulse-subtle">
            {getErrorIcon(error.type)}
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-black text-red-400 uppercase tracking-wider text-center"
              style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.8)', fontFamily: 'monospace' }}>
            {getErrorTitle(error.type)}
          </h2>

          {/* Error Description */}
          <p className="text-slate-300 text-base leading-relaxed text-center max-w-sm">
            {getErrorDescription(error.type)}
          </p>

          {/* Error Message (technical details) */}
          {error.message && (
            <div className="w-full p-4 bg-black/40 rounded-lg border border-red-500/30">
              <p className="text-red-300 text-sm font-mono break-words">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 w-full mt-2">
            {error.recoverable && onRecover && (
              <button
                onClick={onRecover}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg
                           transition-all duration-200 hover:scale-105 active:scale-95 uppercase tracking-wide
                           border-2 border-emerald-400"
                style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
              >
                Resume Game
              </button>
            )}
            
            {onRestart && (
              <button
                onClick={onRestart}
                className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg
                           transition-all duration-200 hover:scale-105 active:scale-95 uppercase tracking-wide
                           border-2 border-cyan-400"
                style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)' }}
              >
                Restart
              </button>
            )}
            
            {onDismiss && !error.recoverable && (
              <button
                onClick={onDismiss}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg
                           transition-all duration-200 hover:scale-105 active:scale-95 uppercase tracking-wide
                           border-2 border-slate-500"
              >
                Dismiss
              </button>
            )}
          </div>

          {/* Timestamp */}
          <p className="text-slate-500 text-xs font-mono">
            Error Code: {error.type.toUpperCase()}-{error.timestamp}
          </p>
        </div>
      </div>
    </div>
  );
}

// Toast notification for non-critical errors
export function ErrorToast({ 
  message, 
  onDismiss 
}: { 
  message: string; 
  onDismiss: () => void;
}) {
  return (
    <div 
      className="fixed top-24 right-6 z-[90] max-w-sm animate-slideInDown"
      style={{ animation: 'slideInDown 300ms ease-smooth' }}
    >
      <div 
        className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-lg shadow-xl border-2 border-red-400"
        style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)' }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-snug">{message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white font-bold text-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for error management
export function useErrorHandler() {
  const [error, setError] = React.useState<GameError | null>(null);

  const handleError = (type: GameError['type'], message: string, recoverable = true) => {
    setError({
      type,
      message,
      timestamp: Date.now(),
      recoverable,
    });

    // Log to console for debugging
    console.error(`[${type.toUpperCase()}]`, message);
  };

  const clearError = () => setError(null);

  return {
    error,
    handleError,
    clearError,
  };
}
