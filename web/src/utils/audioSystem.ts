// Audio System for Poker Game
// Procedurally generated sounds using Web Audio API

class PokerAudioSystem {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3; // 30% volume by default

  constructor() {
    // Initialize AudioContext on first user interaction (browser requirement)
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  private ensureAudioContext() {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Turn notification sound - soft pleasant chime
  playTurnNotification() {
    if (!this.enabled || !this.audioContext) return;
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
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Card woosh sound - crisp swipe
  playCardWoosh() {
    if (!this.enabled || !this.audioContext) return;
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
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.start(now);
    noise.stop(now + 0.2);
  }

  // Card flip sound - subtle click/snap
  playCardFlip() {
    if (!this.enabled || !this.audioContext) return;
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
    gainNode.gain.setValueAtTime(this.volume * 0.3, now + 0.005);
    gainNode.gain.setValueAtTime(0, now + 0.01);
    gainNode.gain.setValueAtTime(this.volume * 0.3, now + 0.055);
    gainNode.gain.setValueAtTime(0, now + 0.06);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Chip bet sound - clink
  playChipBet() {
    if (!this.enabled || !this.audioContext) return;
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

    gainNode.gain.setValueAtTime(this.volume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Win pot sound - ascending chime
  playWinPot() {
    if (!this.enabled || !this.audioContext) return;
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
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Fold sound - descending tone
  playFold() {
    if (!this.enabled || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    gainNode.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Button click sound - crisp click
  playButtonClick() {
    if (!this.enabled || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sharp mechanical click - very short burst
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);

    gainNode.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Slider tick sound - subtle tick
  playSliderTick() {
    if (!this.enabled || !this.audioContext) return;
    this.ensureAudioContext();

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);

    gainNode.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Settings
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const audioSystem = new PokerAudioSystem();

// Convenience functions
export const playTurnNotification = () => audioSystem.playTurnNotification();
export const playCardWoosh = () => audioSystem.playCardWoosh();
export const playCardFlip = () => audioSystem.playCardFlip();
export const playChipBet = () => audioSystem.playChipBet();
export const playWinPot = () => audioSystem.playWinPot();
export const playFold = () => audioSystem.playFold();
export const playButtonClick = () => audioSystem.playButtonClick();
export const playSliderTick = () => audioSystem.playSliderTick();
