// Local session stats tracking for play-money poker

export interface SessionStats {
  // Session info
  sessionStart: number; // Timestamp
  playerAlias: string;
  
  // Hand statistics
  handsPlayed: number;
  handsWon: number;
  handsFolded: number;
  handsLost: number;
  
  // Money statistics
  biggestPot: number;
  biggestWin: number;
  biggestLoss: number;
  totalWinnings: number; // Can be negative
  
  // Action statistics
  totalBets: number;
  totalRaises: number;
  totalCalls: number;
  totalFolds: number;
  totalChecks: number;
  totalAllIns: number;
  
  // All-in statistics
  allInAttempts: number;
  allInWins: number;
  allInLosses: number;
  
  // Showdown statistics
  showdownsReached: number;
  showdownsWon: number;
  
  // Current session
  currentStreak: number; // Win streak (positive) or loss streak (negative)
  longestWinStreak: number;
  currentBalance: number;
  startingBalance: number;
}

const STATS_STORAGE_KEY = 'poker_session_stats';

// Initialize new session
export const initializeStats = (playerAlias: string, startingBalance: number): SessionStats => {
  return {
    sessionStart: Date.now(),
    playerAlias,
    handsPlayed: 0,
    handsWon: 0,
    handsFolded: 0,
    handsLost: 0,
    biggestPot: 0,
    biggestWin: 0,
    biggestLoss: 0,
    totalWinnings: 0,
    totalBets: 0,
    totalRaises: 0,
    totalCalls: 0,
    totalFolds: 0,
    totalChecks: 0,
    totalAllIns: 0,
    allInAttempts: 0,
    allInWins: 0,
    allInLosses: 0,
    showdownsReached: 0,
    showdownsWon: 0,
    currentStreak: 0,
    longestWinStreak: 0,
    currentBalance: startingBalance,
    startingBalance,
  };
};

// Load stats from localStorage
export const loadStats = (): SessionStats | null => {
  try {
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
  return null;
};

// Save stats to localStorage
export const saveStats = (stats: SessionStats): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
};

// Clear stats
export const clearStats = (): void => {
  try {
    localStorage.removeItem(STATS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear stats:', error);
  }
};

// Update stats after a hand
export const updateStatsAfterHand = (
  currentStats: SessionStats,
  data: {
    won: boolean;
    potSize: number;
    amountWon?: number;
    amountLost?: number;
    folded?: boolean;
    wentAllIn?: boolean;
    reachedShowdown?: boolean;
    wonShowdown?: boolean;
    currentBalance: number;
  }
): SessionStats => {
  const newStats = { ...currentStats };
  
  // Update hand counts
  newStats.handsPlayed++;
  
  if (data.won) {
    newStats.handsWon++;
    newStats.currentStreak = Math.max(0, newStats.currentStreak) + 1;
    newStats.longestWinStreak = Math.max(newStats.longestWinStreak, newStats.currentStreak);
  } else if (data.folded) {
    newStats.handsFolded++;
    newStats.handsLost++;
    newStats.currentStreak = Math.min(0, newStats.currentStreak) - 1;
  } else {
    newStats.handsLost++;
    newStats.currentStreak = Math.min(0, newStats.currentStreak) - 1;
  }
  
  // Update pot size
  if (data.potSize > newStats.biggestPot) {
    newStats.biggestPot = data.potSize;
  }
  
  // Update winnings/losses
  if (data.amountWon && data.amountWon > 0) {
    newStats.totalWinnings += data.amountWon;
    if (data.amountWon > newStats.biggestWin) {
      newStats.biggestWin = data.amountWon;
    }
  }
  
  if (data.amountLost && data.amountLost > 0) {
    newStats.totalWinnings -= data.amountLost;
    if (data.amountLost > newStats.biggestLoss) {
      newStats.biggestLoss = data.amountLost;
    }
  }
  
  // Update all-in stats
  if (data.wentAllIn) {
    newStats.allInAttempts++;
    if (data.won) {
      newStats.allInWins++;
    } else {
      newStats.allInLosses++;
    }
  }
  
  // Update showdown stats
  if (data.reachedShowdown) {
    newStats.showdownsReached++;
    if (data.wonShowdown) {
      newStats.showdownsWon++;
    }
  }
  
  // Update current balance
  newStats.currentBalance = data.currentBalance;
  
  return newStats;
};

// Update stats after an action
export const updateStatsAfterAction = (
  currentStats: SessionStats,
  action: 'bet' | 'raise' | 'call' | 'fold' | 'check' | 'allin'
): SessionStats => {
  const newStats = { ...currentStats };
  
  switch (action) {
    case 'bet':
      newStats.totalBets++;
      break;
    case 'raise':
      newStats.totalRaises++;
      break;
    case 'call':
      newStats.totalCalls++;
      break;
    case 'fold':
      newStats.totalFolds++;
      break;
    case 'check':
      newStats.totalChecks++;
      break;
    case 'allin':
      newStats.totalAllIns++;
      break;
  }
  
  return newStats;
};

// Calculate derived statistics
export const calculateDerivedStats = (stats: SessionStats) => {
  const winRate = stats.handsPlayed > 0 
    ? ((stats.handsWon / stats.handsPlayed) * 100).toFixed(1)
    : '0.0';
  
  const allInSuccessRate = stats.allInAttempts > 0
    ? ((stats.allInWins / stats.allInAttempts) * 100).toFixed(1)
    : '0.0';
  
  const showdownSuccessRate = stats.showdownsReached > 0
    ? ((stats.showdownsWon / stats.showdownsReached) * 100).toFixed(1)
    : '0.0';
  
  const netProfit = stats.currentBalance - stats.startingBalance;
  const profitPerHand = stats.handsPlayed > 0
    ? (netProfit / stats.handsPlayed).toFixed(0)
    : '0';
  
  const sessionDuration = Date.now() - stats.sessionStart;
  const hours = Math.floor(sessionDuration / (1000 * 60 * 60));
  const minutes = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));
  const durationText = hours > 0 
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;
  
  return {
    winRate,
    allInSuccessRate,
    showdownSuccessRate,
    netProfit,
    profitPerHand,
    durationText,
    isProfit: netProfit >= 0,
  };
};

// Export stats as JSON
export const exportStats = (stats: SessionStats): string => {
  const derived = calculateDerivedStats(stats);
  const exportData = {
    ...stats,
    derived,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportData, null, 2);
};

// Download stats as file
export const downloadStats = (stats: SessionStats): void => {
  const json = exportStats(stats);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `poker-stats-${stats.playerAlias}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
