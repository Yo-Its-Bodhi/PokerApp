// Player Level System
// Calculate player level based on hands played and performance stats

export interface PlayerLevelInfo {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  progressPercent: number;
}

/**
 * Calculate player level based on hands played and performance
 * Formula: Base XP from hands played + bonus XP from win rate
 * 
 * Level progression:
 * - Level 1-10: 50 hands per level
 * - Level 11-20: 75 hands per level  
 * - Level 21+: 100 hands per level
 * 
 * Bonus XP from win rate:
 * - 0-20%: No bonus
 * - 21-40%: +10% XP
 * - 41-60%: +20% XP
 * - 61%+: +30% XP
 */
export function calculatePlayerLevel(
  handsPlayed: number,
  handsWon: number = 0
): PlayerLevelInfo {
  const winRate = handsPlayed > 0 ? (handsWon / handsPlayed) * 100 : 0;
  
  // Calculate bonus multiplier based on win rate
  let bonusMultiplier = 1.0;
  if (winRate > 60) bonusMultiplier = 1.3;
  else if (winRate > 40) bonusMultiplier = 1.2;
  else if (winRate > 20) bonusMultiplier = 1.1;
  
  // Base experience from hands played
  const baseXP = handsPlayed;
  
  // Apply bonus multiplier
  const totalXP = Math.floor(baseXP * bonusMultiplier);
  
  // Calculate level based on progressive requirements
  let level = 1;
  let xpRemaining = totalXP;
  let xpForNextLevel = 50; // Level 1-10: 50 hands per level
  
  while (xpRemaining >= xpForNextLevel) {
    xpRemaining -= xpForNextLevel;
    level++;
    
    // Adjust XP requirement based on level tier
    if (level <= 10) {
      xpForNextLevel = 50;
    } else if (level <= 20) {
      xpForNextLevel = 75;
    } else {
      xpForNextLevel = 100;
    }
  }
  
  // Calculate progress to next level
  const progressPercent = (xpRemaining / xpForNextLevel) * 100;
  
  return {
    level,
    experience: xpRemaining,
    experienceToNextLevel: xpForNextLevel,
    progressPercent: Math.round(progressPercent)
  };
}

/**
 * Get level badge color based on level tier
 */
export function getLevelBadgeColor(level: number): {
  bg: string;
  border: string;
  text: string;
  glow: string;
} {
  if (level >= 50) {
    // Legend (50+): Red/Gold
    return {
      bg: 'from-red-600 via-amber-500 to-red-600',
      border: 'border-amber-400',
      text: 'text-amber-100',
      glow: 'rgba(251, 191, 36, 0.6)'
    };
  } else if (level >= 30) {
    // Master (30-49): Purple
    return {
      bg: 'from-purple-600 via-purple-500 to-purple-600',
      border: 'border-purple-400',
      text: 'text-purple-100',
      glow: 'rgba(168, 85, 247, 0.6)'
    };
  } else if (level >= 20) {
    // Expert (20-29): Cyan
    return {
      bg: 'from-cyan-600 via-cyan-500 to-cyan-600',
      border: 'border-cyan-400',
      text: 'text-cyan-100',
      glow: 'rgba(6, 182, 212, 0.6)'
    };
  } else if (level >= 10) {
    // Skilled (10-19): Green
    return {
      bg: 'from-emerald-600 via-emerald-500 to-emerald-600',
      border: 'border-emerald-400',
      text: 'text-emerald-100',
      glow: 'rgba(16, 185, 129, 0.6)'
    };
  } else {
    // Beginner (1-9): Blue
    return {
      bg: 'from-blue-600 via-blue-500 to-blue-600',
      border: 'border-blue-400',
      text: 'text-blue-100',
      glow: 'rgba(37, 99, 235, 0.6)'
    };
  }
}

/**
 * Get level rank name
 */
export function getLevelRank(level: number): string {
  if (level >= 50) return 'Legend';
  if (level >= 30) return 'Master';
  if (level >= 20) return 'Expert';
  if (level >= 10) return 'Skilled';
  return 'Beginner';
}
