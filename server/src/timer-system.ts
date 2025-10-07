/**
 * POKER TIMER SYSTEM
 * 
 * Handles all timing logic for poker actions:
 * - Per-action turn timers
 * - Time bank management
 * - Disconnect grace periods
 * - Auto sit-out mechanics
 * - Pre-action queueing
 */

export interface TimerConfig {
  // Base turn timers
  baseTurnTimerMs: number;        // Default: 15000ms (15s)
  preflopTimerMs: number;         // Default: 12000ms (12s)
  postflopTimerMs: number;        // Default: 16000ms (16s)
  headsUpTimerMs: number;         // Default: 10000ms (10s) for HU
  
  // Time bank
  initialTimeBankMs: number;      // Default: 75000ms (75s)
  timeBankCapMs: number;          // Default: 90000ms (90s)
  timeBankAccrualMs: number;      // Default: 5000ms (+5s)
  timeBankAccrualHands: number;   // Default: 15 hands
  
  // Pauses & windows
  allInPauseMs: number;           // Default: 2000ms (2s)
  showdownWindowMs: number;       // Default: 4000ms (4s)
  startTurnPauseMs: number;       // Default: 500ms (0.5s) anti-insta-timeout
  
  // Disconnections
  disconnectGraceMs: number;      // Default: 5000ms (5s)
  autoSitOutTimeouts: number;     // Default: 2 timeouts
  autoSitOutHandsWindow: number;  // Default: 3 hands
  
  // Anti-stall
  minActionDelayMs: number;       // Default: 800ms (0.8s) for pre-action
  maxStreetDwellMs?: number;      // Optional: 90000ms (90s) per street cap
  moveForwardOnFolds: boolean;    // Default: true
}

export interface PlayerTimerState {
  playerId: string;
  timeBankMs: number;
  handsPlayed: number;
  timeoutsInWindow: number[];     // Array of hand indices where timeouts occurred
  isDisconnected: boolean;
  disconnectStartMs?: number;
  isSittingOut: boolean;
  queuedAction?: QueuedAction;
  streetStartMs?: number;
  streetDwellUsedMs: number;
}

export interface QueuedAction {
  type: 'fold_to_any' | 'check_fold' | 'call' | 'raise';
  raiseAmount?: number;
}

export interface TimerEvent {
  type: 'timer_start' | 'timer_tick' | 'timer_expired' | 'timebank_start' | 'timebank_depleted' | 'action_forced';
  playerId: string;
  remainingMs: number;
  timeBankMs?: number;
  forcedAction?: string;
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  baseTurnTimerMs: 15000,
  preflopTimerMs: 12000,
  postflopTimerMs: 16000,
  headsUpTimerMs: 10000,
  initialTimeBankMs: 75000,
  timeBankCapMs: 90000,
  timeBankAccrualMs: 5000,
  timeBankAccrualHands: 15,
  allInPauseMs: 2000,
  showdownWindowMs: 4000,
  startTurnPauseMs: 500,
  disconnectGraceMs: 5000,
  autoSitOutTimeouts: 2,
  autoSitOutHandsWindow: 3,
  minActionDelayMs: 800,
  maxStreetDwellMs: 90000,
  moveForwardOnFolds: true
};

export class PokerTimerSystem {
  private config: TimerConfig;
  private playerStates: Map<string, PlayerTimerState>;
  private activeTimer?: NodeJS.Timeout;
  private activePlayerId?: string;
  private timerStartMs: number = 0;
  private baseDurationMs: number = 0;
  private usingTimeBank: boolean = false;
  private onTimerEvent?: (event: TimerEvent) => void;
  private currentHandNumber: number = 0;

  constructor(config: Partial<TimerConfig> = {}) {
    this.config = { ...DEFAULT_TIMER_CONFIG, ...config };
    this.playerStates = new Map();
  }

  /**
   * Register event callback for timer events
   */
  public onEvent(callback: (event: TimerEvent) => void): void {
    this.onTimerEvent = callback;
  }

  /**
   * Initialize or reset a player's timer state
   */
  public initPlayer(playerId: string): void {
    this.playerStates.set(playerId, {
      playerId,
      timeBankMs: this.config.initialTimeBankMs,
      handsPlayed: 0,
      timeoutsInWindow: [],
      isDisconnected: false,
      isSittingOut: false,
      streetDwellUsedMs: 0
    });
  }

  /**
   * Remove player from timer system
   */
  public removePlayer(playerId: string): void {
    if (this.activePlayerId === playerId) {
      this.stopTimer();
    }
    this.playerStates.delete(playerId);
  }

  /**
   * Start turn timer for a player
   */
  public startTurnTimer(playerId: string, street: 'preflop' | 'postflop', isHeadsUp: boolean = false): void {
    this.stopTimer();

    const playerState = this.playerStates.get(playerId);
    if (!playerState) {
      console.error(`Player ${playerId} not initialized in timer system`);
      return;
    }

    // Check if player should be auto-sitting out
    if (playerState.isSittingOut) {
      this.emitEvent({
        type: 'action_forced',
        playerId,
        remainingMs: 0,
        forcedAction: 'fold'
      });
      return;
    }

    // Check for queued pre-action
    if (playerState.queuedAction) {
      // Apply minimum delay before executing pre-action
      setTimeout(() => {
        this.executeQueuedAction(playerId);
      }, this.config.minActionDelayMs);
      return;
    }

    // Determine base timer duration
    let timerMs: number;
    if (isHeadsUp) {
      timerMs = this.config.headsUpTimerMs;
    } else if (street === 'preflop') {
      timerMs = this.config.preflopTimerMs;
    } else {
      timerMs = this.config.postflopTimerMs;
    }

    // Add start pause to prevent insta-timeouts
    timerMs += this.config.startTurnPauseMs;

    this.activePlayerId = playerId;
    this.timerStartMs = Date.now();
    this.baseDurationMs = timerMs;
    this.usingTimeBank = false;

    // Mark street start if not set
    if (!playerState.streetStartMs) {
      playerState.streetStartMs = Date.now();
      playerState.streetDwellUsedMs = 0;
    }

    this.emitEvent({
      type: 'timer_start',
      playerId,
      remainingMs: timerMs,
      timeBankMs: playerState.timeBankMs
    });

    // Start ticking
    this.tick();
  }

  /**
   * Main timer tick (100ms intervals for smooth UI)
   */
  private tick(): void {
    if (!this.activePlayerId) return;

    const playerState = this.playerStates.get(this.activePlayerId);
    if (!playerState) {
      this.stopTimer();
      return;
    }

    const elapsed = Date.now() - this.timerStartMs;
    let remaining: number;

    if (!this.usingTimeBank) {
      remaining = this.baseDurationMs - elapsed;

      if (remaining <= 0) {
        // Base timer expired, try to use time bank
        if (playerState.timeBankMs > 0) {
          this.switchToTimeBank();
          return;
        } else {
          // No time bank, force action
          this.handleTimerExpiry();
          return;
        }
      }
    } else {
      // Using time bank
      remaining = playerState.timeBankMs - elapsed;

      if (remaining <= 0) {
        // Time bank depleted
        this.handleTimeBankDepletion();
        return;
      }
    }

    // Check max street dwell limit
    if (this.config.maxStreetDwellMs && playerState.streetStartMs) {
      const streetDwell = Date.now() - playerState.streetStartMs;
      if (streetDwell >= this.config.maxStreetDwellMs) {
        this.handleTimerExpiry('max_street_dwell');
        return;
      }
    }

    // Emit tick event
    this.emitEvent({
      type: 'timer_tick',
      playerId: this.activePlayerId,
      remainingMs: remaining,
      timeBankMs: this.usingTimeBank ? undefined : playerState.timeBankMs
    });

    // Schedule next tick
    this.activeTimer = setTimeout(() => this.tick(), 100);
  }

  /**
   * Switch from base timer to time bank
   */
  private switchToTimeBank(): void {
    const playerState = this.playerStates.get(this.activePlayerId!);
    if (!playerState) return;

    this.usingTimeBank = true;
    this.timerStartMs = Date.now();

    this.emitEvent({
      type: 'timebank_start',
      playerId: this.activePlayerId!,
      remainingMs: playerState.timeBankMs,
      timeBankMs: playerState.timeBankMs
    });

    this.tick();
  }

  /**
   * Handle timer expiry (force action)
   */
  private handleTimerExpiry(reason: string = 'timeout'): void {
    if (!this.activePlayerId) return;

    const playerState = this.playerStates.get(this.activePlayerId);
    if (!playerState) return;

    // Record timeout
    playerState.timeoutsInWindow.push(this.currentHandNumber);
    this.checkAutoSitOut(this.activePlayerId);

    // Determine forced action: check if possible, else fold
    const forcedAction = 'check_or_fold'; // Will be validated by poker engine

    this.emitEvent({
      type: 'action_forced',
      playerId: this.activePlayerId,
      remainingMs: 0,
      forcedAction
    });

    this.stopTimer();
  }

  /**
   * Handle time bank depletion
   */
  private handleTimeBankDepletion(): void {
    if (!this.activePlayerId) return;

    const playerState = this.playerStates.get(this.activePlayerId);
    if (playerState) {
      playerState.timeBankMs = 0;
    }

    this.emitEvent({
      type: 'timebank_depleted',
      playerId: this.activePlayerId,
      remainingMs: 0,
      timeBankMs: 0
    });

    this.handleTimerExpiry('timebank_depleted');
  }

  /**
   * Stop active timer
   */
  public stopTimer(): void {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = undefined;
    }

    // Update street dwell tracking
    if (this.activePlayerId) {
      const playerState = this.playerStates.get(this.activePlayerId);
      if (playerState && playerState.streetStartMs) {
        const elapsed = Date.now() - this.timerStartMs;
        playerState.streetDwellUsedMs += elapsed;
      }
    }

    this.activePlayerId = undefined;
    this.usingTimeBank = false;
  }

  /**
   * Manually consume time bank (when player clicks +TIME button)
   */
  public consumeTimeBank(playerId: string): boolean {
    const playerState = this.playerStates.get(playerId);
    if (!playerState || playerState.timeBankMs <= 0) {
      return false;
    }

    if (this.activePlayerId === playerId && !this.usingTimeBank) {
      this.switchToTimeBank();
      return true;
    }

    return false;
  }

  /**
   * Queue a pre-action for a player
   */
  public queuePreAction(playerId: string, action: QueuedAction): void {
    const playerState = this.playerStates.get(playerId);
    if (playerState) {
      playerState.queuedAction = action;
    }
  }

  /**
   * Clear queued action
   */
  public clearQueuedAction(playerId: string): void {
    const playerState = this.playerStates.get(playerId);
    if (playerState) {
      playerState.queuedAction = undefined;
    }
  }

  /**
   * Execute a queued action
   */
  private executeQueuedAction(playerId: string): void {
    const playerState = this.playerStates.get(playerId);
    if (!playerState || !playerState.queuedAction) return;

    const action = playerState.queuedAction;
    playerState.queuedAction = undefined;

    this.emitEvent({
      type: 'action_forced',
      playerId,
      remainingMs: 0,
      forcedAction: action.type
    });
  }

  /**
   * Handle player disconnect
   */
  public onPlayerDisconnect(playerId: string): void {
    const playerState = this.playerStates.get(playerId);
    if (playerState) {
      playerState.isDisconnected = true;
      playerState.disconnectStartMs = Date.now();
    }
  }

  /**
   * Handle player reconnect
   */
  public onPlayerReconnect(playerId: string): void {
    const playerState = this.playerStates.get(playerId);
    if (playerState) {
      playerState.isDisconnected = false;
      playerState.disconnectStartMs = undefined;
    }
  }

  /**
   * Check if player should be auto-sitting out
   */
  private checkAutoSitOut(playerId: string): void {
    const playerState = this.playerStates.get(playerId);
    if (!playerState) return;

    // Clean up old timeouts outside the window
    const windowStart = this.currentHandNumber - this.config.autoSitOutHandsWindow;
    playerState.timeoutsInWindow = playerState.timeoutsInWindow.filter(
      hand => hand > windowStart
    );

    // Check if threshold exceeded
    if (playerState.timeoutsInWindow.length >= this.config.autoSitOutTimeouts) {
      playerState.isSittingOut = true;
      console.log(`Player ${playerId} auto-sitting out due to repeated timeouts`);
    }
  }

  /**
   * Manually set sit-out status
   */
  public setSitOut(playerId: string, sitOut: boolean): void {
    const playerState = this.playerStates.get(playerId);
    if (playerState) {
      playerState.isSittingOut = sitOut;
      if (!sitOut) {
        playerState.timeoutsInWindow = [];
      }
    }
  }

  /**
   * Reset street tracking (call on new street)
   */
  public onNewStreet(): void {
    // Reset street tracking for all players
    for (const playerState of this.playerStates.values()) {
      playerState.streetStartMs = undefined;
      playerState.streetDwellUsedMs = 0;
    }
  }

  /**
   * On new hand - accrue time bank
   */
  public onNewHand(): void {
    this.currentHandNumber++;

    for (const playerState of this.playerStates.values()) {
      playerState.handsPlayed++;
      
      // Accrue time bank
      if (playerState.handsPlayed % this.config.timeBankAccrualHands === 0) {
        playerState.timeBankMs = Math.min(
          playerState.timeBankMs + this.config.timeBankAccrualMs,
          this.config.timeBankCapMs
        );
      }

      // Reset street tracking
      playerState.streetStartMs = undefined;
      playerState.streetDwellUsedMs = 0;
    }
  }

  /**
   * Apply all-in pause
   */
  public async applyAllInPause(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, this.config.allInPauseMs);
    });
  }

  /**
   * Start showdown window
   */
  public startShowdownWindow(playerId: string, callback: () => void): void {
    setTimeout(callback, this.config.showdownWindowMs);
  }

  /**
   * Get player timer state (for UI sync)
   */
  public getPlayerState(playerId: string): PlayerTimerState | undefined {
    return this.playerStates.get(playerId);
  }

  /**
   * Get all player states
   */
  public getAllStates(): Map<string, PlayerTimerState> {
    return new Map(this.playerStates);
  }

  /**
   * Emit timer event
   */
  private emitEvent(event: TimerEvent): void {
    if (this.onTimerEvent) {
      this.onTimerEvent(event);
    }
  }

  /**
   * Reset entire system
   */
  public reset(): void {
    this.stopTimer();
    this.playerStates.clear();
    this.currentHandNumber = 0;
  }
}
