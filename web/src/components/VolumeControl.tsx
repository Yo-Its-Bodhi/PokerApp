// Volume Control UI Component
import React, { useState, useEffect } from 'react';
import { audioSystem } from '../utils/audioSystem';

export default function VolumeControl() {
  const [volume, setVolume] = useState(audioSystem.getVolume());
  const [isMuted, setIsMuted] = useState(audioSystem.getVolume() === 0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioSystem.setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    // Save to localStorage
    localStorage.setItem('pokerVolume', newVolume.toString());
  };

  const toggleMute = () => {
    if (isMuted) {
      const savedVolume = parseFloat(localStorage.getItem('pokerVolume') || '0.5');
      handleVolumeChange(savedVolume);
    } else {
      handleVolumeChange(0);
    }
  };

  // Load saved volume on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('pokerVolume');
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      audioSystem.setVolume(vol);
      setIsMuted(vol === 0);
    }
  }, []);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 0.33) return '🔈';
    if (volume < 0.66) return '🔉';
    return '🔊';
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Volume Button */}
      <button
        onClick={toggleMute}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/80 border-2 border-slate-600 
                   text-xl hover:border-cyan-500/50 hover:bg-slate-700/80
                   transition-all duration-200 hover:scale-110 active:scale-95"
        title="Toggle Mute (M)"
      >
        {getVolumeIcon()}
      </button>

      {/* Expanded Volume Slider */}
      {isExpanded && (
        <div 
          className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm 
                     border-2 border-cyan-500/50 rounded-lg p-4 shadow-xl animate-slideInUp"
          style={{ 
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
            minWidth: '60px'
          }}
        >
          {/* Vertical Slider */}
          <div className="flex flex-col items-center gap-3">
            {/* Volume percentage */}
            <span className="text-cyan-400 text-sm font-bold">
              {Math.round(volume * 100)}%
            </span>

            {/* Slider track */}
            <div className="relative w-6 h-32 bg-slate-800 rounded-full border-2 border-slate-700 overflow-hidden">
              {/* Fill */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all duration-200"
                style={{ 
                  height: `${volume * 100}%`,
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.6)'
                }}
              />
              
              {/* Slider input */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ 
                  writingMode: 'bt-lr' as any,
                  WebkitAppearance: 'slider-vertical',
                  appearance: 'slider-vertical' as any
                }}
              />
            </div>

            {/* Quick presets */}
            <div className="flex flex-col gap-1">
              {[1, 0.5, 0.25, 0].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleVolumeChange(preset)}
                  className={`w-8 h-6 text-xs font-bold rounded transition-all duration-200
                             ${volume === preset 
                               ? 'bg-cyan-500 text-white' 
                               : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                >
                  {preset === 0 ? 'OFF' : Math.round(preset * 100)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact horizontal version for mobile/compact layouts
export function VolumeControlCompact() {
  const [volume, setVolume] = useState(audioSystem.getVolume());
  const [isMuted, setIsMuted] = useState(audioSystem.getVolume() === 0);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioSystem.setVolume(newVolume);
    setIsMuted(newVolume === 0);
    localStorage.setItem('pokerVolume', newVolume.toString());
  };

  const toggleMute = () => {
    if (isMuted) {
      const savedVolume = parseFloat(localStorage.getItem('pokerVolume') || '0.5');
      handleVolumeChange(savedVolume);
    } else {
      handleVolumeChange(0);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 0.33) return '🔈';
    if (volume < 0.66) return '🔉';
    return '🔊';
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-sm border-2 border-slate-700 rounded-lg p-3">
      <button
        onClick={toggleMute}
        className="text-xl hover:scale-110 transition-transform duration-200 active:scale-95"
      >
        {getVolumeIcon()}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
        className="w-24 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                   [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-glow-cyan"
        style={{
          background: `linear-gradient(to right, rgb(6, 182, 212) 0%, rgb(6, 182, 212) ${volume * 100}%, rgb(51, 65, 85) ${volume * 100}%, rgb(51, 65, 85) 100%)`
        }}
      />

      <span className="text-cyan-400 text-sm font-bold min-w-[3ch]">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
}
