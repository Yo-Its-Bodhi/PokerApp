import React, { useState, useEffect } from 'react';
import { audioSystem, SoundSettings } from '../utils/audioSystem';
import { Volume2, VolumeX, Play, RotateCcw } from 'lucide-react';

interface SoundSettingsPanelProps {
  onClose?: () => void;
}

const SoundSettingsPanel: React.FC<SoundSettingsPanelProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<SoundSettings>(audioSystem.getSettings());

  useEffect(() => {
    setSettings(audioSystem.getSettings());
  }, []);

  const handleMasterVolumeChange = (value: number) => {
    const newSettings = { ...settings, masterVolume: value };
    setSettings(newSettings);
    audioSystem.updateSettings(newSettings);
  };

  const handleMasterToggle = () => {
    const newSettings = { ...settings, masterEnabled: !settings.masterEnabled };
    setSettings(newSettings);
    audioSystem.updateSettings(newSettings);
  };

  const handleSoundToggle = (soundType: keyof Omit<SoundSettings, 'masterVolume' | 'masterEnabled'>) => {
    const newSettings = { ...settings, [soundType]: !settings[soundType] };
    setSettings(newSettings);
    audioSystem.updateSettings(newSettings);
  };

  const handleReset = () => {
    const defaultSettings: SoundSettings = {
      masterVolume: 0.3,
      masterEnabled: true,
      buttonClick: true,
      cardDeal: true,
      chipBet: true,
      turnNotification: true,
      fold: true,
      check: true,
      raise: true,
      winPot: true,
      cardFlip: true,
      timerWarning: true,
      muteOpponents: false,
    };
    setSettings(defaultSettings);
    audioSystem.updateSettings(defaultSettings);
  };

  const soundCategories = [
    {
      title: 'Game Actions',
      sounds: [
        { key: 'chipBet' as const, label: 'Chip Betting', testFn: () => import('../utils/audioSystem').then(m => m.playChipBet()) },
        { key: 'raise' as const, label: 'Raise/All-In', testFn: () => import('../utils/audioSystem').then(m => m.playRaise()) },
        { key: 'fold' as const, label: 'Fold', testFn: () => import('../utils/audioSystem').then(m => m.playFold()) },
        { key: 'check' as const, label: 'Check', testFn: () => import('../utils/audioSystem').then(m => m.playCheck()) },
        { key: 'winPot' as const, label: 'Win Pot', testFn: () => import('../utils/audioSystem').then(m => m.playWinPot()) },
      ]
    },
    {
      title: 'Cards',
      sounds: [
        { key: 'cardDeal' as const, label: 'Card Deal', testFn: () => import('../utils/audioSystem').then(m => m.playCardWoosh()) },
        { key: 'cardFlip' as const, label: 'Card Flip', testFn: () => import('../utils/audioSystem').then(m => m.playCardFlip()) },
      ]
    },
    {
      title: 'Interface',
      sounds: [
        { key: 'buttonClick' as const, label: 'Button Clicks', testFn: () => import('../utils/audioSystem').then(m => m.playButtonClick()) },
        { key: 'turnNotification' as const, label: 'Turn Notification', testFn: () => import('../utils/audioSystem').then(m => m.playTurnNotification()) },
        { key: 'timerWarning' as const, label: 'Timer Warning', testFn: () => import('../utils/audioSystem').then(m => m.playTimerWarning()) },
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-6 max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Sound Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Master Controls */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleMasterToggle}
              className={`p-2 rounded-lg transition-all ${
                settings.masterEnabled
                  ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                  : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'
              }`}
            >
              {settings.masterEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <span className="text-white font-medium">Master Volume</span>
          </div>
          <span className="text-cyan-400 font-mono">{Math.round(settings.masterVolume * 100)}%</span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={settings.masterVolume * 100}
          onChange={(e) => handleMasterVolumeChange(parseInt(e.target.value) / 100)}
          disabled={!settings.masterEnabled}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-gradient-to-r
                     [&::-webkit-slider-thumb]:from-cyan-400
                     [&::-webkit-slider-thumb]:to-purple-500
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:shadow-cyan-500/50
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-all
                     [&::-webkit-slider-thumb]:hover:scale-110
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Mute Opponents Toggle */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.muteOpponents}
                  onChange={() => handleSoundToggle('muteOpponents')}
                  disabled={!settings.masterEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer 
                               peer-checked:bg-orange-500 peer-disabled:opacity-50
                               after:content-[''] after:absolute after:top-0.5 after:left-0.5
                               after:bg-white after:rounded-full after:h-5 after:w-5
                               after:transition-all peer-checked:after:translate-x-5
                               after:shadow-lg"></div>
              </div>
              <span className="text-white font-medium">Mute AI Opponents</span>
            </div>
            <span className="text-xs text-slate-400">Only hear your own actions</span>
          </label>
        </div>
      </div>

      {/* Individual Sound Controls */}
      <div className="space-y-4 mb-6">
        {soundCategories.map((category) => (
          <div key={category.title}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
              {category.title}
            </h3>
            <div className="space-y-2">
              {category.sounds.map((sound) => (
                <div
                  key={sound.key}
                  className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[sound.key]}
                        onChange={() => handleSoundToggle(sound.key)}
                        disabled={!settings.masterEnabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                    </label>
                    <span className={`text-sm font-medium ${settings.masterEnabled && settings[sound.key] ? 'text-white' : 'text-slate-500'}`}>
                      {sound.label}
                    </span>
                  </div>
                  <button
                    onClick={sound.testFn}
                    disabled={!settings.masterEnabled || !settings[sound.key]}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-700/50 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-all text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed group-hover:opacity-100 opacity-0"
                  >
                    <Play size={12} />
                    Test
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all font-medium"
      >
        <RotateCcw size={16} />
        Reset to Defaults
      </button>

      {/* Info */}
      <p className="text-xs text-slate-500 text-center mt-4">
        Settings are automatically saved and will persist across sessions
      </p>
    </div>
  );
};

export default SoundSettingsPanel;
