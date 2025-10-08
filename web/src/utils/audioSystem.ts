// Enhanced Audio System for Poker Game
// Procedurally generated sounds using Web Audio API with individual controls

export interface SoundSettings {
  masterVolume: number;
  masterEnabled: boolean;
  buttonClick: boolean;
  cardDeal: boolean;
  chipBet: boolean;
  turnNotification: boolean;
  fold: boolean;
  check: boolean;
  raise: boolean;
  winPot: boolean;
  cardFlip: boolean;
  timerWarning: boolean;
  muteOpponents: boolean; // Mute AI opponent sounds
}

class PokerAudioSystem {
  private audioContext: AudioContext | null = null;
  private settings: SoundSettings = {
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

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext();
      this.loadSettings();
    }
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('poker-sound-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load sound settings');
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('poker-sound-settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save sound settings');
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private ensureAudioContext() {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private shouldPlaySound(soundType: keyof Omit<SoundSettings, 'masterVolume' | 'masterEnabled'>): boolean {
    return this.settings.masterEnabled && this.settings[soundType];
  }

  // Turn notification sound - gentle chime
  playTurnNotification() {
    if (!this.shouldPlaySound('turnNotification') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Create oscillator for chime sound
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Two-tone chime (C4 -> G4) - Lower, warmer tone
    osc.frequency.setValueAtTime(261.63, now); // C4
    osc.frequency.setValueAtTime(392.00, now + 0.1); // G4

    // Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.settings.masterVolume * 0.5, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Card woosh sound - crisp swipe with snap landing
  playCardWoosh() {
    if (!this.shouldPlaySound('cardDeal') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // White noise for woosh effect
    const bufferSize = ctx.sampleRate * 0.2; // 200ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // High-pass filter for crisp sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, now);

    const gainNode = ctx.createGain();
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Quick fade in/out
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.settings.masterVolume * 0.4, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.start(now);
    noise.stop(now + 0.2);
  }

  // Card flip sound - quick snap
  playCardFlip() {
    if (!this.shouldPlaySound('cardFlip') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Two quick clicks for flip sound
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.setValueAtTime(150, now + 0.05);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.setValueAtTime(this.settings.masterVolume * 0.3, now + 0.005);
    gainNode.gain.setValueAtTime(0, now + 0.01);
    gainNode.gain.setValueAtTime(this.settings.masterVolume * 0.3, now + 0.055);
    gainNode.gain.setValueAtTime(0, now + 0.06);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Chip bet sound - authentic clay chip clinks
  playChipBet() {
    if (!this.shouldPlaySound('chipBet') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

    gainNode.gain.setValueAtTime(this.settings.masterVolume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Win pot sound - satisfying chip collection cascade
  playWinPot() {
    if (!this.shouldPlaySound('winPot') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Three ascending tones
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.frequency.setValueAtTime(freq, now);
      
      const startTime = now + (i * 0.08);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(this.settings.masterVolume * 0.5, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Fold sound - soft card slide (quieter than deal)
  playFold() {
    if (!this.shouldPlaySound('fold') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    gainNode.gain.setValueAtTime(this.settings.masterVolume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Button click sound - crisp mechanical click (similar to timer)
  playButtonClick() {
    if (!this.shouldPlaySound('buttonClick') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Lower, crisper click - similar to timer warning but slightly different frequency
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now); // Lower frequency (was 1000)

    // Sharp attack and quick decay for crisp click
    gainNode.gain.setValueAtTime(this.settings.masterVolume * 0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.025);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  // Slider tick sound - subtle tick
  playSliderTick() {
    if (!this.shouldPlaySound('buttonClick') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);

    gainNode.gain.setValueAtTime(this.settings.masterVolume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Check - light tap on table
  playCheck() {
    if (!this.shouldPlaySound('check') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);

    gainNode.gain.setValueAtTime(this.settings.masterVolume * 0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Raise/All-in - more emphatic chip sound
  playRaise() {
    if (!this.shouldPlaySound('raise') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Stack of chips sliding - more sounds than regular bet
    for (let i = 0; i < 5; i++) {
      const delay = i * 0.02;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000 + Math.random() * 300, now + delay);
      osc.frequency.exponentialRampToValueAtTime(700, now + delay + 0.05);

      gainNode.gain.setValueAtTime(this.settings.masterVolume * 0.35 * (1 - i * 0.15), now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.06);

      osc.start(now + delay);
      osc.stop(now + delay + 0.06);
    }
  }

  // Timer warning - subtle urgency
  playTimerWarning() {
    if (!this.shouldPlaySound('timerWarning') || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    gainNode.gain.setValueAtTime(this.settings.masterVolume * 0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Settings management
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  setSoundEnabled(soundType: keyof Omit<SoundSettings, 'masterVolume' | 'masterEnabled'>, enabled: boolean) {
    this.settings[soundType] = enabled;
    this.saveSettings();
  }

  setMasterVolume(volume: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  setMasterEnabled(enabled: boolean) {
    this.settings.masterEnabled = enabled;
    this.saveSettings();
  }

  // Legacy compatibility
  setVolume(volume: number) {
    this.setMasterVolume(volume);
  }

  setEnabled(enabled: boolean) {
    this.setMasterEnabled(enabled);
  }

  getVolume(): number {
    return this.settings.masterVolume;
  }

  isEnabled(): boolean {
    return this.settings.masterEnabled;
  }

  // Check if opponent sounds should be muted
  shouldMuteOpponents(): boolean {
    return this.settings.muteOpponents;
  }
}

// Export singleton instance
export const audioSystem = new PokerAudioSystem();

// Convenience functions
export const playTurnNotification = () => audioSystem.playTurnNotification();
export const playCardWoosh = () => audioSystem.playCardWoosh();
export const playCardFlip = () => audioSystem.playCardFlip();
export const playChipBet = () => audioSystem.playChipBet();
export const playRaise = () => audioSystem.playRaise();
export const playWinPot = () => audioSystem.playWinPot();
export const playFold = () => audioSystem.playFold();
export const playCheck = () => audioSystem.playCheck();
export const playButtonClick = () => audioSystem.playButtonClick();
export const playSliderTick = () => audioSystem.playSliderTick();
export const playTimerWarning = () => audioSystem.playTimerWarning();
