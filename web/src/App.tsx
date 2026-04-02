import './index.css';
import './responsive-fix.css';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ethers } from 'ethers';
import { useTheme } from './hooks/useTheme';
import EthereumProvider from '@walletconnect/ethereum-provider';
import { initializeViewportScaling } from './utils/viewportScaler';
import SplashScreen from './components/SplashScreen.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import MembersDashboard from './components/MembersDashboard.tsx';
import Lobby from './components/Lobby.tsx';
import RealisticTable from './components/RealisticTable.tsx';
import FairnessPane from './components/FairnessPane.tsx';
import WinningHandsPanel from './components/WinningHandsPanel.tsx';
import WinningHandBanner from './components/WinningHandBanner.tsx';
import PlayersList from './components/PlayersList.tsx';
import FairnessInfo from './components/FairnessInfo.tsx';
import Chat from './components/Chat.tsx';
import GameLog from './components/GameLog.tsx';
import Actions from './components/Actions.tsx';
import HandStrength from './components/HandStrength.tsx';
import SessionStats from './components/SessionStats.tsx';
import Leaderboard, { PlayerStats } from './components/Leaderboard.tsx';
import LiveTableStats from './components/LiveTableStats.tsx';
import TableStatsDetailsModal from './components/TableStatsDetailsModal.tsx';
import { playTurnNotification, playCardWoosh, playCardFlip, playChipBet, playWinPot, playFold, playButtonClick, playSliderTick, playRaise, playCheck, audioSystem } from './utils/audioSystem';
import SoundSettingsPanel from './components/SoundSettingsPanel.tsx';
import ErrorModal, { useErrorHandler } from './components/ErrorModal.tsx';
import { LoadingOverlay } from './components/LoadingStates.tsx';
import { useKeyboardShortcuts, POKER_SHORTCUTS } from './utils/keyboardShortcuts';
import SessionStatsModal from './components/SessionStatsModal.tsx';
import { SessionStats as SessionStatsType, initializeStats, loadStats, saveStats, updateStatsAfterHand, updateStatsAfterAction } from './utils/sessionStats';
import { addHandToHistory, getOrCreateProfile, loadProfile, saveProfile } from './utils/userProfile';
import WinnerPopup from './components/WinnerPopup.tsx';
import PlayerAura from './components/PlayerAura.tsx';
import FlyingCard from './components/FlyingCard.tsx';
import MobileFullscreenButton from './components/MobileFullscreenButton.tsx';
import BankingModal from './components/BankingModal.tsx';
import { DealerMessage } from './components/DealerMessage.tsx';
import { MultiChipSlide } from './components/ChipSlideAnimation.tsx';
import { ShowdownButtons } from './components/ShowdownButtons.tsx';
import VictoryAnimation from './components/VictoryAnimation.tsx';
import DevPanel from './components/DevPanel.tsx';
import MovableResizablePanel from './components/MovableResizablePanel.tsx';
import { Hand } from 'pokersolver';

// Helper function to convert card numbers to display
const cardToString = (cardNum: number): { suit: string, rank: string, color: string } => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const suit = suits[Math.floor(cardNum / 13)];
  const rank = ranks[cardNum % 13];
  const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
  
  return { suit, rank, color };
};

// Helper function to evaluate poker hand using pokersolver
const evaluatePokerHand = (holeCards: number[], communityCards: number[]): string => {
  try {
    const suits = ['s', 'h', 'd', 'c']; // spades, hearts, diamonds, clubs
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    
    // Convert card numbers to pokersolver format (e.g., "Ah", "Ks", "2d")
    const allCards = [...holeCards, ...communityCards];
    const formattedCards = allCards.map(cardNum => {
      const suit = suits[Math.floor(cardNum / 13)];
      const rank = ranks[cardNum % 13];
      return rank + suit;
    });
    
    const hand = Hand.solve(formattedCards);
    return hand.descr || 'Unknown Hand';
  } catch (error) {
    console.error('[evaluatePokerHand] Error:', error);
    return 'Unknown Hand';
  }
};

type TableMode = 'REAL_PVP';
type WalletProviderType = 'metamask' | 'keplr' | 'walletconnect';

type RubyIntentId =
  | 'blinds'
  | 'fold'
  | 'raise'
  | 'call_check'
  | 'all_in'
  | 'hand_rankings'
  | 'position'
  | 'bluffing'
  | 'odds'
  | 'showdown'
  | 'sit_out'
  | 'bankroll'
  | 'help'
  | 'thanks'
  | 'greeting';

type RubyIntentRule = {
  id: RubyIntentId;
  patterns: RegExp[];
  keywords: string[];
  response: string;
};

type RubyIntentMatch = {
  rule: RubyIntentRule;
  score: number;
  matchedKeywords: string[];
};

type RubyTelemetryEntry = {
  timestamp: number;
  originalMessage: string;
  normalizedMessage: string;
  intent: RubyIntentId | 'fallback';
  confidence: number;
};

const RUBY_TELEMETRY_KEY = 'poker.ruby.telemetry.v1';

const RUBY_INTENT_LABELS: Record<RubyIntentId, string> = {
  blinds: 'Blinds',
  fold: 'Folding',
  raise: 'Betting and Raising',
  call_check: 'Call and Check',
  all_in: 'All-in',
  hand_rankings: 'Hand Rankings',
  position: 'Position',
  bluffing: 'Bluffing',
  odds: 'Odds and Equity',
  showdown: 'Showdown',
  sit_out: 'Sit Out',
  bankroll: 'Bankroll and Top-up',
  help: 'General Help',
  thanks: 'Thanks',
  greeting: 'Greeting'
};

const RUBY_STOP_WORDS = new Set([
  'the', 'a', 'an', 'to', 'for', 'with', 'and', 'or', 'in', 'on', 'at', 'my', 'your', 'our', 'their',
  'is', 'are', 'am', 'be', 'it', 'this', 'that', 'of', 'from', 'as', 'if', 'i', 'you', 'we', 'they',
  'me', 'us', 'them', 'can', 'could', 'would', 'should', 'do', 'does', 'did', 'what', 'how', 'why',
  'when', 'where', 'who', 'about', 'please', 'tell', 'explain'
]);

const RUBY_NORMALIZATION_RULES: Array<[RegExp, string]> = [
  [/\bc[-\s]?bet(?:s|ting)?\b/, ' continuation bet '],
  [/\b3[-\s]?bet(?:s|ting)?\b/, ' three bet raise '],
  [/\b4[-\s]?bet(?:s|ting)?\b/, ' four bet raise '],
  [/\bshove(?:d|s|ing)?\b/, ' all in '],
  [/\bjam(?:med|s|ming)?\b/, ' all in '],
  [/\bship it\b/, ' all in '],
  [/\bmuck(?:ed|ing)?\b/, ' fold '],
  [/\bbtn\b/, ' button position '],
  [/\butg\b/, ' under the gun position '],
  [/\bco\b/, ' cutoff position '],
  [/\bsb\b/, ' small blind '],
  [/\bbb\b/, ' big blind ']
];

const RUBY_INTENTS: RubyIntentRule[] = [
  {
    id: 'blinds',
    patterns: [/\bblind(s)?\b/, /\bsmall blind\b/, /\bbig blind\b/, /\bforced bet(s)?\b/],
    keywords: ['blind', 'small blind', 'big blind', 'forced bet', 'posting'],
    response: "Great question. Blinds are forced bets that keep action moving. Small Blind posts first, Big Blind posts next, and both rotate clockwise each hand."
  },
  {
    id: 'fold',
    patterns: [/\bfold(ing|ed)?\b/, /\blay down\b/, /\bgive up\b/],
    keywords: ['fold', 'muck', 'lay down', 'give up'],
    response: "Folding means you give up the current hand and stop investing chips in that pot. It is often the highest-EV choice when your equity is too low."
  },
  {
    id: 'raise',
    patterns: [/\braise\b/, /\bbet(ting)?\b/, /\bre[-\s]?raise\b/, /\bthree bet\b/, /\bfour bet\b/],
    keywords: ['raise', 'bet', 're raise', 'three bet', 'four bet', 'value'],
    response: "Raising increases the price to continue, which can build the pot for value or force folds. Opponents must call, re-raise, or fold."
  },
  {
    id: 'call_check',
    patterns: [/\bcall\b/, /\bcheck\b/, /\bflat call\b/, /\bcheck back\b/],
    keywords: ['call', 'check', 'flat', 'check back'],
    response: "Call matches the current bet. Check passes action when no bet is facing you. Choosing correctly depends on position, hand strength, and board texture."
  },
  {
    id: 'all_in',
    patterns: [/\ball\s*in\b/, /\bpush\b/, /\bcommit stack\b/],
    keywords: ['all in', 'jam', 'shove', 'stack off', 'push'],
    response: "All-in commits your full table stack. If stacks differ, side pots are created. It is high variance, so stack depth and fold equity matter a lot."
  },
  {
    id: 'hand_rankings',
    patterns: [
      /\bhand ranking(s)?\b/, /\bwhat beats\b/, /\bflush\b/, /\bstraight\b/, /\bfull house\b/, /\bpair\b/, /\bkicker\b/
    ],
    keywords: ['ranking', 'flush', 'straight', 'full house', 'pair', 'two pair', 'kicker', 'nuts'],
    response: "Hand strength order is: high card, pair, two pair, trips, straight, flush, full house, quads, straight flush, royal flush. Kickers break many ties."
  },
  {
    id: 'position',
    patterns: [/\bposition\b/, /\bbutton\b/, /\bcutoff\b/, /\bunder the gun\b/, /\blate position\b/],
    keywords: ['position', 'button', 'cutoff', 'utg', 'late position', 'in position'],
    response: "Position is one of the biggest edges in poker. Acting later gives more information, enabling thinner value bets and cheaper bluffs."
  },
  {
    id: 'bluffing',
    patterns: [/\bbluff(ing|ed)?\b/, /\bcontinuation bet\b/, /\bsemi bluff\b/],
    keywords: ['bluff', 'continuation bet', 'semi bluff', 'represent'],
    response: "Bluffing works best when your line is credible and your opponent has enough folds. Mix value and bluffs so your betting ranges stay balanced."
  },
  {
    id: 'odds',
    patterns: [/\bpot odds\b/, /\bodds\b/, /\bequity\b/, /\bouts\b/, /\bimplied odds\b/],
    keywords: ['pot odds', 'odds', 'equity', 'outs', 'implied odds'],
    response: "Pot odds compare call cost to pot size. Compare required equity to your actual equity; call when equity is higher than the price you are getting."
  },
  {
    id: 'showdown',
    patterns: [/\bshowdown\b/, /\bshow cards\b/, /\bmuck\b/, /\breveal\b/],
    keywords: ['showdown', 'show', 'muck', 'reveal'],
    response: "At showdown, remaining players reveal cards and the best 5-card hand wins. If you are not required to show, you may usually muck."
  },
  {
    id: 'sit_out',
    patterns: [/\bsit out\b/, /\bsitting out\b/, /\bafk\b/, /\btake a break\b/],
    keywords: ['sit out', 'sitting out', 'afk', 'break'],
    response: "Sit Out removes you from future hands until you return. Use it when you need a pause without leaving the table completely."
  },
  {
    id: 'bankroll',
    patterns: [/\bchip(s)?\b/, /\bbalance\b/, /\bbankroll\b/, /\btop up\b/, /\bdeposit\b/, /\bescrow\b/],
    keywords: ['chips', 'balance', 'bankroll', 'top up', 'deposit', 'escrow', 'fund seat', 'bank'],
    response: "Your bankroll is your on-chain wSHIDO balance. Fund seat escrow to play, and claim back to your wallet when you stand up."
  },
  {
    id: 'help',
    patterns: [/\bhelp\b/, /\bhow do i\b/, /\bhow to\b/, /\bwhat is\b/, /\bexplain\b/],
    keywords: ['help', 'how', 'what', 'explain', 'guide'],
    response: "Ask me anything in plain language. I can help with rules, hand strength, betting lines, position, bankroll flow, and table actions."
  },
  {
    id: 'thanks',
    patterns: [/\bthanks\b/, /\bthank you\b/, /\bappreciate\b/],
    keywords: ['thanks', 'thank', 'appreciate'],
    response: "Anytime. Keep the questions coming and I will help you make cleaner poker decisions."
  },
  {
    id: 'greeting',
    patterns: [/\bhello\b/, /\bhey\b/, /\bhi\b/, /\byo\b/],
    keywords: ['hello', 'hey', 'hi', 'yo'],
    response: "Hey. Ask me any poker question in your own words and I will do my best to map it to the right concept."
  }
];

const RUBY_FALLBACK_RESPONSES = [
  "I did not fully map that yet. Try adding one poker anchor word like blinds, range, all-in, odds, position, or bankroll.",
  "I might be missing that phrase. Reword it with the game spot, action, and goal, for example: 'preflop, 20bb, should I jam?'.",
  "Good question. I can answer faster if you include context like street, stack size, and whether you face a bet."
];

const RUBY_INPUT_HINT = 'Ask naturally: "Can I jam preflop with 12bb?" or "Why did my two pair lose?"';

const normalizeRubyMessage = (raw: string): string => {
  let normalized = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  for (const [pattern, replacement] of RUBY_NORMALIZATION_RULES) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized.replace(/\s+/g, ' ').trim();
};

const scoreRubyIntent = (normalizedMessage: string, rule: RubyIntentRule): RubyIntentMatch | null => {
  let score = 0;
  const matchedKeywords: string[] = [];
  const tokenSet = new Set(normalizedMessage.split(' ').filter(Boolean));

  for (const pattern of rule.patterns) {
    if (pattern.test(normalizedMessage)) {
      score += 3;
    }
  }

  for (const keyword of rule.keywords) {
    if (keyword.includes(' ')) {
      if (normalizedMessage.includes(keyword)) {
        score += 2;
        matchedKeywords.push(keyword);
      }
      continue;
    }

    if (tokenSet.has(keyword)) {
      score += 1;
      matchedKeywords.push(keyword);
    }
  }

  if (score === 0) return null;
  return {
    rule,
    score,
    matchedKeywords: Array.from(new Set(matchedKeywords))
  };
};

const isRubyInsightsRequest = (normalizedMessage: string): boolean => {
  return /\b(common questions|what do people ask|how are people talking|chat insights|analytics|question patterns|user questions)\b/.test(normalizedMessage);
};

const isRubyTrainingRequest = (normalizedMessage: string): boolean => {
  return /\b(feed ruby|teach ruby|train ruby|improve ruby|specific way|natural language|understand better)\b/.test(normalizedMessage);
};

const loadRubyTelemetry = (): RubyTelemetryEntry[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RUBY_TELEMETRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.normalizedMessage === 'string')
      .slice(-200) as RubyTelemetryEntry[];
  } catch {
    return [];
  }
};

const saveRubyTelemetry = (entry: RubyTelemetryEntry): void => {
  if (typeof window === 'undefined') return;

  try {
    const existing = loadRubyTelemetry();
    const updated = [...existing, entry].slice(-200);
    window.localStorage.setItem(RUBY_TELEMETRY_KEY, JSON.stringify(updated));
  } catch {
    // Swallow storage errors so chat UX never breaks.
  }
};

const summarizeRubyTelemetry = (entries: RubyTelemetryEntry[]): string => {
  if (entries.length === 0) {
    return 'I do not have enough chat data yet. Ask me a few poker questions, then ask for chat insights and I will summarize what players ask most.';
  }

  const recent = entries.slice(-120);
  const intentCounts = new Map<RubyIntentId, number>();
  let fallbackCount = 0;
  const fallbackTerms: string[] = [];

  for (const entry of recent) {
    if (entry.intent === 'fallback') {
      fallbackCount += 1;
      const terms = entry.normalizedMessage
        .split(' ')
        .filter((word) => word.length > 2)
        .filter((word) => !RUBY_STOP_WORDS.has(word))
        .filter((word) => !/^\d+$/.test(word));
      fallbackTerms.push(...terms);
      continue;
    }

    intentCounts.set(entry.intent, (intentCounts.get(entry.intent) || 0) + 1);
  }

  const topTopics = Array.from(intentCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([intent, count]) => `${RUBY_INTENT_LABELS[intent]} (${count})`);

  const fallbackRate = Math.round((fallbackCount / recent.length) * 100);

  const unclearTerms = Array.from(
    fallbackTerms.reduce((map, term) => {
      map.set(term, (map.get(term) || 0) + 1);
      return map;
    }, new Map<string, number>()).entries()
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([term]) => term);

  let summary = `From my last ${recent.length} chats, top topics are ${topTopics.length > 0 ? topTopics.join(', ') : 'still forming'}. `;
  summary += `${fallbackRate}% of messages were unclear.`;

  if (unclearTerms.length > 0) {
    summary += ` Most unclear terms: ${unclearTerms.join(', ')}.`;
  }

  summary += ' Add those terms as aliases in my intent map and I will understand natural phrasing much better.';
  return summary;
};

function App() {
  // Multiplayer configuration (set in `web/.env.production` or `web/.env`)
  const MULTIPLAYER_ENABLED = String(process.env.NEXT_PUBLIC_MULTIPLAYER_ENABLED ?? 'true').toLowerCase() !== 'false';
  const SERVER_URL = String(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001');
  const TABLE_ESCROW_ADDRESS = String(process.env.NEXT_PUBLIC_TABLE_ESCROW_ADDRESS || '').trim();
  const WSHIDO_TOKEN_ADDRESS = String(process.env.NEXT_PUBLIC_WSHIDO_TOKEN_ADDRESS || '').trim();
  const WALLETCONNECT_PROJECT_ID = String(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '').trim();
  const ONCHAIN_ESCROW_CONFIGURED = TABLE_ESCROW_ADDRESS.length > 0 && WSHIDO_TOKEN_ADDRESS.length > 0;
  const DEFAULT_TABLE_MODE: TableMode = 'REAL_PVP';
  const DEFAULT_MIN_TOP_UP = Math.max(1000, Math.floor(Number(process.env.NEXT_PUBLIC_DEFAULT_BUY_IN || 1000)));
  const ONBOARDING_DISMISS_KEY = 'poker.quickstart.dismissed.v1';

  // 🎮 UNIQUE SESSION ID - Each player gets their own game instance
  const [sessionId] = useState(() => {
    // Check if player already has a session ID in localStorage
    let id = localStorage.getItem('poker-session-id');
    if (!id) {
      // Generate new unique session ID
      id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('poker-session-id', id);
      console.log('[Session] Created new session ID:', id);
    } else {
      console.log('[Session] Using existing session ID:', id);
    }
    return id;
  });

  // 🎮 APP STATE - Login Flow
  const [appState, setAppState] = useState<'SPLASH' | 'LOGIN' | 'LOBBY' | 'GAME'>('SPLASH');
  const [showMembersDashboard, setShowMembersDashboard] = useState(false);
  
  const [betAmount, setBetAmount] = useState(1000);
  const [balance, setBalance] = useState(0);
  const [pot, setPot] = useState(0);
  const [gameMessage, setGameMessage] = useState('');
  
  // Wallet & Connection State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletProviderType, setWalletProviderType] = useState<WalletProviderType | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [hasKeplr, setHasKeplr] = useState(false);
  const [playerAlias, setPlayerAlias] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState('special');

  // Avatar categories with 9 options each (use 'IMG:' prefix for image-based avatars)
  const avatarCategories: { [key: string]: string[] } = {
    special: ['IMG:neon-heart', '⭐', '🌟', '💫', '☄️', '✨', '💎', '🏆', '👑'],
    animals: ['🦊', '🐉', '🦁', '🐺', '🦅', '🐯', '🦈', '🐻', '🐨'],
    smileys: ['�', '😎', '🤓', '😈', '🤡', '😱', '🥳', '😂', '🤯'],
    fantasy: ['�👑', '🎭', '👽', '👾', '🧛', '🧝', '🧙', '🧟', '🧞'],
    food: ['🍔', '🍕', '🌭', '🍟', '🍭', '🍰', '🍺', '🍷', '☕'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏓', '🏏', '⛳', '�'],
    symbols: ['⭐', '�', '⚡', '�', '✨', '�', '❤️', '💎', '🏆'],
    nature: ['🌺', '🌻', '🌳', '🌴', '🌵', '🌼', '🌸', '🌿', '🍀'],
    cosmic: ['🌙', '⭐', '🌟', '💫', '☄️', '🌌', '🌍', '🌑', '🌕'],
    games: ['🎲', '🎯', '🎰', '🎮', '🃏', '♠️', '♥️', '♦️', '♣️']
  };
  
  // Get current avatars based on selected category
  const avatars = avatarCategories[avatarCategory];
  const [isSeated, setIsSeated] = useState(false);
  const [seatNumber, setSeatNumber] = useState(0);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  
  // Game Settings
  const [autoPostBlinds, setAutoPostBlinds] = useState(true);
  const [sitOutNextHand, setSitOutNextHand] = useState(false);
  
  // Deposit/Withdraw
  const [depositAmount, setDepositAmount] = useState(100);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositModalMessage, setDepositModalMessage] = useState('');
  const [depositInFlight, setDepositInFlight] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showFairnessModal, setShowFairnessModal] = useState(false);
  
  // Socket and Game State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [communityCards, setCommunityCards] = useState<number[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<number>(-1);
  const [showLobby, setShowLobby] = useState(true);
  const [messages, setMessages] = useState<{ user: string, text: string, seat?: number }[]>([]);
  const [tableMode, setTableMode] = useState<TableMode>(DEFAULT_TABLE_MODE);
  const [demoMode, setDemoMode] = useState(false);
  const [myCards, setMyCards] = useState<number[]>([]);
  const [gameLog, setGameLog] = useState<{ action: string, player: string, timestamp: string, type?: string }[]>([]);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [theme, setTheme] = useTheme();

  const [revealedCards, setRevealedCards] = useState<number>(0); // How many community cards are revealed
  const [totalRakeCollected, setTotalRakeCollected] = useState<number>(0); // House rake
  const [opponentCards, setOpponentCards] = useState<number[]>([]); // Opponent cards for showdown
  const [showOpponentCards, setShowOpponentCards] = useState<boolean>(false); // Show at showdown
  const [autoFold, setAutoFold] = useState<boolean>(false); // Auto-fold when facing any bet
  const [autoCheck, setAutoCheck] = useState<boolean>(false); // Auto-check when no bet (won't call)
  const [validActions, setValidActions] = useState<any>(null); // Server-provided valid actions for current player
  const [recentWinningHands, setRecentWinningHands] = useState<Array<{
    handNumber: number;
    winner: string;
    handType: string;
    potSize: number;
    timestamp: number;
  }>>([]);
  
  // Timer state
  const [timerState, setTimerState] = useState<any>(null);
  const [betweenHandsCountdownMs, setBetweenHandsCountdownMs] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [hexagonsActive, setHexagonsActive] = useState<boolean>(false); // Animate hexagons when timer active
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // Default to collapsed on 1080p-class displays for more playable table area.
    return window.innerHeight <= 1080 || window.innerWidth <= 1920;
  }); // Collapse right side panel
  
  // Professional features
  const { error, handleError, clearError } = useErrorHandler();
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Sound control state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [soundVolume, setSoundVolume] = useState<number>(0.3); // 30% default

  // Session stats - track buy-in amount
  const [sessionBuyIn, setSessionBuyIn] = useState<number>(0);

  // Mobile chat drawer state
  const [chatDrawerOpen, setChatDrawerOpen] = useState<boolean>(false);

  // Session stats tracking
  const [sessionStatsData, setSessionStatsData] = useState<SessionStatsType | null>(null);

  // Pending rebuy - chips queued to be added at start of next hand
  const [pendingRebuy, setPendingRebuy] = useState<number>(0);
  const [showSessionStatsModal, setShowSessionStatsModal] = useState<boolean>(false);

  // Banking Modal & Rebuy System
  const [showBankingModal, setShowBankingModal] = useState<boolean>(false);

  // Player count selection (2-6 players: 1 human + 1-5 AI)
  
  // Win streak tracking for aura system
  const [playerStreaks, setPlayerStreaks] = useState<Map<number, number>>(new Map());
  
  // Flying card animations
  const [flyingCards, setFlyingCards] = useState<Array<{
    id: string;
    card: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    delay: number;
    rank: string;
  }>>([]);

  // Win popup state
  const [winPopups, setWinPopups] = useState<{seat: number, amount: number}[]>([]);

  // Ruby Ace AI Chat
  const [showJackPopup, setShowJackPopup] = useState<boolean>(false);
  const [expandedFaqSection, setExpandedFaqSection] = useState<string | null>(null);
  const [jackChatMessages, setJackChatMessages] = useState<Array<{role: 'user' | 'jack', text: string}>>([
    { role: 'jack', text: "Hey there! I'm Ruby Ace, your AI poker dealer. Ask me anything about poker rules, strategies, or how the game works! 🎰" }
  ]);
  const [jackChatInput, setJackChatInput] = useState<string>('');
  const [jackIsTyping, setJackIsTyping] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showQuickStart, setShowQuickStart] = useState<boolean>(false);
  const [quickStartPrimed, setQuickStartPrimed] = useState<boolean>(false);

  // Rebuy/Broke popup
  const [showRebuyPopup, setShowRebuyPopup] = useState<boolean>(false);
  const [minimumTopUpAmount, setMinimumTopUpAmount] = useState<number>(DEFAULT_MIN_TOP_UP);
  const [rebuyPromptActive, setRebuyPromptActive] = useState<boolean>(false);

  // Refs for auto-actions (to avoid stale closure in timer interval)
  const autoFoldRef = useRef<boolean>(false);
  const autoCheckRef = useRef<boolean>(false);
  const liveAutoActionTurnRef = useRef<string>('');
  
  // Track whose turn it was last update (to prevent duplicate turn notifications)
  const lastCurrentPlayerRef = useRef<number | null>(null);

  // Winning hand banner state
  const [showWinningBanner, setShowWinningBanner] = useState<boolean>(false);
  const [bannerData, setBannerData] = useState<{ winningHand: string; winner: string; potSize: number }>({ 
    winningHand: '', 
    winner: '', 
    potSize: 0 
  });
  const prevPotRef = useRef<number>(0);
  const handNumberRef = useRef<number>(0);
  const lastWinnerHandRef = useRef<number>(0); // Track last hand where banner was shown
  const lastWinLogRef = useRef<string>(''); // Track the exact win message to prevent duplicates
  const lastWinnerPopupRef = useRef<string>(''); // Track if we've shown popup for this win
  const lastMultiplayerResultRef = useRef<string>(''); // Dedupe server-driven winner popup per hand
  const lastProcessedStatsHandRef = useRef<string>('');
  const countedRakeHandIdsRef = useRef<Set<string>>(new Set());

  // Winner popup state (epic popup with cards)
  const [showWinnerPopup, setShowWinnerPopup] = useState<boolean>(false);
  const [winnerPopupData, setWinnerPopupData] = useState<{
    winner: string;
    amount: number;
    winningHand: string;
    winnerCards: number[];
    secondPlace?: { name: string; cards: number[]; handType: string; amountWon?: number };
  } | null>(null);

  // Chip slide animation state
  const [chipSlideWinners, setChipSlideWinners] = useState<Array<{
    seatNumber: number;
    position: { x: number; y: number };
    amount: number;
  }>>([]);

  // Victory animation state
  const [showVictoryAnimation, setShowVictoryAnimation] = useState<boolean>(false);
  const [victoryAnimationType, setVictoryAnimationType] = useState<'royal-flush' | 'straight-flush' | 'four-of-a-kind' | 'full-house' | null>(null);
  const [victoryWinner, setVictoryWinner] = useState<string>('');
  const [victoryPot, setVictoryPot] = useState<number>(0);

  // Dev panel state
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false);

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    address: walletAddress || '0x0000...0000',
    alias: playerAlias || 'Player',
    avatar: avatars[avatarIndex],
    totalWon: 0,
    totalLost: 0,
    handsPlayed: 0,
    handsWon: 0,
    biggestPot: 0,
    totalRakePaid: 0,
    winRate: 0
  });

  // Mobile fullscreen state
  const [isMobileFullscreen, setIsMobileFullscreen] = useState<boolean>(false);

  const walletEventProviderRef = useRef<any>(null);
  const walletConnectProviderRef = useRef<any>(null);
  const accountChangeHandlerRef = useRef<((accounts: string[]) => void) | null>(null);
  const chainChangeHandlerRef = useRef<((chainValue: string | number) => void) | null>(null);
  
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [expandedHeaderMenuSection, setExpandedHeaderMenuSection] = useState<'play' | 'account' | 'support' | null>('play');

  // Table identifier (based on blinds)
  const [currentTableId, setCurrentTableId] = useState<string>('real-pvp-table');
  
  // Load table stats from localStorage (session-specific stats)
  const loadTableStats = (tableId: string) => {
    const savedStats = localStorage.getItem(`poker-table-stats-${sessionId}-${tableId}`);
    if (savedStats) {
      return JSON.parse(savedStats);
    }
    // Default stats for new table
    return {
      totalWagered: 0,
      handsPlayed: 0,
      biggestPot: 0,
      averagePot: 0,
      tableCreatedTime: Date.now(), // When table was first created
      totalPlayers: 0,
      totalFolds: 0,
      totalCalls: 0,
      totalRaises: 0,
      totalAllIns: 0,
      highCardWins: 0,
      pairWins: 0,
      twoPairWins: 0,
      threeOfAKindWins: 0,
      straightWins: 0,
      flushWins: 0,
      fullHouseWins: 0,
      fourOfAKindWins: 0,
      straightFlushWins: 0,
      royalFlushWins: 0,
      mostAggressivePlayer: '',
      tightestPlayer: '',
      biggestWinner: '',
      biggestLoser: '',
      longestWinStreak: 0
    };
  };

  // Table stats tracking (persistent across sessions)
  const [tableStats, setTableStats] = useState(() => loadTableStats(currentTableId));
  const [showStatsDetails, setShowStatsDetails] = useState(false);

  // 🎯 VIEWPORT SCALING - Disabled (using CSS zoom instead)
  // useEffect(() => {
  //   console.log('🎯 Initializing viewport scaling for perfect display on all screen sizes...');
  //   const cleanup = initializeViewportScaling();
  //   return cleanup;
  // }, []);

  // Save table stats to localStorage whenever they change (session-specific)
  useEffect(() => {
    localStorage.setItem(`poker-table-stats-${sessionId}-${currentTableId}`, JSON.stringify(tableStats));
  }, [tableStats, currentTableId, sessionId]);

  // Shift+D keyboard shortcut for dev panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Shift+D (case insensitive - both 'D' and 'd' work)
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        e.stopPropagation(); // Prevent any other handlers
        setShowDevPanel(prev => {
          const newValue = !prev;
          console.log('[Dev Panel] Shift+D pressed - Toggling from', prev, 'to', newValue);
          return newValue;
        });
      }
    };

    // Use capture phase to ensure we get the event first
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []); // Empty dependency array - use callback form of setState

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (quickStartPrimed) return;
    if (appState !== 'LOBBY' || !showLobby) return;

    const dismissed = window.localStorage.getItem(ONBOARDING_DISMISS_KEY) === '1';
    if (!dismissed) {
      setShowQuickStart(true);
    }
    setQuickStartPrimed(true);
  }, [appState, showLobby, quickStartPrimed, ONBOARDING_DISMISS_KEY]);

  // Auto-action wrappers with logging
  const handleAutoFoldChange = (value: boolean) => {
    console.log('[Auto-Actions] Auto-Fold toggled:', value);
    setAutoFold(value);
    autoFoldRef.current = value;
    if (value) {
      setAutoCheck(false);
      autoCheckRef.current = false;
    }
  };

  const handleAutoCheckChange = (value: boolean) => {
    console.log('[Auto-Actions] Auto-Check toggled:', value);
    setAutoCheck(value);
    autoCheckRef.current = value;
    if (value) {
      setAutoFold(false);
      autoFoldRef.current = false;
    }
  };

  // Trigger victory animation for premium hands
  const triggerVictoryAnimation = (handType: 'royal-flush' | 'straight-flush' | 'four-of-a-kind' | 'full-house', winner: string, potSize: number) => {
    console.log('[Victory Animation] Triggering:', handType, 'Winner:', winner, 'Pot:', potSize);
    setVictoryAnimationType(handType);
    setVictoryWinner(winner);
    setVictoryPot(potSize);
    setShowVictoryAnimation(true);
    
    // Play epic sound (reuse existing sounds for now)
    playWinPot();
    setTimeout(() => playWinPot(), 400);
    setTimeout(() => playWinPot(), 800);
  };

  // Test victory animation (for dev panel)
  const testVictoryAnimation = (handType: 'royal-flush' | 'straight-flush' | 'four-of-a-kind' | 'full-house') => {
    triggerVictoryAnimation(handType, 'You', 125000);
  };

  const addGameLog = (action: string, player: string, type?: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
    setGameLog(prev => [...prev, { action, player, timestamp, type }]);
  };

  // Update table stats on hand completion
  const updateTableStats = (potSize: number, winningHand: string, totalWagered: number) => {
    setTableStats((prev: any) => {
      const newHandsPlayed = prev.handsPlayed + 1;
      const newTotalWagered = prev.totalWagered + totalWagered;
      const newBiggestPot = Math.max(prev.biggestPot, potSize);
      const newAveragePot = Math.round(newTotalWagered / newHandsPlayed);

      // Parse winning hand type and increment appropriate counter
      let handTypeUpdate = {};
      if (winningHand.includes('Royal Flush')) {
        handTypeUpdate = { royalFlushWins: prev.royalFlushWins + 1 };
      } else if (winningHand.includes('Straight Flush')) {
        handTypeUpdate = { straightFlushWins: prev.straightFlushWins + 1 };
      } else if (winningHand.includes('Four of a Kind')) {
        handTypeUpdate = { fourOfAKindWins: prev.fourOfAKindWins + 1 };
      } else if (winningHand.includes('Full House')) {
        handTypeUpdate = { fullHouseWins: prev.fullHouseWins + 1 };
      } else if (winningHand.includes('Flush')) {
        handTypeUpdate = { flushWins: prev.flushWins + 1 };
      } else if (winningHand.includes('Straight')) {
        handTypeUpdate = { straightWins: prev.straightWins + 1 };
      } else if (winningHand.includes('Three of a Kind')) {
        handTypeUpdate = { threeOfAKindWins: prev.threeOfAKindWins + 1 };
      } else if (winningHand.includes('Two Pair')) {
        handTypeUpdate = { twoPairWins: prev.twoPairWins + 1 };
      } else if (winningHand.includes('Pair')) {
        handTypeUpdate = { pairWins: prev.pairWins + 1 };
      } else {
        handTypeUpdate = { highCardWins: prev.highCardWins + 1 };
      }

      return {
        ...prev,
        totalWagered: newTotalWagered,
        handsPlayed: newHandsPlayed,
        biggestPot: newBiggestPot,
        averagePot: newAveragePot,
        ...handTypeUpdate
      };
    });
  };

  // Track actions for table stats
  const trackAction = (action: string) => {
    setTableStats((prev: any) => {
      if (action === 'fold') return { ...prev, totalFolds: prev.totalFolds + 1 };
      if (action === 'call') return { ...prev, totalCalls: prev.totalCalls + 1 };
      if (action === 'raise' || action === 'bet') return { ...prev, totalRaises: prev.totalRaises + 1 };
      if (action === 'allin') return { ...prev, totalAllIns: prev.totalAllIns + 1 };
      return prev;
    });
  };

  // Sound control handlers
  const toggleSound = () => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    audioSystem.setEnabled(newEnabled);
  };

  const handleVolumeChange = (newVolume: number) => {
    setSoundVolume(newVolume);
    audioSystem.setVolume(newVolume);
  };

  const handleAction = (action: string, amount?: number) => {
    if (!isSeated) {
      setGameMessage('Must be seated to play! 🪑');
      return;
    }
    
    // Clear timer when action is taken
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimerState(null);

    // Update session stats for action
    if (sessionStatsData && (action === 'bet' || action === 'raise' || action === 'call' || action === 'fold' || action === 'check' || action === 'allin')) {
      const updatedStats = updateStatsAfterAction(sessionStatsData, action);
      setSessionStatsData(updatedStats);
      saveStats(updatedStats);
    }

    // If in demo mode with heads-up game, use the game engine
    if (demoMode && demoGame) {
      demoGame.handlePlayerAction(action, amount);
      // Track action for table stats
      trackAction(action);
      return;
    }

    let actionType: string;
    const shouldMutateLocalPot = !MULTIPLAYER_ENABLED;

    switch(action) {
      case 'fold':
        actionType = 'FOLD';
        playFold();
        setGameMessage('You folded! 😔');
        addGameLog('You fold', 'You', 'fold');
        break;
      case 'check':
        actionType = 'CHECK';
        playCheck();
        setGameMessage('You checked ✋');
        addGameLog('You check', 'You', 'check');
        break;
      case 'call':
        actionType = 'CALL';
        playChipBet();
        setGameMessage('You called! 💰');
        if (shouldMutateLocalPot) setPot(prev => prev + 5000);
        addGameLog('You call 5,000', 'You', 'call');
        break;
      case 'raise':
        actionType = 'RAISE';
        playRaise();
        setGameMessage(`You raised ${amount?.toLocaleString() || 0} SHIDO 🚀`);
        if (shouldMutateLocalPot) {
          setPot(prev => prev + (amount || 0));
          setCurrentBet(amount || 0);
        }
        addGameLog(`You raise to ${amount?.toLocaleString() || 0}`, 'You', 'raise');
        break;
      case 'bet':
        actionType = 'BET';
        playChipBet();
        setGameMessage(`You bet ${amount?.toLocaleString() || 0} SHIDO 💰`);
        if (shouldMutateLocalPot) {
          setPot(prev => prev + (amount || 0));
          setCurrentBet(amount || 0);
        }
        addGameLog(`You bet ${amount?.toLocaleString() || 0}`, 'You', 'bet');
        break;
      case 'allin':
        actionType = 'ALL_IN';
        playRaise();
        setGameMessage('ALL IN! 🔥🔥🔥');
        if (shouldMutateLocalPot) setPot(prev => prev + balance);
        addGameLog(`You go ALL IN (${balance.toLocaleString()})`, 'You', 'raise');
        break;
      default:
        return;
    }

    if (socket) {
      socket.emit('player-action', { action: actionType, amount });
    }
    
    // In demo mode, simulate next player action
    if (demoMode) {
      setTimeout(() => simulateAIAction(), 1500);
    }
    
    setTimeout(() => setGameMessage(''), 3000);
  };

  const simulateAIAction = () => {
    // Move to next player
    setCurrentPlayer(prev => (prev + 1) % players.length);
    
    const player = players[currentPlayer];
    if (!player) return;
    
    // AI Decision Logic based on current bet
    let action: string;
    
    if (currentBet === 0) {
      // No bet to match - can check or bet
      const actions = ['check', 'bet'];
      action = actions[Math.floor(Math.random() * actions.length)];
    } else {
      // There's a bet to match - must call, raise, or fold
      const random = Math.random();
      if (random < 0.3) {
        action = 'fold';
      } else if (random < 0.7) {
        action = 'call';
      } else {
        action = 'raise';
      }
    }
    
    // Execute AI action
    if (action === 'fold') {
      setGameMessage(`Player at seat ${player.seat} folded`);
      addGameLog(`Player_${player.seat} folds`, `Player_${player.seat}`, 'fold');
      // Mark player as folded
      setPlayers(prev => prev.map(p => 
        p && p.seat === player.seat ? { ...p, folded: true } : p
      ));
    } else if (action === 'raise') {
      const raiseAmount = currentBet > 0 ? currentBet * 2 : 1000;
      setGameMessage(`Player at seat ${player.seat} raised to ${raiseAmount.toLocaleString()} SHIDO`);
      setPot(prev => prev + raiseAmount);
      setCurrentBet(raiseAmount);
      addGameLog(`Player_${player.seat} raises to ${raiseAmount.toLocaleString()}`, `Player_${player.seat}`, 'raise');
    } else if (action === 'call') {
      setGameMessage(`Player at seat ${player.seat} called ${currentBet.toLocaleString()}`);
      setPot(prev => prev + currentBet);
      addGameLog(`Player_${player.seat} calls ${currentBet.toLocaleString()}`, `Player_${player.seat}`, 'call');
    } else if (action === 'bet') {
      const betAmount = 1000;
      setGameMessage(`Player at seat ${player.seat} bets ${betAmount.toLocaleString()}`);
      setPot(prev => prev + betAmount);
      setCurrentBet(betAmount);
      addGameLog(`Player_${player.seat} bets ${betAmount.toLocaleString()}`, `Player_${player.seat}`, 'bet');
    } else {
      setGameMessage(`Player at seat ${player.seat} checked`);
      addGameLog(`Player_${player.seat} checks`, `Player_${player.seat}`, 'check');
    }
    
    // Clear message after delay
    setTimeout(() => setGameMessage(''), 2000);
  };

  const toShortWallet = (address?: string) => {
    if (!address || !address.startsWith('0x') || address.length < 10) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSavedUsername = (address?: string) => {
    if (!address) return '';
    const profile = loadProfile(address);
    return profile?.username?.trim() || '';
  };

  const resolveSelfDisplayName = (address: string, alias: string) => {
    const savedUsername = getSavedUsername(address);
    return savedUsername || alias.trim() || toShortWallet(address) || 'Player';
  };

  const resolvePlayerDisplayName = (player: any, aliasFallback: string) => {
    const playerAddress = String(player?.walletAddress || player?.playerId || '').trim();
    const savedUsername = getSavedUsername(playerAddress);
    const shortAddress = toShortWallet(playerAddress);
    const alias = String(player?.name || player?.alias || aliasFallback || '').trim();
    return savedUsername || alias || shortAddress || 'Player';
  };

  const syncPlayerStatsFromProfile = (address: string, aliasFallback: string = playerAlias) => {
    if (!address.trim()) return;

    const profile = getOrCreateProfile(address);
    const alias = profile.username?.trim() || resolveSelfDisplayName(address, aliasFallback);
    const handsPlayed = Number(profile.totalHands || 0);
    const handsWon = Number(profile.handsWon || 0);

    setPlayerStats({
      address,
      alias,
      avatar: avatars[avatarIndex],
      totalWon: Number(profile.lifetimeWinnings || 0),
      totalLost: Number(profile.lifetimeLosses || 0),
      handsPlayed,
      handsWon,
      biggestPot: Number(profile.biggestPot || 0),
      totalRakePaid: Number(profile.totalRakePaid || 0),
      winRate: handsPlayed > 0 ? (handsWon / handsPlayed) * 100 : 0
    });
  };

  // Multiplayer socket connection (authoritative server)
  useEffect(() => {
    if (!MULTIPLAYER_ENABLED) return;
    if (demoMode) return;
    if (!walletConnected) return;
    if (!walletAddress.trim()) return;
    if (socket) return;
    const socketAlias = resolveSelfDisplayName(walletAddress.trim(), playerAlias);
    if (!socketAlias.trim()) return;

    const playerId = walletAddress.trim();
    const selectedAvatar = avatarCategories[avatarCategory]?.[avatarIndex];

    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    setSocket(newSocket);

    let betweenHandsTimer: NodeJS.Timeout | null = null;
    let fallbackCleanupEndsAtMs: number | null = null;
    let fallbackCleanupHandId: string | null = null;
    const clearBetweenHandsCountdown = () => {
      if (betweenHandsTimer) {
        clearInterval(betweenHandsTimer);
        betweenHandsTimer = null;
      }
      fallbackCleanupEndsAtMs = null;
      fallbackCleanupHandId = null;
      setBetweenHandsCountdownMs(0);
    };

    const syncBetweenHandsCountdown = (startsAt: any, handBreakMs: any, handIdRaw: any) => {
      const now = Date.now();
      const handId = handIdRaw !== undefined && handIdRaw !== null ? String(handIdRaw) : '';
      const parsedBreakMs = Number(handBreakMs);
      const breakMs = Number.isFinite(parsedBreakMs) && parsedBreakMs >= 1000 ? parsedBreakMs : 5000;

      let targetStartsAt: number | null = typeof startsAt === 'number' ? startsAt : null;

      // Fallback when server does not provide nextHandStartsAt while still in cleanup.
      if (!targetStartsAt || targetStartsAt <= now) {
        const needsFreshFallback = !fallbackCleanupEndsAtMs || fallbackCleanupEndsAtMs <= now || fallbackCleanupHandId !== handId;
        if (needsFreshFallback) {
          fallbackCleanupEndsAtMs = now + breakMs;
          fallbackCleanupHandId = handId || null;
        }
        targetStartsAt = fallbackCleanupEndsAtMs;
      }

      if (!targetStartsAt || targetStartsAt <= now) {
        clearBetweenHandsCountdown();
        return;
      }

      if (betweenHandsTimer) {
        clearInterval(betweenHandsTimer);
        betweenHandsTimer = null;
      }

      const update = () => {
        const remaining = Math.max(0, (targetStartsAt as number) - Date.now());
        setBetweenHandsCountdownMs(remaining);
        if (remaining <= 0 && betweenHandsTimer) {
          clearInterval(betweenHandsTimer);
          betweenHandsTimer = null;
        }
      };

      update();
      betweenHandsTimer = setInterval(update, 100);
    };

    newSocket.on('connect', () => {
      newSocket.emit('join-game', {
        playerId,
        walletAddress: walletAddress?.trim() ? walletAddress.trim() : undefined,
        alias: socketAlias.trim(),
        avatarIndex,
        avatarCategory,
        avatar: selectedAvatar
      });
    });

    newSocket.on('game-state', (state: any) => {
      const normalizedPlayers = (state.players || [])
        .filter(Boolean)
        .map((player: any) => ({
          ...player,
          walletAddress: player.walletAddress || player.playerId,
          displayName: resolvePlayerDisplayName(player, playerAlias)
        }));

      setGameState(state);
      setPlayers(normalizedPlayers);
      setCommunityCards(state.communityCards || []);
      setRevealedCards((state.communityCards || []).length);
      setPot(state.pot || 0);
      setCurrentPlayer(state.currentPlayer || -1);
      setCurrentBet(state.currentBet || 0);

      if (state?.street === 'CLEANUP') {
        syncBetweenHandsCountdown(state?.nextHandStartsAt, state?.handBreakMs, state?.handResult?.handId);
      } else {
        clearBetweenHandsCountdown();
      }

      const me = normalizedPlayers.find((p: any) => {
        if (!p) return false;
        if (p.isMe) return true;
        return String(p.playerId || '').toLowerCase() === playerId.toLowerCase();
      });

      if (me?.seat) {
        setIsSeated(true);
        setSeatNumber(Number(me.seat));
        setShowLobby(false);
        setAppState('GAME');
      }

      // --- Server game log processing (multiplayer) ---
      if (Array.isArray(state.gameLog) && state.gameLog.length > 0) {
        // Personalize: replace player's own name with "You"
        const myName = me?.name || '';
        const formattedLog = state.gameLog.map((log: any) => {
          let action = log.action || '';
          if (myName && action.startsWith(myName + ' ')) {
            action = 'You ' + action.slice(myName.length + 1);
          }
          // Also replace "🏆 Name wins" → "🏆 You win"
          if (myName && action.includes(`🏆 ${myName} wins`)) {
            action = action.replace(`🏆 ${myName} wins`, '🏆 You win');
          }
          return {
            action,
            player: log.type === 'system' ? 'System' : log.type === 'result' ? 'Dealer' : log.type === 'dealer' ? 'Dealer' : 'Player',
            timestamp: new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false }),
            type: log.type
          };
        });
        setGameLog(formattedLog);

        // Winner banner from server game log
        const winLog = state.gameLog.find((log: any) => log.action?.includes('🏆'));
        if (winLog && state.handResult) {
          let winAction = winLog.action;
          if (myName && winAction.includes(`🏆 ${myName} wins`)) {
            winAction = winAction.replace(`🏆 ${myName} wins`, '🏆 You win');
          }
          if (winAction !== lastWinLogRef.current) {
            lastWinLogRef.current = winAction;
            const isMuckWin = winAction.includes('(all others folded)');
            const winMatch = winAction.match(/🏆 (.+?) wins? ([\d,]+)/);
            if (winMatch) {
              const winner = winMatch[1];
              const potSize = parseInt(winMatch[2].replace(/,/g, ''));
              setBannerData({
                winningHand: state.winningHand || (isMuckWin ? 'Fold Win' : 'Winner'),
                winner,
                potSize
              });
              setShowWinningBanner(true);
            }
          }
        }

        // Fallback winner popup from game log when handResult payload is missing.
        const popupWinLog = formattedLog.find((log: any) => log.action?.includes('🏆'));
        const canUseFallbackPopup = state?.street === 'CLEANUP' && popupWinLog && !(state.handResult?.winners?.length);
        if (canUseFallbackPopup && popupWinLog.action !== lastWinnerPopupRef.current) {
          const popupMatch = popupWinLog.action.match(/🏆\s+(.+?)\s+wins?\s+([\d,]+)(?:\s+with\s+(.+))?/i);
          if (popupMatch) {
            lastWinnerPopupRef.current = popupWinLog.action;
            setWinnerPopupData({
              winner: popupMatch[1],
              amount: parseInt(popupMatch[2].replace(/,/g, ''), 10) || 0,
              winningHand: popupMatch[3] || state.winningHand || 'Winning Hand',
              winnerCards: [],
              secondPlace: undefined
            });
            setShowWinnerPopup(true);
          }
        }
      }

      // --- Track session buy-in (set once when joining) ---
      if (me && me.stack > 0) {
        setSessionBuyIn(prev => prev === 0 ? me.stack : prev);
      }

      // --- Stats tracking: detect hand completion (CLEANUP) ---
      if (state.street === 'CLEANUP' && state.handResult && me) {
        const hr = state.handResult;
        const handId = String(hr.handId || '');
        if (handId && lastProcessedStatsHandRef.current === handId) {
          return;
        }
        if (handId) {
          lastProcessedStatsHandRef.current = handId;
        }

        const didWin = hr.winners.some((w: any) => w.playerId === me.playerId);
        const myWinAmount = hr.winners
          .filter((w: any) => w.playerId === me.playerId)
          .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
        const myLossAmount = !didWin ? Number(me.bet || 0) : 0;
        const fallbackRake = handId && countedRakeHandIdsRef.current.has(handId)
          ? 0
          : Math.max(0, Number(state?.rake || 0));

        if (fallbackRake > 0 && handId) {
          countedRakeHandIdsRef.current.add(handId);
        }

        setSessionStatsData(prev => {
          if (!prev) return prev;
          const updatedStats = updateStatsAfterHand(prev, {
            won: didWin,
            potSize: hr.pot || 0,
            amountWon: didWin ? myWinAmount : 0,
            amountLost: myLossAmount,
            folded: me.folded || false,
            wentAllIn: me.allIn || false,
            reachedShowdown: hr.isShowdown || false,
            wonShowdown: hr.isShowdown && didWin,
            currentBalance: me.stack || 0
          });
          saveStats(updatedStats);
          return updatedStats;
        });

        if (walletAddress.trim()) {
          addHandToHistory(walletAddress.trim(), {
            handNumber: Number(hr.handId || Date.now()),
            timestamp: Date.now(),
            tableId: String(state.tableId || 'table-1'),
            myCards: Array.isArray(myCards) ? myCards : [],
            myPosition: Number(me.seat || 0),
            communityCards: Array.isArray(state.communityCards) ? state.communityCards : [],
            players: normalizedPlayers.map((p: any) => ({
              name: p.displayName || p.name || 'Player',
              position: Number(p.seat || 0),
              stack: Number(p.stack || 0),
              isMe: Boolean(p.isMe)
            })),
            actions: [],
            result: didWin ? 'won' : (me.folded ? 'folded' : 'lost'),
            amountWon: didWin ? myWinAmount : 0,
            amountLost: myLossAmount,
            handType: String(state.winningHand || (didWin ? 'Winning Hand' : 'Lost Hand')),
            finalPot: Number(hr.pot || 0),
            rake: fallbackRake,
            winners: (hr.winners || []).map((winner: any) => ({
              playerName: String(winner.name || winner.playerId || 'Player'),
              handType: String(winner.hand || ''),
              cards: Array.isArray(winner.cards) ? winner.cards : [],
              amount: Number(winner.amount || 0)
            }))
          });

          syncPlayerStatsFromProfile(walletAddress.trim(), playerAlias);
        } else {
          setPlayerStats(prev => {
            const newHandsPlayed = prev.handsPlayed + 1;
            const newHandsWon = didWin ? prev.handsWon + 1 : prev.handsWon;
            const newTotalWon = didWin ? prev.totalWon + myWinAmount : prev.totalWon;
            const newTotalLost = !didWin ? prev.totalLost + myLossAmount : prev.totalLost;
            const newBiggestPot = Math.max(prev.biggestPot, hr.pot || 0);
            const newTotalRakePaid = prev.totalRakePaid + fallbackRake;

            return {
              ...prev,
              handsPlayed: newHandsPlayed,
              handsWon: newHandsWon,
              totalWon: newTotalWon,
              totalLost: newTotalLost,
              biggestPot: newBiggestPot,
              totalRakePaid: newTotalRakePaid,
              winRate: newHandsPlayed > 0 ? (newHandsWon / newHandsPlayed) * 100 : 0
            };
          });
        }
      }

      // Authoritative multiplayer winner popup (server handResult-driven)
      if (state.street === 'CLEANUP' && state.handResult?.winners?.length) {
        const hr = state.handResult;
        const winnerEntries = new Map<string, { amount: number; hand?: string; cards?: number[] }>();

        for (const winner of hr.winners as any[]) {
          const existing = winnerEntries.get(winner.playerId);
          if (!existing) {
            winnerEntries.set(winner.playerId, {
              amount: Number(winner.amount || 0),
              hand: winner.hand,
              cards: Array.isArray(winner.cards) ? winner.cards : []
            });
            continue;
          }

          existing.amount += Number(winner.amount || 0);
          if (!existing.hand && winner.hand) existing.hand = winner.hand;
          if ((!existing.cards || existing.cards.length === 0) && Array.isArray(winner.cards)) {
            existing.cards = winner.cards;
          }
        }

        const sortedWinners = Array.from(winnerEntries.entries()).sort((a, b) => b[1].amount - a[1].amount);
        const handId = String(hr.handId || 'unknown');
        const resultKey = `${handId}:${sortedWinners.map(([id, data]) => `${id}:${data.amount}`).join('|')}`;

        if (sortedWinners.length > 0 && lastMultiplayerResultRef.current !== resultKey) {
          lastMultiplayerResultRef.current = resultKey;

          const playersById = new Map<string, any>(
            (state.players || [])
              .filter(Boolean)
              .map((p: any) => [String(p.playerId), p])
          );

          const formatName = (playerIdToFormat: string): string => {
            const player = playersById.get(String(playerIdToFormat));
            if (!player) return 'Player';
            return player.isMe ? 'You' : (player.name || 'Player');
          };

          const winnerLabel = sortedWinners.length > 1
            ? sortedWinners.map(([winnerId]) => formatName(winnerId)).join(', ')
            : formatName(sortedWinners[0][0]);

          const primaryWinner = sortedWinners[0][1];
          const popupAmount = sortedWinners.length > 1
            ? Number(hr.pot || 0)
            : Number(primaryWinner.amount || 0);

          setWinnerPopupData({
            winner: winnerLabel,
            amount: popupAmount,
            winningHand: primaryWinner.hand || state.winningHand || (hr.isShowdown ? 'Showdown Win' : 'All Others Folded'),
            winnerCards: Array.isArray(primaryWinner.cards) ? primaryWinner.cards : [],
            secondPlace: hr.runnerUp
              ? {
                  name: formatName(hr.runnerUp.playerId),
                  cards: Array.isArray(hr.runnerUp.cards) ? hr.runnerUp.cards : [],
                  handType: hr.runnerUp.hand || 'Runner Up',
                  amountWon: Number(hr.runnerUp.amountWon || 0)
                }
              : undefined
          });
          setShowWinnerPopup(true);
        }
      }
    });

    newSocket.on('hole-cards', (data: any) => {
      // Server sends only your own cards
      if (Array.isArray(data?.cards)) {
        setMyCards(data.cards);
      }
    });

    newSocket.on('player-sat', (data: any) => {
      if (data?.playerId === playerId || (walletAddress && data?.playerId === walletAddress)) {
        setIsSeated(true);
        setSeatNumber(data.seat);
        setShowLobby(false);
        setAppState('GAME');
      }
    });

    newSocket.on('player-reconnected', (data: any) => {
      if (data?.playerId === playerId || (walletAddress && data?.playerId === walletAddress)) {
        setIsSeated(true);
        setSeatNumber(Number(data?.seat || 0));
        setShowLobby(false);
        setAppState('GAME');
      }
    });

    newSocket.on('valid-actions', (data: any) => {
      if (data) {
        setValidActions(data);
      }
    });

    // Track the turn-timer countdown interval inside the socket closure
    let turnTimerCountdown: NodeJS.Timeout | null = null;

    newSocket.on('turn-timer', (data: any) => {
      // Clear any previous countdown
      if (turnTimerCountdown) {
        clearInterval(turnTimerCountdown);
        turnTimerCountdown = null;
      }

      if (data && typeof data.remainingMs === 'number' && typeof data.totalMs === 'number') {
        // Set initial timer state matching PlayerTimer props
        setTimerState({
          baseTimeMs: data.remainingMs,
          baseMaxMs: data.totalMs,
          timeBankMs: 0,
          timeBankMaxMs: 0,
          usingTimeBank: false
        });

        // Start countdown interval (100ms ticks)
        turnTimerCountdown = setInterval(() => {
          setTimerState((prev: any) => {
            if (!prev) {
              if (turnTimerCountdown) { clearInterval(turnTimerCountdown); turnTimerCountdown = null; }
              return null;
            }
            const newTime = Math.max(0, prev.baseTimeMs - 100);
            if (newTime <= 0) {
              if (turnTimerCountdown) { clearInterval(turnTimerCountdown); turnTimerCountdown = null; }
              return null;
            }
            return { ...prev, baseTimeMs: newTime };
          });
        }, 100);
      }
    });

    // Clear timer when game-state indicates no active turn
    newSocket.on('game-state', (stateForTimer: any) => {
      const street = stateForTimer?.street;
      const cp = stateForTimer?.currentPlayer;
      if (!cp || cp < 0 || street === 'CLEANUP' || street === 'SEATING' || street === 'SHOWDOWN') {
        if (turnTimerCountdown) { clearInterval(turnTimerCountdown); turnTimerCountdown = null; }
        setTimerState(null);
      }
    });

    newSocket.on('player-disconnected', (data: any) => {
      if (data?.playerId && data?.reconnectGraceMs) {
        setGameMessage(`Player disconnected. Reconnect window: ${Math.round(data.reconnectGraceMs / 1000)}s ⏳`);
        setTimeout(() => setGameMessage(''), 5000);
      }
    });

    newSocket.on('player-busted', (data: any) => {
      const myId = (walletAddress || playerId).toLowerCase();
      const bustedId = String(data?.playerId || '').toLowerCase();
      if (bustedId === myId) {
        // Local player busted - show fund-or-walk popup after a delay
        setTimeout(() => {
          setRebuyPromptActive(true);
          setShowRebuyPopup(true);
        }, 5000);
      }
    });

    newSocket.on('leave-queued', (data: any) => {
      setGameMessage(data?.message || 'You will leave after the current hand. ⏳');
    });

    newSocket.on('leave-ready', async () => {
      setGameMessage('Claiming your funds from escrow... ⏳');
      // Auto-claim from escrow contract
      if (ONCHAIN_ESCROW_CONFIGURED && signer) {
        try {
          const tableEscrow = new ethers.Contract(TABLE_ESCROW_ADDRESS, TABLE_ESCROW_ABI, signer);
          const tx = await tableEscrow.standUp();
          await tx.wait();
          setGameMessage('Funds claimed! You have left the table. ✅');
          if (provider && walletAddress) {
            await fetchWalletBalance(provider, walletAddress);
          }
        } catch (err: any) {
          console.error('Escrow standUp failed:', err);
          const reason = err?.reason || err?.shortMessage || err?.message || 'Unknown error';
          setGameMessage(`Claim failed: ${reason}. Try manually. ❌`);
        }
      } else {
        setGameMessage('You have left the table. ✅');
      }
      setIsSeated(false);
      setSeatNumber(0);
    });

    newSocket.on('escrow-settled', (data: any) => {
      const handId = String(data?.engineHandId || data?.onChainHandId || '');
      const rakeChips = Number(data?.rakeChips || 0);
      if (!Number.isFinite(rakeChips) || rakeChips <= 0) {
        return;
      }

      if (handId && countedRakeHandIdsRef.current.has(handId)) {
        return;
      }

      if (handId) {
        countedRakeHandIdsRef.current.add(handId);
      }

      setTotalRakeCollected(prev => prev + rakeChips);
      setPlayerStats(prev => ({
        ...prev,
        totalRakePaid: prev.totalRakePaid + rakeChips
      }));

      if (walletAddress.trim()) {
        const profile = getOrCreateProfile(walletAddress.trim());
        profile.totalRakePaid = Number(profile.totalRakePaid || 0) + rakeChips;
        saveProfile(profile);
      }
    });

    newSocket.on('chat-history', (history: any[]) => {
      if (!Array.isArray(history)) return;
      const normalized = history
        .map((entry: any) => {
          const user = String(entry?.user || 'Player').trim().slice(0, 24);
          const text = String(entry?.message || '').trim().slice(0, 240);
          const seat = typeof entry?.seat === 'number' ? entry.seat : undefined;
          return { user: user || 'Player', text, seat };
        })
        .filter((entry) => entry.text.length > 0);
      setMessages(normalized.slice(-100));
    });

    newSocket.on('chat-message', (entry: any) => {
      const text = String(entry?.message || '').trim();
      if (!text) return;
      const user = String(entry?.user || 'Player').trim().slice(0, 24) || 'Player';
      const seat = typeof entry?.seat === 'number' ? entry.seat : undefined;
      setMessages(prev => [...prev, { user, text: text.slice(0, 240), seat }].slice(-200));
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ Socket connection error:', error);
      setGameMessage('Connection failed! Check if server is running.');
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
      if (error?.code === 'WALLET_IP_LIMIT') {
        setGameMessage(`⛔ ${error.message}`);
        newSocket.disconnect();
        setSocket(null);
      } else {
        setGameMessage(`Error: ${error?.message || 'Unknown error'} ❌`);
      }
    });

    return () => {
      if (betweenHandsTimer) {
        clearInterval(betweenHandsTimer);
        betweenHandsTimer = null;
      }
      if (turnTimerCountdown) {
        clearInterval(turnTimerCountdown);
        turnTimerCountdown = null;
      }
    };
  }, [MULTIPLAYER_ENABLED, SERVER_URL, demoMode, socket, playerAlias, walletConnected, walletAddress, avatarIndex, avatarCategory]);

  // Shido Network Configuration
  const SHIDO_CHAIN_ID = 9008;
  const SHIDO_NETWORK = {
    chainId: '0x2330', // 9008 in hex
    chainName: 'Shido Network',
    nativeCurrency: {
      name: 'SHIDO',
      symbol: 'SHIDO',
      decimals: 18
    },
    rpcUrls: ['https://rpc-nodes.shidoscan.com'],
    blockExplorerUrls: ['https://shidoscan.com']
  };

  // Contract Configuration (address provided via VITE_TABLE_ESCROW_ADDRESS)
  const TABLE_ESCROW_ABI = [
    "function sitDown(uint8 seat, uint256 amount) external",
    "function topUp(uint256 amount) external",
    "function standUp() external",
    "function seatOf(address player) external view returns (uint8)",
    "function seats(uint256 seat) external view returns (address player, uint256 stack, bool inHand)",
    "function minBuyIn() external view returns (uint256)",
    "function maxBuyIn() external view returns (uint256)"
  ];

  const WSHIDO_ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function decimals() external view returns (uint8)"
  ];

  const fetchWalletBalance = async (provider: ethers.BrowserProvider, address: string) => {
    try {
      if (!WSHIDO_TOKEN_ADDRESS) {
        setBalance(0);
        setGameMessage('wSHIDO token address is not configured.');
        return;
      }

      const token = new ethers.Contract(WSHIDO_TOKEN_ADDRESS, WSHIDO_ABI, provider);
      const [tokenBalance, decimals] = await Promise.all([
        token.balanceOf(address),
        token.decimals().catch(() => 18)
      ]);

      const formattedBalance = ethers.formatUnits(tokenBalance, Number(decimals));
      const bankroll = Math.floor(parseFloat(formattedBalance));

      setBalance(bankroll);
      console.log(`wSHIDO Balance: ${bankroll} wSHIDO`);

      if (bankroll === 0) {
        setGameMessage('No wSHIDO bankroll found. Bridge or swap into wSHIDO to play. 🪙');
      }

    } catch (error) {
      console.error('Error fetching wSHIDO balance:', error);
      setBalance(0);
      setGameMessage('Could not fetch wSHIDO balance. Check wallet and network. 🔗');
    }
  };

  const ensureTokenAllowance = async (
    signer: ethers.Signer,
    owner: string,
    spender: string,
    requiredAmount: bigint
  ) => {
    if (!WSHIDO_TOKEN_ADDRESS) {
      throw new Error('Missing VITE_WSHIDO_TOKEN_ADDRESS');
    }

    const token = new ethers.Contract(WSHIDO_TOKEN_ADDRESS, WSHIDO_ABI, signer);
    const allowance: bigint = await token.allowance(owner, spender);
    if (allowance >= requiredAmount) {
      return;
    }

    setGameMessage('Approving wSHIDO spend in wallet...');
    try {
      const approveTx = await token.approve(spender, requiredAmount);
      await approveTx.wait();
    } catch (approveError) {
      // Some ERC20 tokens require resetting allowance to zero before changing it.
      const resetTx = await token.approve(spender, 0);
      await resetTx.wait();
      const approveTx = await token.approve(spender, requiredAmount);
      await approveTx.wait();
    }

    const finalAllowance: bigint = await token.allowance(owner, spender);
    if (finalAllowance < requiredAmount) {
      throw new Error('Token allowance is still below the required buy-in amount after approval.');
    }
  };

  const parseChainId = (chainValue: string | number | bigint | null | undefined): number | null => {
    if (chainValue === null || chainValue === undefined) return null;
    if (typeof chainValue === 'bigint') return Number(chainValue);
    if (typeof chainValue === 'number') return Number.isFinite(chainValue) ? chainValue : null;
    if (typeof chainValue === 'string') {
      if (chainValue.startsWith('0x')) {
        const parsedHex = parseInt(chainValue, 16);
        return Number.isFinite(parsedHex) ? parsedHex : null;
      }
      const parsedDec = Number(chainValue);
      return Number.isFinite(parsedDec) ? parsedDec : null;
    }
    return null;
  };

  const getInjectedWalletProviders = () => {
    const ethereum = (window as any).ethereum;
    const providers = Array.isArray(ethereum?.providers) ? ethereum.providers : ethereum ? [ethereum] : [];
    const metamask = providers.find((provider: any) => provider?.isMetaMask) || null;
    const keplr =
      providers.find((provider: any) => provider?.isKeplr || provider?.providerInfo?.name?.toLowerCase?.().includes('keplr')) ||
      null;

    return {
      metamask,
      keplr,
      hasMetaMaskProvider: Boolean(metamask),
      hasKeplrProvider: Boolean(keplr)
    };
  };

  const refreshWalletAvailability = () => {
    const detected = getInjectedWalletProviders();
    setHasMetaMask(detected.hasMetaMaskProvider);
    setHasKeplr(detected.hasKeplrProvider);
    return detected;
  };

  useEffect(() => {
    const refresh = () => {
      refreshWalletAvailability();
    };

    refresh();
    const retryTimer = window.setTimeout(refresh, 600);
    window.addEventListener('ethereum#initialized', refresh as EventListener);

    return () => {
      window.clearTimeout(retryTimer);
      window.removeEventListener('ethereum#initialized', refresh as EventListener);
    };
  }, []);

  const removeWalletListeners = () => {
    const eventProvider = walletEventProviderRef.current;
    if (!eventProvider || typeof eventProvider.removeListener !== 'function') {
      walletEventProviderRef.current = null;
      accountChangeHandlerRef.current = null;
      chainChangeHandlerRef.current = null;
      return;
    }

    if (accountChangeHandlerRef.current) {
      eventProvider.removeListener('accountsChanged', accountChangeHandlerRef.current);
    }
    if (chainChangeHandlerRef.current) {
      eventProvider.removeListener('chainChanged', chainChangeHandlerRef.current);
    }

    walletEventProviderRef.current = null;
    accountChangeHandlerRef.current = null;
    chainChangeHandlerRef.current = null;
  };

  // Wallet Functions
  const connectWallet = async (preferredWallet: WalletProviderType | 'auto' = 'auto') => {
    console.log('connectWallet called', preferredWallet);
    try {
      removeWalletListeners();

      const detected = refreshWalletAvailability();
      const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
      let selectedType: WalletProviderType | null = null;
      let selectedProvider: any = null;

      if (preferredWallet === 'metamask' && detected.metamask) {
        selectedType = 'metamask';
        selectedProvider = detected.metamask;
      }
      if (preferredWallet === 'keplr' && detected.keplr) {
        selectedType = 'keplr';
        selectedProvider = detected.keplr;
      }
      if (!selectedProvider && preferredWallet === 'auto') {
        if (detected.metamask) {
          selectedType = 'metamask';
          selectedProvider = detected.metamask;
        } else if (detected.keplr) {
          selectedType = 'keplr';
          selectedProvider = detected.keplr;
        }
      }

      if (!selectedProvider) {
        if (!WALLETCONNECT_PROJECT_ID) {
          setGameMessage('No injected wallet found. Add VITE_WALLETCONNECT_PROJECT_ID or open in MetaMask/Keplr browser. 🔐');
          if (isMobileDevice) {
            const dappPath = window.location.href.replace(/^https?:\/\//, '');
            window.location.href = `https://metamask.app.link/dapp/${dappPath}`;
          }
          return;
        }

        const wcProvider = await EthereumProvider.init({
          projectId: WALLETCONNECT_PROJECT_ID,
          chains: [SHIDO_CHAIN_ID],
          optionalChains: [SHIDO_CHAIN_ID],
          showQrModal: !isMobileDevice,
          rpcMap: {
            [SHIDO_CHAIN_ID]: SHIDO_NETWORK.rpcUrls[0]
          },
          metadata: {
            name: 'Poker',
            description: 'Real PvP Poker on Shido Network',
            url: window.location.origin,
            icons: [`${window.location.origin}/logo.png`]
          }
        });

        await wcProvider.enable();
        walletConnectProviderRef.current = wcProvider;
        selectedType = 'walletconnect';
        selectedProvider = wcProvider;
      }

      await selectedProvider.request({ method: 'eth_requestAccounts' });

      const web3Provider = new ethers.BrowserProvider(selectedProvider);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      let activeAddress = address;

      const network = await web3Provider.getNetwork();
      const detectedChainId = Number(network.chainId);

      setProvider(web3Provider);
      setSigner(web3Signer);
      setWalletAddress(address);
      setChainId(detectedChainId);
      setWalletConnected(true);
      setWalletProviderType(selectedType);

      if (detectedChainId !== SHIDO_CHAIN_ID && selectedType !== 'walletconnect') {
        setGameMessage(`⚠️ Please switch to Shido Network (Chain ID: ${SHIDO_CHAIN_ID})`);
        try {
          await selectedProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SHIDO_NETWORK.chainId }]
          });
        } catch (switchError: any) {
          if (switchError?.code === 4902) {
            try {
              await selectedProvider.request({
                method: 'wallet_addEthereumChain',
                params: [SHIDO_NETWORK]
              });
            } catch (addError) {
              console.error('Failed to add Shido network:', addError);
              setGameMessage('Failed to add Shido Network ❌');
              return;
            }
          }
        }
      }

      const currentNetwork = await web3Provider.getNetwork();
      const currentChainId = Number(currentNetwork.chainId);
      setChainId(currentChainId);

      await fetchWalletBalance(web3Provider, address);

      const providerLabel = selectedType === 'keplr' ? 'Keplr' : selectedType === 'walletconnect' ? 'WalletConnect' : 'MetaMask';
      if (currentChainId === SHIDO_CHAIN_ID) {
        setGameMessage(`Connected via ${providerLabel}: ${address.slice(0, 6)}...${address.slice(-4)}. Claim your username in Member Profile 🔗`);
      } else {
        setGameMessage(`Connected via ${providerLabel}. Switch to Shido (${SHIDO_CHAIN_ID}) to play Real PvP.`);
      }

      const handleAccountsChanged = async (accounts: string[]) => {
        if (!accounts.length) {
          disconnectWallet();
          return;
        }

        activeAddress = accounts[0];
        setWalletAddress(accounts[0]);
        await fetchWalletBalance(web3Provider, accounts[0]);

        setIsSeated(false);
        setSeatNumber(0);
        setShowLobby(true);

        if (socket) {
          socket.disconnect();
          setSocket(null);
        }

        setGameMessage(`Switched to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)} 🔄`);
        setTimeout(() => setGameMessage(''), 3000);
      };

      const handleChainChanged = async (rawChainId: string | number) => {
        const newChainId = parseChainId(rawChainId);
        if (newChainId === null) return;

        setChainId(newChainId);

        if (newChainId === SHIDO_CHAIN_ID) {
          setGameMessage('✅ Switched to Shido Network 🔄');
          await fetchWalletBalance(web3Provider, activeAddress);
        } else {
          setGameMessage(`⚠️ Wrong network! Please switch to Shido Network (${SHIDO_CHAIN_ID}) 🔄`);
        }
      };

      if (typeof selectedProvider.on === 'function') {
        selectedProvider.on('accountsChanged', handleAccountsChanged);
        selectedProvider.on('chainChanged', handleChainChanged);
        walletEventProviderRef.current = selectedProvider;
        accountChangeHandlerRef.current = handleAccountsChanged;
        chainChangeHandlerRef.current = handleChainChanged;
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      if (error?.code === 4001) {
        setGameMessage('Connection rejected by user ❌');
      } else {
        setGameMessage('Failed to connect wallet ❌');
      }
    }
  };

  const disconnectWallet = () => {
    removeWalletListeners();

    if (walletConnectProviderRef.current?.disconnect) {
      walletConnectProviderRef.current.disconnect().catch((err: unknown) => {
        console.warn('WalletConnect disconnect warning:', err);
      });
      walletConnectProviderRef.current = null;
    }

    // Disconnect socket if connected
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    setWalletConnected(false);
    setWalletAddress('');
    setWalletProviderType(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsSeated(false);
    setSeatNumber(0);
    setBalance(0);
    setShowLobby(true);
    setGameMessage('Wallet disconnected. You can now connect a different wallet. 👋');

    setTimeout(() => setGameMessage(''), 3000);
  };

  const resolveMinimumTopUpAmount = async (): Promise<number> => {
    if (!ONCHAIN_ESCROW_CONFIGURED || !signer) {
      return DEFAULT_MIN_TOP_UP;
    }

    try {
      const tableEscrow = new ethers.Contract(TABLE_ESCROW_ADDRESS, TABLE_ESCROW_ABI, signer);
      const token = new ethers.Contract(WSHIDO_TOKEN_ADDRESS, WSHIDO_ABI, signer);
      const [minBuyInRaw, tokenDecimalsRaw] = await Promise.all([
        tableEscrow.minBuyIn(),
        token.decimals().catch(() => 18),
      ]);

      const tokenDecimals = Number(tokenDecimalsRaw);
      const minBuyIn = Math.floor(Number(ethers.formatUnits(minBuyInRaw, tokenDecimals)));
      if (Number.isFinite(minBuyIn) && minBuyIn > 0) {
        return minBuyIn;
      }
    } catch (error) {
      console.warn('Failed to resolve min buy-in for rebuy prompt:', error);
    }

    return DEFAULT_MIN_TOP_UP;
  };

  useEffect(() => {
    if (!showRebuyPopup) return;

    let cancelled = false;
    resolveMinimumTopUpAmount().then((resolvedMin) => {
      if (!cancelled) {
        setMinimumTopUpAmount(resolvedMin);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showRebuyPopup, signer, ONCHAIN_ESCROW_CONFIGURED, TABLE_ESCROW_ADDRESS, WSHIDO_TOKEN_ADDRESS]);

  // Deposit/Withdraw Functions
  const handleDeposit = async () => {
    setDepositModalMessage('');

    if (depositInFlight) {
      return;
    }

    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      const msg = 'Enter a valid deposit amount greater than 0.';
      setDepositModalMessage(msg);
      setGameMessage(`${msg} ❌`);
      return;
    }

    if (!Number.isInteger(depositAmount)) {
      const msg = 'Use a whole-number wSHIDO amount for table top-ups.';
      setDepositModalMessage(msg);
      setGameMessage(`${msg} ❌`);
      return;
    }

    if (rebuyPromptActive && depositAmount < minimumTopUpAmount) {
      const msg = `Minimum top-up to keep your seat is ${minimumTopUpAmount.toLocaleString()} wSHIDO.`;
      setDepositModalMessage(msg);
      setGameMessage(`${msg} ❌`);
      return;
    }

    if (!signer || !provider) {
      const msg = 'Please connect your wallet first! 🦊';
      setDepositModalMessage(msg);
      setGameMessage(msg);
      return;
    }

    if (chainId !== SHIDO_CHAIN_ID) {
      const msg = `Switch to Shido Network (${SHIDO_CHAIN_ID}) before depositing.`;
      setDepositModalMessage(msg);
      setGameMessage(msg);
      return;
    }

    if (!isSeated) {
      const msg = 'Take a seat first, then top up your table escrow.';
      setDepositModalMessage(msg);
      setGameMessage(msg);
      return;
    }

    if (!TABLE_ESCROW_ADDRESS) {
      const msg = 'Table escrow is not configured. Set VITE_TABLE_ESCROW_ADDRESS.';
      setDepositModalMessage(msg);
      setGameMessage(`${msg} ❌`);
      return;
    }

    if (!WSHIDO_TOKEN_ADDRESS) {
      const msg = 'wSHIDO token is not configured. Set VITE_WSHIDO_TOKEN_ADDRESS.';
      setDepositModalMessage(msg);
      setGameMessage(`${msg} ❌`);
      return;
    }

    if (!walletAddress) {
      const msg = 'Wallet address not available. Reconnect wallet.';
      setDepositModalMessage(msg);
      setGameMessage(`${msg} ❌`);
      return;
    }

    try {
      setDepositInFlight(true);
      setDepositModalMessage('Preparing deposit transaction...');
      setGameMessage('Preparing deposit transaction...');

      const depositAmountWei = ethers.parseEther(depositAmount.toString());

      const token = new ethers.Contract(WSHIDO_TOKEN_ADDRESS, WSHIDO_ABI, signer);
      const tokenBalance: bigint = await token.balanceOf(walletAddress);
      if (tokenBalance < depositAmountWei) {
        const msg = 'Insufficient wSHIDO balance for this deposit.';
        setDepositModalMessage(msg);
        setGameMessage(`${msg} ❌`);
        return;
      }

      await ensureTokenAllowance(signer, walletAddress, TABLE_ESCROW_ADDRESS, depositAmountWei);

      const tableEscrow = new ethers.Contract(TABLE_ESCROW_ADDRESS, TABLE_ESCROW_ABI, signer);

      setDepositModalMessage('Please confirm the transaction in your wallet...');
      setGameMessage('Please confirm the transaction in your wallet...');
      const tx = await tableEscrow.topUp(depositAmountWei);
      
      setDepositModalMessage('Transaction submitted. Waiting for confirmation...');
      setGameMessage('Transaction submitted! Waiting for confirmation...');
      await tx.wait();

      // Keep the server-authoritative table stack in sync with the on-chain top-up.
      if (socket && isSeated) {
        socket.emit('top-up', { amount: Math.floor(depositAmount) });
      }
      
      await fetchWalletBalance(provider, walletAddress);
      setShowDepositModal(false);
      setRebuyPromptActive(false);
      setDepositModalMessage('');
      setGameMessage(`✅ Deposited ${depositAmount.toLocaleString()} wSHIDO!`);
      setTimeout(() => setGameMessage(''), 5000);
      
    } catch (error: any) {
      console.error('Deposit error:', error);
      let msg = 'Deposit failed. Please try again.';
      if (error.code === 4001) {
        msg = 'Transaction rejected by user.';
      } else {
        msg = error.reason || error.shortMessage || error.message || msg;
      }
      setDepositModalMessage(msg);
      setGameMessage(`Deposit failed: ${msg} ❌`);
      setTimeout(() => setGameMessage(''), 5000);
    } finally {
      setDepositInFlight(false);
    }
  };

  // Rebuy action routes to real on-chain top-up flow.
  const handleRebuy = (amount?: number) => {
    if (!walletConnected || !walletAddress.trim()) {
      setGameMessage('Connect your wallet before topping up. 🔐');
      setTimeout(() => setGameMessage(''), 3000);
      return;
    }

    const requestedAmount = Math.floor(Number(amount ?? minimumTopUpAmount));
    const rebuyAmount = Number.isFinite(requestedAmount) && requestedAmount > 0 ? requestedAmount : minimumTopUpAmount;

    setDepositAmount(rebuyAmount);
    setShowRebuyPopup(false);
    setRebuyPromptActive(true);
    setDepositModalMessage('');
    setShowDepositModal(true);
  };

  const handleShowMuck = (showCards: boolean) => {
    if (demoMode && demoGameRef.current) {
      console.log('[ShowMuck] Player chose to', showCards ? 'SHOW' : 'MUCK', 'cards');
      demoGameRef.current.handleShowMuckDecision(showCards);
    }
  };

  const handleWithdraw = async () => {
    if (!signer || !provider || !walletAddress.trim()) {
      setGameMessage('Please connect your wallet first! 🦊');
      return;
    }

    if (!TABLE_ESCROW_ADDRESS) {
      setGameMessage('Table escrow is not configured. Set VITE_TABLE_ESCROW_ADDRESS. ❌');
      return;
    }

    // Go through the server flow: server settles on-chain first, then
    // the leave-ready handler calls standUp() on the escrow contract.
    setShowWithdrawModal(false);
    setGameMessage('Settling and claiming your funds... ⏳');
    handleStandUp();
  };

  // Table Functions
  const handleSitDown = (_tableId: string, seat: number, _requestedMode: TableMode = 'REAL_PVP') => {
    const activeMode: TableMode = 'REAL_PVP';
    console.log('handleSitDown called with:', { seat, playerAlias, activeMode });

    if (tableMode !== activeMode) {
      setTableMode(activeMode);
    }
    setDemoMode(false);

    if (demoGameRef.current) {
      setDemoGame(null);
      demoGameRef.current = null;
    }

    // Seat -1 means open table view first; enforce real prerequisites when taking a seat.
    if (seat === -1) {
      setShowLobby(false);
      setAppState('GAME');
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (!walletConnected || !walletAddress.trim()) {
        setGameMessage('Real table opened. Connect wallet, then pick a seat. 🔐');
      } else if (chainId !== SHIDO_CHAIN_ID) {
        setGameMessage(`Real table opened. Switch to Shido Network (${SHIDO_CHAIN_ID}), then pick a seat.`);
      } else if (!TABLE_ESCROW_ADDRESS) {
        setGameMessage('Real table opened, but escrow is not configured yet.');
      } else if (!socket) {
        setGameMessage('Connecting to real table... choose your seat in a moment.');
      }
      return;
    }

    if (!MULTIPLAYER_ENABLED) {
      setGameMessage('Real PvP is disabled in this build.');
      return;
    }

    if (!walletConnected || !walletAddress.trim()) {
      setGameMessage('Connect your wallet to join Real PvP. 🔐');
      return;
    }

    if (chainId !== SHIDO_CHAIN_ID) {
      setGameMessage(`Switch to Shido Network (${SHIDO_CHAIN_ID}) before joining Real PvP.`);
      return;
    }

    if (!resolveSelfDisplayName(walletAddress, playerAlias).trim()) {
      setGameMessage('Please enter your name first! ✏️');
      return;
    }

    confirmSitDown(seat);
  };

  const confirmSitDown = async (seat?: number) => {
    if (!resolveSelfDisplayName(walletAddress, playerAlias).trim()) {
      setGameMessage('Please enter a name! ✏️');
      return;
    }

    if (tableMode !== 'REAL_PVP') {
      setTableMode('REAL_PVP');
    }
    setDemoMode(false);
    
    const displayName = resolveSelfDisplayName(walletAddress, playerAlias).trim();
    const actualSeat = seat !== undefined ? seat : seatNumber;

    if (!Number.isFinite(actualSeat) || actualSeat < 1 || actualSeat > 6) {
      setGameMessage('Choose a valid seat before joining.');
      return;
    }
    
    console.log('confirmSitDown - seatNumber:', actualSeat);
    console.log('confirmSitDown - displayName:', displayName);
    console.log('confirmSitDown - walletAddress:', walletAddress);
    console.log('confirmSitDown - before players:', players);
    
    const fallbackBuyIn = Math.max(1, Math.floor(Number(process.env.NEXT_PUBLIC_DEFAULT_BUY_IN || 100)));
    let buyInAmount = fallbackBuyIn;

    if (!MULTIPLAYER_ENABLED) {
      setGameMessage('Real PvP is disabled in this build.');
      return;
    }

    if (!walletConnected || !walletAddress.trim()) {
      setGameMessage('Connect your wallet to join Real PvP. 🔐');
      return;
    }

    if (chainId !== SHIDO_CHAIN_ID) {
      setGameMessage(`Switch to Shido Network (${SHIDO_CHAIN_ID}) before joining Real PvP.`);
      return;
    }

    if (!signer || !provider) {
      setGameMessage('Connect wallet before taking a seat. 🔐');
      return;
    }

    if (!socket) {
      setGameMessage('Waiting for realtime connection... please try again in a moment.');
      return;
    }

    let resolvedSeat = actualSeat;
    let chainSeat = resolvedSeat - 1;

    if (ONCHAIN_ESCROW_CONFIGURED) {
      try {
        const tableEscrow = new ethers.Contract(TABLE_ESCROW_ADDRESS, TABLE_ESCROW_ABI, signer);

        try {
          const existingSeatRaw = await tableEscrow.seatOf(walletAddress);
          const existingSeat = Number(existingSeatRaw);
          if (Number.isFinite(existingSeat) && existingSeat >= 0 && existingSeat < 6) {
            resolvedSeat = existingSeat + 1;
            chainSeat = existingSeat;
            if (resolvedSeat !== actualSeat) {
              setGameMessage(`Wallet already seated on-chain at seat ${resolvedSeat}. Rejoining that seat...`);
            }
          }
        } catch {
          // Not seated on-chain yet; proceed with normal sit-down flow.
        }

        const seatState = await tableEscrow.seats(chainSeat);
        const onChainPlayer = String(seatState?.player ?? seatState?.[0] ?? ethers.ZeroAddress).toLowerCase();
        const onChainStackRaw: bigint = BigInt(seatState?.stack ?? seatState?.[1] ?? 0n);

        if (onChainPlayer !== ethers.ZeroAddress.toLowerCase() && onChainPlayer !== walletAddress.toLowerCase()) {
          setGameMessage('Seat is occupied on-chain. Choose another seat.');
          return;
        }

        if (onChainPlayer === walletAddress.toLowerCase()) {
          const onChainStack = Math.max(0, Math.floor(Number(ethers.formatEther(onChainStackRaw))));
          if (onChainStack > 0) {
            // Already on-chain with funds — rejoin with existing stack
            buyInAmount = onChainStack;
          } else {
            // Busted on-chain (stack = 0) — need to top up before rejoining
            const input = window.prompt(
              'Your on-chain stack is empty. Enter a top-up amount (wSHIDO):',
              String(fallbackBuyIn),
            );
            if (input === null) {
              setGameMessage('Sit-down cancelled.');
              return;
            }
            const parsedTopUp = Math.floor(Number(String(input).replace(/,/g, '').trim()));
            if (!Number.isFinite(parsedTopUp) || parsedTopUp <= 0) {
              setGameMessage('Enter a valid whole-number top-up amount.');
              return;
            }

            const token = new ethers.Contract(WSHIDO_TOKEN_ADDRESS, WSHIDO_ABI, signer);
            const tokenDecimals: number = Number(await token.decimals().catch(() => 18));
            const topUpWei = ethers.parseUnits(parsedTopUp.toString(), tokenDecimals);

            const tokenBalance: bigint = await token.balanceOf(walletAddress);
            if (tokenBalance < topUpWei) {
              setGameMessage(`Insufficient wSHIDO bankroll for top-up (${parsedTopUp.toLocaleString()}).`);
              return;
            }

            await ensureTokenAllowance(signer, walletAddress, TABLE_ESCROW_ADDRESS, topUpWei);

            setGameMessage('Please confirm top-up transaction in your wallet...');
            const tx = await tableEscrow.topUp(topUpWei);
            setGameMessage('Top-up submitted. Waiting for confirmation...');
            await tx.wait();
            await fetchWalletBalance(provider, walletAddress);
            buyInAmount = parsedTopUp;
          }
        } else {
          const input = window.prompt('Enter your buy-in amount (wSHIDO):', String(fallbackBuyIn));
          if (input === null) {
            setGameMessage('Sit-down cancelled.');
            return;
          }

          const parsedBuyIn = Math.floor(Number(String(input).replace(/,/g, '').trim()));
          if (!Number.isFinite(parsedBuyIn) || parsedBuyIn <= 0) {
            setGameMessage('Enter a valid whole-number buy-in amount.');
            return;
          }

          buyInAmount = parsedBuyIn;
          const [minBuyInRaw, maxBuyInRaw] = await Promise.all([
            tableEscrow.minBuyIn(),
            tableEscrow.maxBuyIn()
          ]);

          const token = new ethers.Contract(WSHIDO_TOKEN_ADDRESS, WSHIDO_ABI, signer);
          const tokenDecimals: number = Number(await token.decimals().catch(() => 18));
          const minBuyIn = Number(ethers.formatUnits(minBuyInRaw, tokenDecimals));
          const maxBuyIn = Number(ethers.formatUnits(maxBuyInRaw, tokenDecimals));

          if (buyInAmount < Math.floor(minBuyIn) || buyInAmount > Math.floor(maxBuyIn)) {
            setGameMessage(`Buy-in must be between ${Math.floor(minBuyIn).toLocaleString()} and ${Math.floor(maxBuyIn).toLocaleString()} wSHIDO.`);
            return;
          }

          const buyInWei = ethers.parseUnits(buyInAmount.toString(), tokenDecimals);

          const tokenBalance: bigint = await token.balanceOf(walletAddress);
          if (tokenBalance < buyInWei) {
            setGameMessage(`Insufficient wSHIDO bankroll for buy-in (${buyInAmount.toLocaleString()}).`);
            return;
          }

          await ensureTokenAllowance(signer, walletAddress, TABLE_ESCROW_ADDRESS, buyInWei);
          const finalAllowance: bigint = await token.allowance(walletAddress, TABLE_ESCROW_ADDRESS);
          if (finalAllowance < buyInWei) {
            setGameMessage(`Approval is below buy-in. Approved ${ethers.formatUnits(finalAllowance, tokenDecimals)} wSHIDO, required ${buyInAmount.toLocaleString()} wSHIDO.`);
            return;
          }

          setGameMessage('Please confirm sit-down transaction in your wallet...');
          const tx = await tableEscrow.sitDown(chainSeat, buyInWei);
          setGameMessage('Sit-down submitted. Waiting for confirmation...');
          await tx.wait();
          await fetchWalletBalance(provider, walletAddress);
        }
      } catch (error: any) {
        console.error('Sit-down transaction failed:', error);
        const reason = error?.reason || error?.shortMessage || error?.message || 'Unknown error';
        setGameMessage(`Failed to secure escrow seat: ${reason} ❌`);
        return;
      }
    }

    const selectedAvatar = avatarCategories[avatarCategory]?.[avatarIndex];
    setIsSeated(true);
    setSeatNumber(resolvedSeat);
    socket.emit('sit-down', {
      seat: resolvedSeat,
      buyIn: buyInAmount,
      alias: displayName,
      avatarIndex,
      avatarCategory,
      avatar: selectedAvatar
    });
    setShowLobby(false);
    setAppState('GAME');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setShowAliasModal(false);
    if (ONCHAIN_ESCROW_CONFIGURED) {
      setGameMessage(`Welcome to Real PvP, ${displayName}! 🎰`);
    } else {
      setGameMessage(`Welcome to Real PvP, ${displayName}! On-chain escrow is not configured yet, so top-up/claim actions are disabled.`);
    }
    setTimeout(() => setGameMessage(''), 3000);
  };

  const handleStandUp = () => {
    // Proceed with leaving (no confirmation needed for kicks)
    if (socket) {
      socket.emit('stand-up');
    }
    
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimerState(null);
    
    // Clear all game state
    setIsSeated(false);
    setSeatNumber(0);

    // Ensure any stale demo state is fully cleared.
    setDemoGame(null);
    if (demoGameRef.current) {
      demoGameRef.current = null;
    }
    prevCommunityCardsLengthRef.current = 0;
    
    // Reset session stats
    setSessionBuyIn(0);
    
    // Reset auto-actions
    setAutoFold(false);
    setAutoCheck(false);
    setShowRebuyPopup(false);
    setRebuyPromptActive(false);
    
    // Clear win popups
    setWinPopups([]);
    
    // Clear winning hands history
    setRecentWinningHands([]);
    handNumberRef.current = 0;
    lastWinLogRef.current = ''; // Clear last win message
    
    // DON'T reset table stats - they are persistent across sessions!
    // Table stats remain in localStorage and continue tracking forever
    
    setShowLobby(true);
    setAppState('LOBBY'); // Return to lobby
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setGameMessage('Left the table 👋');
    setTimeout(() => setGameMessage(''), 3000);
  };

  const handleSitAtSeat = (seat: number) => {
    console.log('Sitting at seat:', seat);
    
    // If already seated with a positive stack at a DIFFERENT seat, block
    const myPlayer = players.find((p: any) => p.seat === seatNumber);
    const myStack = myPlayer?.stack ?? 0;
    if (isSeated && seatNumber > 0 && seat !== seatNumber && myStack > 0) {
      setGameMessage('You are already seated! Stand up first to change seats. 🪑');
      return;
    }
    
    // If busted (stack 0) and clicking the same seat, allow re-sit to trigger top-up flow
    if (isSeated && seatNumber > 0 && myStack <= 0) {
      // Reset seated state so confirmSitDown runs the full flow
      setIsSeated(false);
      setSeatNumber(0);
    }
    
    if (!walletConnected) {
      setGameMessage('Please connect your wallet first! 🦊');
      return;
    }
    
    // Seat 0 means just viewing table, not actually seated
    if (seat === 0) {
      setShowLobby(false);
      setIsSeated(false);
      setSeatNumber(0);
      setGameMessage('Viewing table. Click an empty seat to sit down! 👀');
      return;
    }
    
    // Validate seat number (1-6 always valid)
    if (seat < 1 || seat > 6) {
      setGameMessage('Please choose a valid seat (1-6). 🎮');
      setTimeout(() => setGameMessage(''), 3000);
      return;
    }
    
    handleSitDown('real-pvp-table', seat, 'REAL_PVP');
  };

  // Ruby Ace AI Response Handler
  const handleJackChat = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Add user message
    const newMessages = [...jackChatMessages, { role: 'user' as const, text: userMessage }];
    setJackChatMessages(newMessages);
    setJackChatInput('');
    setJackIsTyping(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    let response = '';
    const normalizedMessage = normalizeRubyMessage(userMessage);

    if (isRubyInsightsRequest(normalizedMessage)) {
      response = summarizeRubyTelemetry(loadRubyTelemetry());
    } else if (isRubyTrainingRequest(normalizedMessage)) {
      response = 'Best way to feed me more poker knowledge is to expand my intent map with player slang and examples. Add 5-10 real phrasings per topic, map them to one answer, then review chat insights to see which terms still miss.';
    } else {
      const scoredMatches = RUBY_INTENTS
        .map((rule) => scoreRubyIntent(normalizedMessage, rule))
        .filter((match): match is RubyIntentMatch => match !== null)
        .sort((a, b) => b.score - a.score);

      if (scoredMatches.length > 0 && scoredMatches[0].score >= 3) {
        const topMatch = scoredMatches[0];
        const confidence = Math.min(0.98, Number((topMatch.score / 9).toFixed(2)));
        const closeSecond = scoredMatches[1];

        response = topMatch.rule.response;

        if (closeSecond && closeSecond.score >= topMatch.score - 1) {
          response += ` Also related: ${closeSecond.rule.response}`;
        }

        if (confidence < 0.45) {
          response += ' If you include street + stack size + action (for example: turn, 40bb, facing half-pot bet), I can be more precise.';
        }

        saveRubyTelemetry({
          timestamp: Date.now(),
          originalMessage: userMessage,
          normalizedMessage,
          intent: topMatch.rule.id,
          confidence
        });
      } else {
        response = RUBY_FALLBACK_RESPONSES[Math.floor(Math.random() * RUBY_FALLBACK_RESPONSES.length)];

        saveRubyTelemetry({
          timestamp: Date.now(),
          originalMessage: userMessage,
          normalizedMessage,
          intent: 'fallback',
          confidence: 0
        });
      }
    }

    setJackIsTyping(false);
    setJackChatMessages([...newMessages, { role: 'jack' as const, text: response }]);
  };

  const startDemoTimer = (seat: number) => {
    console.log('[Timer] Starting timer for seat:', seat);
    
    // Check if player is all-in or sitting out - don't start timer if they are
    if (demoGameRef.current) {
      const gameState = demoGameRef.current.getState();
      const player = gameState.players.find((p: any) => p && p.seat === seat);
      
      // Skip timer if player is all-in
      if (player && player.allIn) {
        console.log('[Timer] Player is all-in, skipping timer and advancing');
        setTimeout(() => {
          if (demoGameRef.current) {
            demoGameRef.current.handleTimerExpiry(seat);
          }
        }, 100);
        return;
      }
      
      // Skip timer if player is sitting out
      if (player && player.sittingOut) {
        console.log('[Timer] Player is sitting out, skipping timer and auto-folding');
        setTimeout(() => {
          if (demoGameRef.current) {
            demoGameRef.current.handlePlayerAction('fold');
          }
        }, 100);
        return;
      }
    }
    
    // Clear any existing timer interval AND state
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    // Clear old timer state immediately to prevent display flicker
    setTimerState(null);
    
    // Initialize timer state
    const initialTimerState = {
      playerId: seat.toString(),
      baseTimeMs: 30000, // 30 seconds total
      baseMaxMs: 30000,
      timeBankMs: 0, // No time bank
      timeBankMaxMs: 0,
      usingTimeBank: false
    };
    
    console.log('[Timer] Setting timer state:', initialTimerState);
    setTimerState(initialTimerState);
    
    // Start countdown
    const interval = setInterval(() => {
      setTimerState((prev: any) => {
        if (!prev) return null;
        
        if (!prev.usingTimeBank) {
          const timeInSeconds = Math.floor(prev.baseTimeMs / 1000);
          const prevSeconds = Math.floor((prev.baseTimeMs + 100) / 1000);
          
          // Log only on state changes: Yellow zone (15s) and Red zone (5s)
          if (timeInSeconds === 15 && prevSeconds === 16) {
            console.log('[Timer] ⚠️ WARNING ZONE - 15 seconds remaining (Yellow)');
          } else if (timeInSeconds === 5 && prevSeconds === 6) {
            console.log('[Timer] 🚨 CRITICAL ZONE - 5 seconds remaining (Red)');
          }
          
          // Countdown timer (30 seconds, no time bank)
          const newBaseTime = Math.max(0, prev.baseTimeMs - 100);
          
          if (newBaseTime === 0) {
            // Timer expired - check for auto-actions first
            clearInterval(interval);
            if (demoGameRef.current && seat) {
              // Get current game state to check actual bet amount
              const gameState = demoGameRef.current.getState();
              const myPlayer = gameState.players.find((p: any) => p.isMe);
              const callAmount = myPlayer ? gameState.currentBet - myPlayer.bet : 0;
              
              console.log('[Timer] ⏰ EXPIRED - 0 seconds! Auto-fold:', autoFoldRef.current, 'Auto-check:', autoCheckRef.current, 'Call amount:', callAmount);
              
              // Check if auto-actions are enabled (use refs to avoid stale closure)
              if (autoFoldRef.current && callAmount > 0) {
                // Auto-fold when facing any bet
                console.log('[Auto-Action] Auto-folding to bet:', callAmount);
                demoGameRef.current.handlePlayerAction('fold');
              } else if (autoCheckRef.current && callAmount === 0) {
                // Auto-check when no bet (won't call any amount)
                console.log('[Auto-Action] Auto-checking (no bet)');
                demoGameRef.current.handlePlayerAction('check');
              } else {
                // No auto-action enabled or doesn't apply, use default timeout behavior
                console.log('[Timer Expiry] Calling handleTimerExpiry for seat:', seat);
                demoGameRef.current.handleTimerExpiry(seat);
              }
            } else {
              console.log('[Timer Expiry] NOT calling handleTimerExpiry - demoGameRef.current:', !!demoGameRef.current, 'seat:', seat);
            }
            return null;
          }
          
          return {
            ...prev,
            baseTimeMs: newBaseTime
          };
        }
      });
    }, 100);
    
    setTimerInterval(interval);
  };
  
  // Heads-Up Demo Game
  const [demoGame, setDemoGame] = useState<any>(null);
  const demoGameRef = useRef<any>(null); // Ref to hold current game instance for timer callbacks
  const prevCommunityCardsLengthRef = useRef<number>(0); // Track previous community cards length

  const startDemoGame = (playerSeat: number, numPlayers: number) => {
    // Import and create multi-player demo game with selected player count
    console.log('[startDemoGame] Creating game with:', { playerSeat, numPlayers });
    import('./utils/MultiPlayerPokerGame').then(({ MultiPlayerPokerGame }) => {
      const game = new MultiPlayerPokerGame(
        playerSeat, 
        numPlayers, 
        (gameState) => {
        // Update UI with game state - enhance with tracking data
        const enhancedPlayers = gameState.players.map((p: any) => ({
          ...p,
          handsPlayed: p.isMe ? playerStats.handsPlayed : (p.handsPlayed || 0),
          handsWon: p.isMe ? playerStats.handsWon : (p.handsWon || 0),
          biggestPot: p.isMe ? playerStats.biggestPot : (p.biggestPot || 0),
          currentBuyIn: p.isMe ? sessionBuyIn : (p.currentBuyIn || p.stack)
        }));
        setPlayers(enhancedPlayers);
        
        // Track initial buy-in (set once when joining)
        if (sessionBuyIn === 0) {
          const myPlayer = gameState.players.find((p: any) => p.isMe);
          if (myPlayer && myPlayer.stack > 0) {
            setSessionBuyIn(myPlayer.stack);
          }
        }
        
        // Update community cards with reveal animation
        const newCommunityCards = gameState.communityCards || [];
        
        // Check if new cards were dealt (use ref to avoid false positives from re-renders)
        const prevLength = prevCommunityCardsLengthRef.current;
        if (newCommunityCards.length > prevLength) {
          // New cards dealt - play woosh sounds
          const numNewCards = newCommunityCards.length - prevLength;
          for (let i = 0; i < numNewCards; i++) {
            setTimeout(() => playCardWoosh(), i * 300); // Stagger sounds
          }
          // Update ref
          prevCommunityCardsLengthRef.current = newCommunityCards.length;
        } else if (newCommunityCards.length === 0 && prevLength > 0) {
          // New hand started - reset ref
          prevCommunityCardsLengthRef.current = 0;
        }
        
        // Always update community cards and reveal count together
        setCommunityCards(newCommunityCards);
        setRevealedCards(newCommunityCards.length);
        
        setPot(gameState.pot);
        
        // Check if it's now player's turn (with better tracking to prevent duplicate sounds)
        const previousPlayer = lastCurrentPlayerRef.current;
        const currentGamePlayer = gameState.currentPlayer;
        const isNowMyTurn = currentGamePlayer === playerSeat;
        
        // Only play notification if:
        // 1. It's now my turn
        // 2. The current player has actually changed from last update
        // 3. It wasn't my turn before
        if (isNowMyTurn && previousPlayer !== null && previousPlayer !== playerSeat && currentGamePlayer !== previousPlayer) {
          console.log('[Turn Notification] Playing - Previous:', previousPlayer, 'Current:', currentGamePlayer, 'PlayerSeat:', playerSeat);
          playTurnNotification(); // Subtle nudge when it's your turn
        }
        
        // Update the ref for next comparison
        lastCurrentPlayerRef.current = currentGamePlayer;
          
        // Check for auto-actions ONLY when it becomes my turn (not on every state update)
        if (isNowMyTurn && previousPlayer !== null && previousPlayer !== playerSeat && currentGamePlayer !== previousPlayer) {
          const myPlayer = gameState.players.find((p: any) => p.isMe);
          const callAmount = myPlayer ? gameState.currentBet - myPlayer.bet : 0;
          
          console.log('[Auto-Action Check] Turn started - Auto-fold:', autoFoldRef.current, 'Auto-check:', autoCheckRef.current, 'Call amount:', callAmount);
          
          // PRIORITY: Check takes precedence over fold when possible (callAmount === 0)
          if (autoCheckRef.current && callAmount === 0 && demoGameRef.current) {
            console.log('[Auto-Action] IMMEDIATELY auto-checking (no bet - CHECK has priority over FOLD)');
            setTimeout(() => {
              if (demoGameRef.current) {
                demoGameRef.current.handlePlayerAction('check');
              }
            }, 500); // Small delay for visual feedback
          }
          // Auto-fold if enabled and facing a bet (and not checking)
          else if (autoFoldRef.current && callAmount > 0 && demoGameRef.current) {
            console.log('[Auto-Action] IMMEDIATELY auto-folding to bet:', callAmount);
            setTimeout(() => {
              if (demoGameRef.current) {
                demoGameRef.current.handlePlayerAction('fold');
              }
            }, 500); // Small delay for visual feedback
          }
        }
        
        console.log('[Game State Update] Current player seat:', gameState.currentPlayer);
        setCurrentPlayer(gameState.currentPlayer);
        
        // Update current bet for CHECK/CALL button logic
        if (gameState.currentBet !== undefined) {
          const myPlayer = gameState.players.find((p: any) => p.isMe);
          const callAmount = myPlayer ? gameState.currentBet - myPlayer.bet : 0;
          setCurrentBet(callAmount > 0 ? callAmount : 0);
        }
        
        // Update my cards from players array
        const myPlayer = gameState.players.find((p: any) => p.isMe);
        if (myPlayer && myPlayer.cards && myPlayer.cards.length > 0) {
          setMyCards(prevCards => {
            // Play woosh sound for initial deal
            if (prevCards.length === 0 && myPlayer.cards && myPlayer.cards.length === 2) {
              playCardWoosh();
              setTimeout(() => playCardWoosh(), 300);
            }
            return myPlayer.cards || [];
          });
        }
        
        // Update opponent cards for showdown (use first AI player's cards for compatibility)
        const firstAI = gameState.players.find((p: any) => !p.isMe && !p.folded);
        if (firstAI && firstAI.cards) {
          setOpponentCards(firstAI.cards);
        }
        setShowOpponentCards(gameState.showdown || false);
        
        // Update rake tracking
        if (gameState.totalRakeCollected !== undefined) {
          setTotalRakeCollected(gameState.totalRakeCollected);
        }
        
        // Sit out status now persists until player manually unchecks it
        // (removed auto-clear logic - player stays sitting out until they toggle it off)
        
        // Apply pending rebuy at start of new hand
        if (gameState.street === 'preflop' && gameState.communityCards.length === 0 && pendingRebuy > 0) {
          const myPlayer = gameState.players.find((p: any) => p.isMe);
          if (myPlayer && demoGameRef.current) {
            console.log('[Rebuy] Applying pending rebuy:', pendingRebuy, 'wSHIDO at start of new hand');
            demoGameRef.current.addChips(myPlayer.seat, pendingRebuy);
            setGameMessage(`💰 ${pendingRebuy.toLocaleString()} wSHIDO added to your table stack!`);
            setPendingRebuy(0); // Clear pending rebuy
            setTimeout(() => setGameMessage(''), 3000);
          }
        }
        
        // Update player stats when hand completes
        if (gameState.street === 'preflop' && gameState.communityCards.length === 0) {
          // New hand started - increment hands played
          setPlayerStats(prev => {
            // Find previous and current stack
            const myPlayer = gameState.players.find((p: any) => p.isMe);
            const prevStack = prev.totalWon - prev.totalLost + 100; // Original starting stack
            const currentStack = myPlayer?.stack || 0;
            const stackChange = currentStack - prevStack;
            
            const newHandsPlayed = prev.handsPlayed + 1;
            
            // Check if we won or lost
            let newTotalWon = prev.totalWon;
            let newTotalLost = prev.totalLost;
            let newHandsWon = prev.handsWon;
            let newBiggestPot = prev.biggestPot;
            let newTotalRakePaid = prev.totalRakePaid;
            
            // Update session stats with hand result
            if (sessionStatsData && myPlayer) {
              const won = stackChange > 0;
              const potSize = gameState.pot || Math.abs(stackChange);
              const amountWon = stackChange > 0 ? stackChange : 0;
              const amountLost = stackChange < 0 ? Math.abs(stackChange) : 0;
              const isShowdown = gameState.showdown || false;
              const isAllIn = myPlayer.allIn || false;
              
              const updatedStats = updateStatsAfterHand(sessionStatsData, {
                won,
                potSize,
                amountWon,
                amountLost,
                folded: myPlayer.folded || false,
                wentAllIn: isAllIn,
                reachedShowdown: isShowdown,
                wonShowdown: isShowdown && won,
                currentBalance: currentStack
              });
              setSessionStatsData(updatedStats);
              saveStats(updatedStats);
            }
            
            if (stackChange > 0) {
              newTotalWon += stackChange;
              newHandsWon += 1;
              if (stackChange > newBiggestPot) {
                newBiggestPot = stackChange;
              }
            } else if (stackChange < 0) {
              newTotalLost += Math.abs(stackChange);
            }
            
            // Add rake paid
            if (gameState.rake > 0) {
              newTotalRakePaid += gameState.rake;
            }
            
            const newWinRate = newHandsPlayed > 0 ? (newHandsWon / newHandsPlayed) * 100 : 0;
            
            return {
              ...prev,
              totalWon: newTotalWon,
              totalLost: newTotalLost,
              handsPlayed: newHandsPlayed,
              handsWon: newHandsWon,
              biggestPot: newBiggestPot,
              totalRakePaid: newTotalRakePaid,
              winRate: newWinRate
            };
          });
        }
        
        // Update game log
        const formattedLog = gameState.gameLog.map((log: any) => ({
          action: log.action,
          player: log.type === 'system' ? 'System' : log.type === 'action' ? 'Player' : 'Dealer',
          timestamp: new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false }),
          type: log.type
        }));
        setGameLog(formattedLog);

        // Check for winning hand and show banner (only once per hand)
        // Look for trophy emoji in game log to detect winner
        const winLog = gameState.gameLog.find((log: any) => log.action.includes('🏆'));
        if (winLog && gameState.winningHand) {
          // Only show banner if this is a NEW win message (not the same one we just showed)
          if (winLog.action !== lastWinLogRef.current) {
            // Check if this was a showdown or fold win (muck)
            const isMuckWin = winLog.action.includes('(all others folded)');
            
            // Parse winner and pot from log message
            // Format: "🏆 You win 400 with Two Pair, J's & 2's (K kicker)"
            const winMatch = winLog.action.match(/🏆 (.+?) win[s]? (\d+)/);
            if (winMatch) {
              const winner = winMatch[1];
              const potSize = parseInt(winMatch[2]);
              const currentHandNumber = handNumberRef.current + 1;
              
              console.log('[Winner Banner] Showing NEW winner:', winner, 'Pot:', potSize, 'Hand:', gameState.winningHand, 'Muck:', isMuckWin);
              
              // Store this win message so we don't show it again
              lastWinLogRef.current = winLog.action;
              lastWinnerHandRef.current = currentHandNumber;
              handNumberRef.current = currentHandNumber;
              
              setBannerData({
                winningHand: gameState.winningHand,
                winner,
                potSize
              });
              setShowWinningBanner(true);
              
              // Check if this is a premium hand and trigger EPIC victory animation
              if (!isMuckWin) { // Only for showdown wins, not fold wins
                if (gameState.winningHand.includes('Royal Flush')) {
                  triggerVictoryAnimation('royal-flush', winner, potSize);
                } else if (gameState.winningHand.includes('Straight Flush')) {
                  triggerVictoryAnimation('straight-flush', winner, potSize);
                } else if (gameState.winningHand.includes('Four of a Kind')) {
                  triggerVictoryAnimation('four-of-a-kind', winner, potSize);
                } else if (gameState.winningHand.includes('Full House')) {
                  triggerVictoryAnimation('full-house', winner, potSize);
                }
              }
              
              // Get winner's cards for epic popup
              // Handle multiple winners (split pot) - parse comma-separated names
              const winnerNames = winner.split(',').map(name => name.trim());
              const isPlayerWinner = winnerNames.includes('You');
              
              // Find the first winner to show their cards (prioritize the player)
              let winnerPlayer = isPlayerWinner 
                ? gameState.players.find(p => p.isMe)
                : gameState.players.find(p => winnerNames.includes(p.name || ''));
              
              // Get second place (best losing hand) - exclude all winners
              const activePlayers = gameState.players
                .filter(p => !p.folded && p.cards && p.cards.length > 0 && 
                       !(p.isMe && isPlayerWinner) && !winnerNames.includes(p.name || ''))
                .sort((a, b) => {
                  // Simple sort - in real scenario would use hand evaluation
                  return (b.cards?.length || 0) - (a.cards?.length || 0);
                });
              const secondPlacePlayer = activePlayers[0];
              
              // Show epic winner popup with cards - ONLY if it's a showdown (not a muck win)
              // This shows who won and with what cards, even if you lost
              if (!isMuckWin && winnerPlayer && winnerPlayer.cards && winnerPlayer.cards.length > 0) {
                lastWinnerPopupRef.current = winLog.action; // Mark popup as shown for this win
                setWinnerPopupData({
                  winner,
                  amount: potSize,
                  winningHand: gameState.winningHand,
                  // If winner mucked their cards, show empty array (will display as "?" "?")
                  winnerCards: winnerPlayer.hasMucked ? [] : winnerPlayer.cards,
                  secondPlace: secondPlacePlayer ? {
                    name: secondPlacePlayer.isMe ? 'You' : (secondPlacePlayer.name || 'Opponent'),
                    // If second place mucked, don't show their cards either
                    cards: secondPlacePlayer.hasMucked ? [] : (secondPlacePlayer.cards || []),
                    // Evaluate second place hand with pokersolver
                    handType: secondPlacePlayer.hasMucked ? 'Mucked' : evaluatePokerHand(
                      secondPlacePlayer.cards || [],
                      gameState.communityCards || []
                    )
                  } : undefined
                });
                setShowWinnerPopup(true);
                console.log('[Winner Popup] SHOWING popup for:', winner, 'Hand:', gameState.winningHand, 'Cards:', winnerPlayer.cards, 'isMe:', winnerPlayer.isMe);
                
                // 🎰 TRIGGER CHIP SLIDE ANIMATION
                // Calculate pot position (center of table)
                const tableRect = document.querySelector('.poker-table')?.getBoundingClientRect();
                const potPosition = tableRect 
                  ? { x: tableRect.left + tableRect.width / 2, y: tableRect.top + tableRect.height / 2 }
                  : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
                
                // Get winner positions - handle multiple winners
                const winnerSeats = (gameState.players || [])
                  .filter((p: any) => p && typeof p.seat === 'number' && winnerNames.includes(p.isMe ? 'You' : (p.name || '')))
                  .map((p: any) => {
                    // Calculate position based on seat number (circular layout)
                    const seatElement = document.querySelector(`[data-seat="${p.seat}"]`);
                    const rect = seatElement?.getBoundingClientRect();
                    return {
                      seatNumber: p.seat,
                      position: rect 
                        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
                        : potPosition,
                      amount: potSize / winnerNames.length // Split pot evenly
                    };
                  });
                
                if (winnerSeats.length > 0) {
                  setTimeout(() => {
                    setChipSlideWinners(winnerSeats);
                  }, 800); // Start after brief pause for dramatic effect
                  
                  // Clear chip animation after completion
                  setTimeout(() => {
                    setChipSlideWinners([]);
                  }, 3500);
                }
                
                // Auto-hide winner popup after 6 seconds
                setTimeout(() => {
                  console.log('[Winner Popup] Auto-hiding after 6s');
                  setShowWinnerPopup(false);
                }, 6000);
              } else {
                console.log('[Winner Popup] NOT showing - isMuckWin:', isMuckWin, 'winnerPlayer:', !!winnerPlayer, 'cards:', winnerPlayer?.cards?.length);
              }
              
              // Add to winning hands history
              const handType: string = gameState.winningHand;
              setRecentWinningHands(prev => [...prev, {
                handNumber: currentHandNumber,
                winner,
                handType,
                potSize,
                timestamp: Date.now()
              }]);
              
              // Update table stats
              updateTableStats(potSize, gameState.winningHand, gameState.pot || potSize);
              
              // Update win streaks for aura system
              setPlayerStreaks(prevStreaks => {
                const newStreaks = new Map(prevStreaks);
                
                // Find ALL winners from game log (including side pots)
                // Look for all 🏆 messages in the log to find all pot winners
                const allWinners = new Set<string>();
                gameState.gameLog.forEach((log: any) => {
                  if (log.action.includes('🏆') && log.action.includes('win')) {
                    // Extract winner name(s) from log message
                    // Format: "🏆 [Winner(s)] win [amount] with [hand]"
                    const winMatch = log.action.match(/🏆\s+([^:]+?)(?:\s+win|\:)/);
                    if (winMatch) {
                      const winners = winMatch[1].split(',').map((w: string) => w.trim());
                      winners.forEach((w: string) => allWinners.add(w));
                    }
                  }
                });
                
                console.log('[Hot Streak] All winners found:', Array.from(allWinners));
                
                // Update all winners (increase win streak)
                allWinners.forEach(winnerName => {
                  const winnerSeat = gameState.players?.findIndex((p: any) => 
                    (p.name === winnerName || (p.isMe && winnerName === 'You'))
                  );
                  if (winnerSeat !== -1) {
                    const currentStreak = newStreaks.get(winnerSeat) || 0;
                    const newStreak = Math.max(0, currentStreak) + 1;
                    newStreaks.set(winnerSeat, newStreak);
                    console.log('[Hot Streak] Updated winner:', winnerName, 'Seat:', winnerSeat, 'Streak:', newStreak);
                  }
                });
                
                // Update losers (decrease streak) - anyone who played but didn't win
                activePlayers.forEach((player: any) => {
                  const playerName = player.isMe ? 'You' : player.name;
                  if (!allWinners.has(playerName)) {
                    const playerSeat = gameState.players?.findIndex((p: any) => 
                      p.name === playerName || (p.isMe && playerName === 'You')
                    );
                    if (playerSeat !== -1) {
                      const currentStreak = newStreaks.get(playerSeat) || 0;
                      const newStreak = Math.min(0, currentStreak) - 1;
                      newStreaks.set(playerSeat, newStreak);
                      console.log('[Hot Streak] Updated loser:', playerName, 'Seat:', playerSeat, 'Streak:', newStreak);
                    }
                  }
                });
                
                return newStreaks;
              });
              
              // Hide banner after 4.5 seconds (before new hand starts at 5s)
              setTimeout(() => {
                console.log('[Winner Banner] Hiding banner');
                setShowWinningBanner(false);
              }, 4500);
            }
          } else {
            console.log('[Winner Banner] Already showed this win:', lastWinLogRef.current);
            
            // BUT check if we need to show the popup still (in case player busted after banner was shown)
            if (winLog.action !== lastWinnerPopupRef.current && gameState.winningHand) {
              const isMuckWin = winLog.action.includes('(all others folded)');
              const winMatch = winLog.action.match(/🏆 (.+?) win[s]? (\d+)/);
              
              if (winMatch && !isMuckWin) {
                const winner = winMatch[1];
                const potSize = parseInt(winMatch[2]);
                
                // Handle multiple winners (split pot) - parse comma-separated names
                const winnerNames = winner.split(',').map(name => name.trim());
                const isPlayerWinner = winnerNames.includes('You');
                
                // Find the first winner to show their cards (prioritize the player)
                const winnerPlayer = isPlayerWinner 
                  ? gameState.players.find(p => p.isMe)
                  : gameState.players.find(p => winnerNames.includes(p.name || ''));
                
                if (winnerPlayer && winnerPlayer.cards && winnerPlayer.cards.length > 0) {
                  const activePlayers = gameState.players
                    .filter(p => !p.folded && p.cards && p.cards.length > 0 && 
                           !(p.isMe && isPlayerWinner) && !winnerNames.includes(p.name || ''))
                    .sort((a, b) => (b.cards?.length || 0) - (a.cards?.length || 0));
                  const secondPlacePlayer = activePlayers[0];
                  
                  lastWinnerPopupRef.current = winLog.action;
                  setWinnerPopupData({
                    winner,
                    amount: potSize,
                    winningHand: gameState.winningHand,
                    winnerCards: winnerPlayer.cards,
                    secondPlace: secondPlacePlayer ? {
                      name: secondPlacePlayer.isMe ? 'You' : (secondPlacePlayer.name || 'Opponent'),
                      cards: secondPlacePlayer.cards || [],
                      handType: 'Unknown Hand'
                    } : undefined
                  });
                  setShowWinnerPopup(true);
                  console.log('[Winner Popup] SHOWING popup (banner already shown) for:', winner, 'Cards:', winnerPlayer.cards);
                  
                  setTimeout(() => {
                    console.log('[Winner Popup] Auto-hiding after 6s');
                    setShowWinnerPopup(false);
                  }, 6000);
                } else {
                  console.log('[Winner Popup] SKIPPING - no winnerPlayer or cards');
                }
              } else {
                console.log('[Winner Popup] SKIPPING - no winMatch or isMuckWin:', isMuckWin);
              }
            } else {
              console.log('[Winner Popup] SKIPPING - popup already shown or no winningHand');
            }
          }
        }
        
        // Clear the last win log ONLY when new hand starts (preflop with no community cards dealt yet)
        if (gameState.street === 'preflop' && gameState.communityCards.length === 0) {
          const hasWinLog = gameState.gameLog.some((log: any) => log.action.includes('🏆'));
          if (!hasWinLog && lastWinLogRef.current !== '') {
            // No win log means new hand has started, safe to clear
            console.log('[Winner Banner] New hand started, clearing lastWinLogRef and lastWinnerPopupRef');
            lastWinLogRef.current = '';
            lastWinnerPopupRef.current = '';
          }
        }
      }, (playerId) => {
        // Timer callback - start/restart timer on every turn
        startDemoTimer(playerId);
      }, undefined, () => {
        // Player busted callback - show fund-or-walk popup
        // DELAY to let winner popup show first (winner banner shows for 4.5s)
        console.log('[Player Busted] Stack is 0, checking balance:', balance);
        setTimeout(() => {
          console.log('[Player Busted] Showing fund-or-walk popup (after delay)');
          setRebuyPromptActive(true);
          setShowRebuyPopup(true);
        }, 5000); // Show after 5 seconds (after winner popup/banner)
      });

      setDemoGame(game);
      demoGameRef.current = game; // Store in ref for timer callbacks
      
      console.log('[Demo Game] Game created, starting first hand...');
      
      // Start the first hand
      try {
        game.startNewHand();
        console.log('[Demo Game] First hand started successfully');
      } catch (error) {
        console.error('[Demo Game] Error starting hand:', error);
      }
      
      // Show game started message
      setGameMessage('🎴 4-Player Demo Game Started! Playing against 3 AI opponents 🤖🎮👾');
      setTimeout(() => setGameMessage(''), 3000);
      
      // Timer will be started by the onTurnStart callback automatically
    }).catch(error => {
      console.error('[Demo Game] Failed to load game:', error);
      setGameMessage('❌ Failed to start demo game. Please refresh and try again.');
    });
  };

  const handleSendMessage = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    
    // In demo mode, just add to local messages
    if (demoMode) {
      const newMessage = { user: 'You', text: trimmed };
      setMessages(prev => [...prev, newMessage]);
      return;
    }
    
    // In multiplayer mode, send via socket
    if (socket && isSeated) {
      socket.emit('chat-message', { message: trimmed });
      return;
    }

    setGameMessage('Sit at the table to send chat messages 💬');
    setTimeout(() => setGameMessage(''), 2000);
  };
  
  const handleRequestTimeBank = () => {
    // No time bank in this version - 30 second single timer only
    setGameMessage('⚠️ No time bank available!');
    setTimeout(() => setGameMessage(''), 2000);
  };
  
  // Track timer state to activate hexagon animations
  useEffect(() => {
    setHexagonsActive(!!timerState);
  }, [timerState]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Detect pot winners for win popup animation
  useEffect(() => {
    // Check if pot decreased (someone won)
    if (prevPotRef.current > 0 && pot === 0 && players.length > 0) {
      // Find player(s) whose stack increased
      const potWon = prevPotRef.current;
      
      // Look through game log for winner
      const recentLogs = gameLog.slice(-5); // Check last 5 log entries
      const winLog = recentLogs.find(log => 
        log.action.toLowerCase().includes('wins') || 
        log.action.toLowerCase().includes('won')
      );
      
      if (winLog) {
        // Extract seat number from log message (e.g., "Seat 2 wins 2000")
        const seatMatch = winLog.action.match(/(?:Seat |Player )?(\d)/);
        if (seatMatch) {
          const winningSeat = parseInt(seatMatch[1]);
          setWinPopups([{ seat: winningSeat, amount: potWon }]);
          
          // Auto-clear after animation completes
          setTimeout(() => setWinPopups([]), 2500);
        }
      }
    }
    
    // Update previous pot reference
    prevPotRef.current = pot;
  }, [pot, gameLog, players]);

  // Theme-based background styles
  const themeBackgrounds = {
    dark: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950',
    classic: 'bg-gradient-to-br from-amber-950 via-stone-900 to-neutral-950',
    light: 'bg-gradient-to-br from-slate-100 via-blue-50 to-gray-100',
    executive: 'bg-gradient-to-br from-black via-slate-950 to-black'
  };

  const themeGrids = {
    dark: { primary: '#1e3a8a15', secondary: '#1e3a8a08', accent: 'blue-900/20' },
    classic: { primary: '#78350f15', secondary: '#78350f08', accent: 'amber-900/20' },
    light: { primary: '#3b82f620', secondary: '#3b82f610', accent: 'blue-400/15' },
    executive: { primary: '#D4AF3715', secondary: '#D4AF3708', accent: 'yellow-600/20' },
    vegas: { primary: '#dc262615', secondary: '#dc262608', accent: 'red-600/20' },
    monaco: { primary: '#3b82f615', secondary: '#3b82f608', accent: 'blue-500/20' },
    golden: { primary: '#f59e0b15', secondary: '#f59e0b08', accent: 'amber-500/20' },
    cyber: { primary: '#8b5cf615', secondary: '#8b5cf608', accent: 'purple-500/20' },
    gatsby: { primary: '#84cc1615', secondary: '#84cc1608', accent: 'green-500/20' }
  };

  const currentGrid = themeGrids[theme];

  // Keyboard Shortcuts - Professional feature
  const isMyTurn = demoMode && demoGame 
    ? demoGame.getState().currentPlayer === seatNumber 
    : currentPlayer === seatNumber;

  useEffect(() => {
    if (demoMode || !socket || !isSeated || !validActions) {
      return;
    }

    const seatFromServer = Number(validActions?.seat ?? 0);
    const isMyLiveTurn = seatFromServer === seatNumber && currentPlayer === seatNumber;
    if (!isMyLiveTurn) {
      return;
    }

    const callAmount = Number(validActions?.callAmount ?? 0);
    const canCheck = Boolean(validActions?.canCheck);
    const canFold = Boolean(validActions?.canFold);

    let action: 'CHECK' | 'FOLD' | null = null;
    if (autoCheck && canCheck && callAmount === 0) {
      action = 'CHECK';
    } else if (autoFold && canFold && callAmount > 0) {
      action = 'FOLD';
    }

    if (!action) {
      return;
    }

    const turnKey = `${String(gameState?.street || '')}:${seatFromServer}:${callAmount}:${action}`;
    if (liveAutoActionTurnRef.current === turnKey) {
      return;
    }
    liveAutoActionTurnRef.current = turnKey;

    const timeout = setTimeout(() => {
      socket.emit('player-action', { action });
    }, 180);

    return () => clearTimeout(timeout);
  }, [demoMode, socket, isSeated, validActions, seatNumber, currentPlayer, autoCheck, autoFold, gameState?.street]);

  useEffect(() => {
    liveAutoActionTurnRef.current = '';
  }, [currentPlayer, gameState?.street]);

  useKeyboardShortcuts([
    {
      key: POKER_SHORTCUTS.FOLD.key,
      description: 'Fold',
      action: () => handleAction('fold'),
      enabled: isMyTurn && isSeated,
    },
    {
      key: POKER_SHORTCUTS.CALL.key,
      description: 'Call/Check',
      action: () => {
        const myPlayer = demoMode && demoGame 
          ? demoGame.getState().players.find((p: any) => p.isMe)
          : players.find((p: any) => p && p.seat === seatNumber);
        const callAmount = myPlayer ? (demoGame?.getState().currentBet || currentBet) - myPlayer.bet : 0;
        if (callAmount > 0) {
          handleAction('call');
        } else {
          handleAction('check');
        }
      },
      enabled: isMyTurn && isSeated,
    },
    {
      key: POKER_SHORTCUTS.RAISE.key,
      description: 'Raise/Bet',
      action: () => {
        // Trigger raise - will use slider value from Actions component
        const raiseAmount = currentBet > 0 ? currentBet * 2 : 1000;
        handleAction('raise', raiseAmount);
      },
      enabled: isMyTurn && isSeated,
    },
    {
      key: POKER_SHORTCUTS.ALL_IN.key,
      description: 'All In',
      action: () => {
        const myStack = demoMode && demoGame 
          ? demoGame.getState().players.find((p: any) => p.isMe)?.stack || 0
          : players.find((p: any) => p && p.seat === seatNumber)?.stack || 0;
        handleAction('allin', myStack);
      },
      enabled: isMyTurn && isSeated,
    },
    {
      key: POKER_SHORTCUTS.MUTE.key,
      description: 'Toggle Mute',
      action: () => {
        const currentVolume = audioSystem.getVolume();
        if (currentVolume > 0) {
          audioSystem.setVolume(0);
        } else {
          audioSystem.setVolume(0.5);
        }
      },
      enabled: true,
    },
  ], !showLobby);

  useEffect(() => {
    if (!walletAddress.trim()) return;

    const profile = getOrCreateProfile(walletAddress.trim());
    const savedUsername = profile.username?.trim() || '';
    if (savedUsername && savedUsername !== playerAlias) {
      setPlayerAlias(savedUsername);
    }

    syncPlayerStatsFromProfile(walletAddress.trim(), playerAlias);
  }, [walletAddress, showMembersDashboard]);

  useEffect(() => {
    const resolvedAlias = resolveSelfDisplayName(walletAddress, playerAlias);
    setPlayerStats(prev => ({
      ...prev,
      address: walletAddress || prev.address,
      alias: resolvedAlias,
      avatar: avatars[avatarIndex]
    }));
  }, [walletAddress, playerAlias, avatarIndex, avatarCategory]);

  useEffect(() => {
    lastProcessedStatsHandRef.current = '';
    countedRakeHandIdsRef.current.clear();
  }, [walletAddress]);

  const walletAddressShort = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';
  const resolvedPlayerIdentity = resolveSelfDisplayName(walletAddress, playerAlias);
  const selectedHeaderAvatar = avatars?.[avatarIndex] || '👤';
  const headerAvatarIsImage = selectedHeaderAvatar.startsWith('IMG:');
  const headerAvatarImage = headerAvatarIsImage
    ? `/avatars/${selectedHeaderAvatar.replace('IMG:', '')}.png`
    : '';
  const headerAvatarFallback = resolvedPlayerIdentity.trim().charAt(0).toUpperCase() || 'P';
  const openMembersProfile = () => {
    playButtonClick();
    if (!walletAddress.trim()) {
      setGameMessage('Connect wallet to open your profile.');
      setTimeout(() => setGameMessage(''), 2200);
      return;
    }
    setShowMembersDashboard(true);
  };
  const walletOnShido = chainId === SHIDO_CHAIN_ID;
  const walletConnectReady = WALLETCONNECT_PROJECT_ID.length > 0;
  const walletProviderLabel = walletProviderType === 'keplr'
    ? 'Keplr'
    : walletProviderType === 'walletconnect'
      ? 'WalletConnect'
      : 'MetaMask';
  const connectWalletLabel = hasMetaMask && hasKeplr
    ? 'MetaMask / Keplr'
    : hasMetaMask
      ? 'MetaMask'
      : hasKeplr
        ? 'Keplr'
        : walletConnectReady
          ? 'WalletConnect'
          : 'Wallet';
  const connectWalletTitle = walletConnected
    ? `Disconnect ${walletAddressShort}`
    : connectWalletLabel === 'Wallet'
      ? 'Connect Wallet'
      : `Connect ${connectWalletLabel} wallet`;

  // 🎬 SPLASH SCREEN - Show on app load
  if (appState === 'SPLASH') {
    return <SplashScreen onComplete={() => setAppState('LOGIN')} />;
  }

  // 🎮 LOGIN SCREEN - Show after splash
  if (appState === 'LOGIN') {
    return <LoginScreen onLogin={(selectedAvatarCategory, selectedAvatarIndex) => {
      setPlayerAlias('');
      // Use selected avatar from login screen
      setAvatarCategory(selectedAvatarCategory);
      setAvatarIndex(selectedAvatarIndex);
      // Reset runtime mode and wallet state for explicit table selection.
      setTableMode(DEFAULT_TABLE_MODE);
      setDemoMode(false);
      setWalletConnected(false);
      setWalletAddress('');
      setWalletProviderType(null);
      setProvider(null);
      setSigner(null);
      setChainId(null);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }

      // Real-only mode: wallet balance is authoritative.
      setBalance(0);
      
      // Initialize or load session stats
      const sessionAlias = 'Player';
      const existingStats = loadStats();
      if (existingStats && existingStats.playerAlias === sessionAlias) {
        // Continue existing session for this player
        setSessionStatsData(existingStats);
      } else {
        // Start new session with actual buy-in amount
        const newStats = initializeStats(sessionAlias, 0);
        setSessionStatsData(newStats);
        saveStats(newStats);
      }
      
      setAppState('LOBBY');
      setGameMessage('🎰 Welcome! Join a table to start playing.');
      setTimeout(() => setGameMessage(''), 3000);
    }} />;
  }

  const betweenHandsSeconds = Math.max(0, Math.ceil(betweenHandsCountdownMs / 1000));

  return (
    <div className="app-shell h-screen w-screen text-slate-100 flex flex-col relative overflow-hidden">
      {/* Premium ambient background */}
      <div className="ambient-layer fixed inset-0 w-full h-full pointer-events-none overflow-hidden" style={{ zIndex: 0, background: 'linear-gradient(145deg, #0c0f14 0%, #111419 50%, #151921 100%)' }}>
        
        {/* Subtle felt texture */}
        <div 
          className="absolute inset-0 opacity-8"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(34, 139, 34, 0.06) 0px, transparent 1px, transparent 3px)`,
            backgroundSize: '100% 4px'
          }}
        ></div>
        
        {/* Soft ambient glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(ellipse, rgba(20, 184, 166, 0.04) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[400px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(ellipse, rgba(245, 158, 11, 0.03) 0%, transparent 70%)' }} />
        
        {/* Depth vignette */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60"></div>
      </div>
      
      {/* Fixed Header - Full Width - Premium Clean */}
      <header 
        className={`app-header fixed top-0 left-0 right-0 flex justify-between items-center backdrop-blur-xl z-50 ${isMobileFullscreen ? 'mobile-fullscreen' : ''}`}
        style={{
          background: isMobileFullscreen ? 'transparent' : 'rgba(12, 15, 20, 0.92)',
          backdropFilter: isMobileFullscreen ? 'none' : 'blur(20px)',
          borderBottom: isMobileFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isMobileFullscreen ? 'none' : '0 4px 24px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Logo + Wordmark */}
        <div className="flex items-center gap-2 md:gap-4">
          <a
            href="https://poker.bodhix.io"
            className="flex items-center gap-2 md:gap-3 px-1 py-1.5 cursor-pointer"
            title="Back to poker.bodhix.io"
            aria-label="Back to poker.bodhix.io"
          >
            <img 
              src="/poker-logo.png" 
              alt="Poker Logo" 
              className="h-8 md:h-11 w-auto object-contain"
            />
            <span className="text-slate-100/90 text-sm md:text-xl font-extrabold tracking-[0.18em] leading-none">
              POKER
            </span>
          </a>
          
          {/* Mobile Balance Display - Compact & Clickable */}
          <button
            onClick={() => setShowBankingModal(true)}
            className="md:hidden h-9 px-3 rounded-lg border border-amber-400/35 bg-amber-500/10 hover:bg-amber-500/15 text-amber-200 transition-all duration-200 active:scale-95"
            title="Open Banking"
          >
            <span className="font-semibold text-sm tabular-nums">{balance.toLocaleString()}</span>
          </button>

          <button
            onClick={openMembersProfile}
            className="md:hidden h-9 w-9 rounded-lg border border-cyan-400/35 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-100 flex items-center justify-center transition-all duration-200 active:scale-95 overflow-hidden"
            title="Open Member Profile"
            aria-label="Open Member Profile"
          >
            {headerAvatarIsImage ? (
              <img
                src={headerAvatarImage}
                alt="Profile avatar"
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="text-base leading-none">{selectedHeaderAvatar || headerAvatarFallback}</span>
            )}
          </button>
        </div>

        {/* Header Essentials: username, balance, profile, bank + hamburger */}
        <div className="flex items-center gap-2 md:gap-2.5">
          <div className="h-9 md:h-10 px-2.5 md:px-4 rounded-xl border border-white/12 bg-slate-950/70 backdrop-blur-sm flex items-center max-w-[130px] md:max-w-[220px]">
            <span className="font-mono text-xs md:text-sm font-semibold tracking-wide truncate" style={{ color: 'var(--theme-text-secondary)' }}>
              {resolvedPlayerIdentity}
            </span>
          </div>

          <div className="h-9 md:h-10 px-2.5 md:px-4 rounded-xl border border-amber-400/35 bg-amber-500/10 text-amber-200 flex items-center">
            <span className="font-bold text-sm md:text-base tabular-nums">{balance.toLocaleString()}</span>
            <span className="text-amber-200/75 text-[10px] md:text-xs ml-1.5 font-semibold uppercase tracking-wide">wSHIDO</span>
          </div>

          <button
            onClick={openMembersProfile}
            className="hidden md:flex h-10 px-2.5 md:px-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/16 text-cyan-100 items-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-95 max-w-[220px]"
            title="Open Member Profile"
          >
            <span className="h-7 w-7 rounded-full bg-slate-900/85 border border-cyan-300/35 flex items-center justify-center overflow-hidden shrink-0">
              {headerAvatarIsImage ? (
                <img
                  src={headerAvatarImage}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm leading-none">{selectedHeaderAvatar || headerAvatarFallback}</span>
              )}
            </span>
            <span className="font-semibold text-xs md:text-sm tracking-wide truncate" style={{ maxWidth: '138px' }}>
              {resolvedPlayerIdentity}
            </span>
          </button>

          <button
            onClick={() => {
              playButtonClick();
              setDepositModalMessage('');
              setShowDepositModal(true);
            }}
            className="h-9 md:h-10 px-3 md:px-3.5 rounded-xl border border-emerald-400/35 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-200 font-semibold text-[0.72rem] md:text-[0.78rem] tracking-[0.08em] uppercase transition-all duration-200 hover:scale-[1.02] active:scale-95"
            title="Deposit wSHIDO"
          >
            BANK
          </button>

          <button
            onClick={() => {
              playButtonClick();
              setShowMobileMenu((prev) => {
                const next = !prev;
                setExpandedHeaderMenuSection(next ? 'play' : null);
                return next;
              });
            }}
            className="relative w-10 h-10 rounded-xl border border-cyan-400/35 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-200 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            title="Open menu"
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <div className={`w-4 h-0.5 bg-current transition-all ${showMobileMenu ? 'rotate-45 translate-y-1.5' : ''}`}></div>
              <div className={`w-4 h-0.5 bg-current transition-all ${showMobileMenu ? 'opacity-0' : ''}`}></div>
              <div className={`w-4 h-0.5 bg-current transition-all ${showMobileMenu ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
            </div>
          </button>
        </div>
      </header>

      {/* Header Hamburger Dropdown */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[60] animate-fade-in"
            onClick={() => {
              setShowMobileMenu(false);
              setExpandedHeaderMenuSection(null);
            }}
          />
          
          {/* Dropdown Panel */}
          <div 
            className="fixed top-[84px] md:top-[92px] right-3 md:right-6 z-[70] w-[min(92vw,390px)] max-h-[78vh] overflow-y-auto animate-slide-down rounded-2xl"
            style={{
              background: 'rgba(12, 15, 20, 0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 18px 44px rgba(0, 0, 0, 0.58), inset 0 0 28px rgba(var(--theme-accent), 0.08)'
            }}
          >
            <div className="p-4 md:p-5 space-y-3">
              <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2.5">
                <div className="text-[11px] uppercase tracking-widest text-cyan-200/80 font-semibold">Quick Menu</div>
                <div className="mt-1.5 text-xs text-slate-300 flex items-center justify-between">
                  <span className="font-mono text-cyan-100 truncate max-w-[56%]">{resolvedPlayerIdentity}</span>
                  <span className="text-amber-300 font-semibold tabular-nums">{balance.toLocaleString()} wSHIDO</span>
                </div>
                <div className={`mt-1 text-[11px] ${walletConnected ? (walletOnShido ? 'text-emerald-300' : 'text-amber-300') : 'text-violet-300'}`}>
                  {walletConnected ? (walletOnShido ? `${walletProviderLabel}: ${walletAddressShort}` : `${walletProviderLabel}: Wrong Network`) : 'Wallet not connected'}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 hover:bg-slate-800/80 px-3 py-2.5 text-left transition-all duration-200"
                  onClick={() => setExpandedHeaderMenuSection((prev) => prev === 'play' ? null : 'play')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-cyan-200">Play Tools</span>
                    <span className={`text-cyan-300 transition-transform ${expandedHeaderMenuSection === 'play' ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </button>
                {expandedHeaderMenuSection === 'play' && (
                  <div className="ml-2 space-y-1.5">
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 bg-slate-900/50 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-400/30 transition-all"
                      onClick={() => { playButtonClick(); setShowFairnessModal(true); setShowMobileMenu(false); }}>
                      Provably Fair
                    </button>
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 bg-slate-900/50 hover:bg-amber-500/15 border border-white/5 hover:border-amber-400/30 transition-all"
                      onClick={() => { playButtonClick(); setShowLeaderboard(true); setShowMobileMenu(false); }}>
                      Leaderboard
                    </button>
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 bg-slate-900/50 hover:bg-indigo-500/15 border border-white/5 hover:border-indigo-400/30 transition-all"
                      onClick={() => { playButtonClick(); setShowSessionStatsModal(true); setShowMobileMenu(false); }}>
                      Session Stats {sessionStatsData && sessionStatsData.handsPlayed > 0 ? `(${sessionStatsData.handsPlayed})` : ''}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 hover:bg-slate-800/80 px-3 py-2.5 text-left transition-all duration-200"
                  onClick={() => setExpandedHeaderMenuSection((prev) => prev === 'account' ? null : 'account')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-200">Account</span>
                    <span className={`text-emerald-300 transition-transform ${expandedHeaderMenuSection === 'account' ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </button>
                {expandedHeaderMenuSection === 'account' && (
                  <div className="ml-2 space-y-1.5">
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 bg-slate-900/50 hover:bg-violet-500/15 border border-white/5 hover:border-violet-400/30 transition-all"
                      onClick={() => {
                        playButtonClick();
                        if (walletConnected) {
                          disconnectWallet();
                        } else {
                          connectWallet('auto');
                        }
                        setShowMobileMenu(false);
                      }}>
                      {walletConnected ? `Disconnect ${walletProviderLabel}` : 'Connect Wallet'}
                    </button>
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 bg-slate-900/50 hover:bg-slate-600/40 border border-white/5 hover:border-white/25 transition-all"
                      onClick={() => { playButtonClick(); setShowMembersDashboard(true); setShowMobileMenu(false); }}>
                      Profile
                    </button>
                    {isSeated ? (
                      <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-200 bg-red-500/10 hover:bg-red-500/18 border border-red-400/20 hover:border-red-400/35 transition-all"
                        onClick={() => { playButtonClick(); handleStandUp(); setShowMobileMenu(false); }}>
                        Leave Table
                      </button>
                    ) : (
                      <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-200 bg-red-500/10 hover:bg-red-500/18 border border-red-400/20 hover:border-red-400/35 transition-all"
                        onClick={() => {
                          setAppState('SPLASH');
                          setShowLobby(true);
                          setIsSeated(false);
                          setTableMode(DEFAULT_TABLE_MODE);
                          setDemoMode(false);
                          removeWalletListeners();
                          if (walletConnectProviderRef.current?.disconnect) {
                            walletConnectProviderRef.current.disconnect().catch((err: unknown) => {
                              console.warn('WalletConnect disconnect warning:', err);
                            });
                            walletConnectProviderRef.current = null;
                          }
                          setWalletConnected(false);
                          setWalletProviderType(null);
                          if (socket) {
                            socket.disconnect();
                            setSocket(null);
                          }
                          setShowMobileMenu(false);
                          playButtonClick();
                        }}>
                        Logout
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 hover:bg-slate-800/80 px-3 py-2.5 text-left transition-all duration-200"
                  onClick={() => setExpandedHeaderMenuSection((prev) => prev === 'support' ? null : 'support')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-200">Support</span>
                    <span className={`text-amber-300 transition-transform ${expandedHeaderMenuSection === 'support' ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </button>
                {expandedHeaderMenuSection === 'support' && (
                  <div className="ml-2 space-y-1.5">
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 bg-slate-900/50 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-400/30 transition-all"
                      onClick={() => { playButtonClick(); setShowQuickStart(true); setShowMobileMenu(false); }}>
                      Quick Start Guide
                    </button>
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 bg-slate-900/50 hover:bg-teal-500/15 border border-white/5 hover:border-teal-400/30 transition-all"
                      onClick={() => { playButtonClick(); setShowTutorial(true); setShowMobileMenu(false); }}>
                      Full Tutorial
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content - 30px gap under header, with padding top and bottom */}
      <main className={`app-main fixed ${isMobileFullscreen ? 'top-0' : 'top-[104px]'} left-0 right-0 bottom-0 flex flex-col py-3 overflow-auto ${isMobileFullscreen ? 'mobile-fullscreen' : ''}`}>
        {showLobby ? (
          <div className="flex flex-col items-center w-full gap-6 py-6">
            <Lobby 
              onSitDown={handleSitDown} 
              walletConnected={walletConnected}
              walletOnShido={walletOnShido}
              tableBlinds={{
                smallBlind: Number(gameState?.smallBlind || 500),
                bigBlind: Number(gameState?.bigBlind || 1000),
              }}
              tableKpis={{
                handsPlayed: Number(tableStats?.handsPlayed || 0),
                activePlayers: Math.max(Number(tableStats?.totalPlayers || 0), players.filter((p) => !!p).length),
                totalAmountBet: Number(tableStats?.totalWagered || 0),
                highestWon: Math.max(Number(tableStats?.biggestPot || 0), Number(sessionStatsData?.biggestWin || 0)),
              }}
            />

            <div className="w-full flex justify-center -mt-3">
              <button
                onClick={() => {
                  playButtonClick();
                  setShowQuickStart(true);
                }}
                className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-cyan-200 text-sm font-semibold tracking-wide hover:bg-cyan-500/20 transition-all duration-200"
              >
                How To Start Playing
              </button>
            </div>

            {showQuickStart && (
              <div className="fixed inset-0 z-[220] bg-black/75 backdrop-blur-sm flex items-center justify-center px-4">
                <div className="w-full max-w-2xl rounded-2xl border border-cyan-400/35 bg-slate-950/95 shadow-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-cyan-400/25 bg-gradient-to-r from-cyan-500/15 to-teal-500/10">
                    <h2 className="text-2xl font-black tracking-wide text-cyan-200">Welcome To Real PvP</h2>
                    <p className="text-slate-300 text-sm mt-1">Three fast steps to get seated and playing confidently.</p>
                  </div>

                  <div className="p-6 grid gap-3">
                    <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4">
                      <p className="text-cyan-300 font-semibold text-sm">1. Connect your wallet on Shido Network</p>
                      <p className="text-slate-300 text-xs mt-1">Open the menu (top-right) and use Account &gt; Connect Wallet. You can switch wallets anytime.</p>
                      <p className="text-[11px] mt-2 text-emerald-300">{walletConnected ? 'Connected' : 'Not connected yet'}</p>
                    </div>

                    <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4">
                      <p className="text-cyan-300 font-semibold text-sm">2. Pick a table, then click an empty seat</p>
                      <p className="text-slate-300 text-xs mt-1">Go Real opens the table. Empty seat circles around the felt are clickable.</p>
                    </div>

                    <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4">
                      <p className="text-cyan-300 font-semibold text-sm">3. Fund table stack, then act fast</p>
                      <p className="text-slate-300 text-xs mt-1">Top up your seat escrow, then use Fold/Check/Bet/All In panel to play each turn.</p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 flex flex-wrap gap-2">
                    {!walletConnected && (
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          playButtonClick();
                          connectWallet('auto');
                        }}
                      >
                        Connect Wallet
                      </button>
                    )}

                    <button
                      className="btn bg-cyan-700 hover:bg-cyan-600"
                      onClick={() => {
                        playButtonClick();
                        setShowQuickStart(false);
                        setShowTutorial(true);
                      }}
                    >
                      Open Full Tutorial
                    </button>

                    <button
                      className="btn bg-slate-700 hover:bg-slate-600"
                      onClick={() => {
                        playButtonClick();
                        setShowQuickStart(false);
                      }}
                    >
                      Got It
                    </button>

                    <button
                      className="ml-auto text-xs text-slate-400 hover:text-slate-200 underline"
                      onClick={() => {
                        playButtonClick();
                        if (typeof window !== 'undefined') {
                          window.localStorage.setItem(ONBOARDING_DISMISS_KEY, '1');
                        }
                        setShowQuickStart(false);
                      }}
                    >
                      Don't show again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Ruby Ace AI Chat - Bottom Right */}
            <div className="fixed bottom-6 right-6 z-50">
              {/* Ruby Ace Chat Window */}
              {showJackPopup && (
                <>
                  {/* Backdrop overlay - click to close */}
                  <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setShowJackPopup(false)}
                  />
                  
                  {/* Chat box */}
                  <MovableResizablePanel
                    storageKey="ruby-ace-lobby-chat"
                    defaultLayout={{ x: 980, y: 130, width: 384, height: 500 }}
                    minWidth={300}
                    minHeight={360}
                    maxWidth={720}
                    maxHeight={760}
                    zIndex={80}
                  >
                    <div className="glass-card border-2 border-teal-400/40 bg-black/90 backdrop-blur-xl shadow-2xl flex flex-col h-full"
                         style={{ 
                           boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
                         }}>
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-400/60"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-400/60"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-400/60"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-400/60"></div>
                      
                      {/* Ruby Ace Avatar at top */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex justify-center">
                        <img 
                          src="/logo.png" 
                          alt="Ruby Ace" 
                          className="w-20 h-20 rounded-full border-4 border-teal-400/60 bg-black/80 shadow-lg"
                          style={{ filter: '' }}
                        />
                      </div>

                      {/* Header */}
                      <div className="p-4 pb-3 border-b border-teal-400/30">
                        <h3 className="text-xl font-black text-teal-400 text-center tracking-wider"
                            style={{ textShadow: 'none' }}>
                          🤖 Chat with Ruby Ace
                        </h3>
                        <p className="text-xs text-slate-400 text-center mt-1">Your AI Poker Expert</p>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {jackChatMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user'
                                ? 'bg-teal-600/30 border border-teal-400/40 text-white'
                                : 'bg-slate-800/50 border border-slate-700 text-slate-200'
                            }`}>
                              {msg.role === 'jack' && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-teal-400">Ruby Ace</span>
                                  <span className="text-xs text-slate-500">🤖</span>
                                </div>
                              )}
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Typing indicator */}
                        {jackIsTyping && (
                          <div className="flex justify-start">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 max-w-[80%]">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-teal-400">Ruby Ace</span>
                                <span className="text-xs text-slate-500">🤖</span>
                              </div>
                              <div className="flex gap-1 mt-1">
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input Area */}
                      <div className="p-4 border-t border-teal-400/30">
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleJackChat(jackChatInput);
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={jackChatInput}
                            onChange={(e) => setJackChatInput(e.target.value)}
                            placeholder="Ask Ruby Ace in your own words..."
                            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400/50 transition-colors"
                            disabled={jackIsTyping}
                          />
                          <button
                            type="submit"
                            disabled={!jackChatInput.trim() || jackIsTyping}
                            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-all"
                          >
                            Send
                          </button>
                        </form>
                        <p className="text-[10px] text-slate-500 mt-2 text-center italic">{RUBY_INPUT_HINT} Ask "chat insights" to see what players ask most.</p>
                      </div>
                    </div>
                  </MovableResizablePanel>
                </>
              )}

              {/* Floating Ruby Ace button - 10% bigger (4.5rem instead of 4rem) */}
              <button
                onClick={() => {
                  setShowJackPopup(!showJackPopup);
                  playButtonClick();
                }}
                className="group relative rounded-full bg-gradient-to-br from-teal-500 to-purple-600 
                          shadow-lg hover:scale-110 transition-all duration-300 border-2 border-teal-400/50
                          hover:shadow-teal-500/50"
                style={{ 
                  width: '4.5rem',
                  height: '4.5rem',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="Ruby Ace Helper" 
                  className="w-full h-full rounded-full object-cover"
                  style={{ filter: '' }}
                />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 
                               transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                  <div className="bg-black/90 text-teal-400 text-xs font-bold px-3 py-2 rounded-lg border border-teal-400/50"
                       style={{ textShadow: 'none' }}>
                    Chat with Ruby Ace 💬
                  </div>
                </div>
              </button>
            </div>

            {/* Tutorial Panel - Only visible when showTutorial is true */}
            {showTutorial && (
              <div className="fixed inset-0 flex items-center justify-center overflow-auto">
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                  onClick={() => setShowTutorial(false)}
                />
                
                {/* Tutorial Panel */}
                <div className="relative w-full max-w-2xl mx-auto z-50 p-6">
                  <div className="glass-card border-2 border-teal-400/40 bg-black/90 backdrop-blur-xl shadow-2xl"
                       style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' }}>
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-400/60"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-400/60"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-400/60"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-400/60"></div>

                    <div className="p-8 max-h-[80vh] overflow-y-auto">
                      <h2 className="text-3xl font-black text-teal-400 mb-6 text-center tracking-wider"
                          style={{ textShadow: 'none' }}>
                        🎓 Texas Hold'em Tutorial
                      </h2>

                      <div className="space-y-6 text-slate-300">
                        <div>
                          <h3 className="text-xl font-bold text-amber-400 mb-2">🎯 Objective</h3>
                          <p className="text-sm leading-relaxed">
                            Win wSHIDO pots by making the best 5-card poker hand from your 2 hole cards + 5 community cards, 
                            or by making all other players fold.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-amber-400 mb-2">🎴 The Deal</h3>
                          <ul className="space-y-1 text-sm ml-4">
                            <li>• Each player gets 2 face-down hole cards</li>
                            <li>• 5 community cards dealt in stages: Flop (3), Turn (1), River (1)</li>
                            <li>• Dealer button rotates clockwise each hand</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-amber-400 mb-2">💰 Betting Rounds</h3>
                          <ul className="space-y-2 text-sm ml-4">
                            <li>• <span className="text-teal-400 font-semibold">Pre-Flop:</span> After hole cards dealt</li>
                            <li>• <span className="text-teal-400 font-semibold">Flop:</span> After first 3 community cards</li>
                            <li>• <span className="text-teal-400 font-semibold">Turn:</span> After 4th community card</li>
                            <li>• <span className="text-teal-400 font-semibold">River:</span> After 5th community card</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-amber-400 mb-2">🎲 Your Actions</h3>
                          <ul className="space-y-2 text-sm ml-4">
                            <li>• <span className="text-red-400 font-semibold">Fold:</span> Give up your hand</li>
                            <li>• <span className="text-green-400 font-semibold">Check:</span> Pass if no bet to call</li>
                            <li>• <span className="text-teal-400 font-semibold">Call:</span> Match current bet</li>
                            <li>• <span className="text-yellow-400 font-semibold">Raise:</span> Increase the bet</li>
                            <li>• <span className="text-purple-400 font-semibold">All-In:</span> Commit your full table stack</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-amber-400 mb-2">👑 Hand Rankings (Best to Worst)</h3>
                          <ul className="space-y-1 text-xs ml-4">
                            <li>1. <span className="text-purple-400 font-bold">Royal Flush:</span> A-K-Q-J-10 same suit 👑</li>
                            <li>2. <span className="text-blue-400 font-bold">Straight Flush:</span> 5 consecutive same suit 🌊</li>
                            <li>3. <span className="text-teal-400 font-bold">Four of a Kind:</span> 4 same rank 💎</li>
                            <li>4. <span className="text-green-400 font-bold">Full House:</span> 3 of a kind + pair 🏠</li>
                            <li>5. <span className="text-yellow-400 font-bold">Flush:</span> 5 same suit 🌊</li>
                            <li>6. <span className="text-orange-400 font-bold">Straight:</span> 5 consecutive 📏</li>
                            <li>7. <span className="text-red-400 font-bold">Three of a Kind:</span> 3 same rank 🎯</li>
                            <li>8. <span className="text-indigo-400 font-bold">Two Pair:</span> 2 pairs 👥</li>
                            <li>9. <span className="text-slate-400 font-bold">Pair:</span> 2 same rank 👫</li>
                            <li>10. <span className="text-slate-500 font-bold">High Card:</span> Highest card 🎴</li>
                          </ul>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowTutorial(false)}
                        className="mt-6 w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold py-3 px-6 rounded-lg transition-all"
                      >
                        Got It! Let's Play 🎰
                      </button>

                      <div className="text-center text-xs text-slate-500 italic border-t border-slate-700 pt-3 mt-4">
                        Good luck at the tables! 🍀
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Fund or Walk Popup - When player stack is busted */}
            {showRebuyPopup && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200]">
                <div className="glass-card p-8 max-w-md border-2 border-amber-500 animate-slide-in">
                  <h3 className="text-2xl font-bold text-amber-400 mb-4 text-center">You're Busted! Fund or Walk 💸</h3>
                  <p className="text-slate-300 mb-6 text-center">
                    Your table stack is empty. Add at least <span className="text-teal-400 font-bold">{minimumTopUpAmount.toLocaleString()} wSHIDO</span> to keep this seat,
                    or stand up and return to the lobby.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        playButtonClick();
                        handleRebuy(minimumTopUpAmount);
                      }}
                      className="btn btn-primary flex-1"
                    >
                      Fund Seat ({minimumTopUpAmount.toLocaleString()} wSHIDO)
                    </button>
                    <button 
                      onClick={() => {
                        playButtonClick();
                        setShowRebuyPopup(false);
                        setRebuyPromptActive(false);
                        handleStandUp();
                      }}
                      className="btn bg-slate-600 hover:bg-slate-500 flex-1"
                    >
                      Stand Up
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isSeated && players.length === 0 && (
              <div className="fixed top-[130px] left-1/2 -translate-x-1/2 z-[120] w-[min(92vw,560px)]">
                <div className="rounded-xl border border-teal-400/40 bg-black/75 backdrop-blur-md px-5 py-4 shadow-2xl">
                  <h3 className="text-teal-300 font-bold text-base">Real Table Opened</h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Click any empty seat around the table to join. Escrow top-ups and claim unlock after you sit.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setShowLobby(true);
                        setAppState('LOBBY');
                      }}
                    >
                      Back to Lobby
                    </button>
                    {!walletConnected && (
                      <button className="btn bg-purple-700 hover:bg-purple-600" onClick={() => connectWallet('auto')}>
                        Connect Wallet
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Layout: Table on left, Actions + Players on right (wider) - Full screen on mobile */}
            <div className="game-stage flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Left Side: Table (full height, full screen on mobile) */}
              <div className="table-stage flex-1 min-w-0 relative h-full w-full lg:w-auto">
                {/* Floating Ruby Ace Helper - Top Left of Table */}
                <div className="absolute top-0 left-4 z-50 hidden md:block">
                  {/* Ruby Ace Popup */}
                  {showJackPopup && (
                    <>
                      {/* Backdrop overlay - click to close */}
                      <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => setShowJackPopup(false)}
                      />
                      
                      {/* Popup box */}
                      <MovableResizablePanel
                        storageKey="ruby-ace-table-chat"
                        defaultLayout={{ x: 84, y: 140, width: 384, height: 620 }}
                        minWidth={300}
                        minHeight={420}
                        maxWidth={760}
                        maxHeight={820}
                        zIndex={80}
                      >
                        <div className="glass-card border-2 border-teal-400/40 bg-black/90 backdrop-blur-xl shadow-2xl flex flex-col h-full"
                             style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' }}>
                          {/* Corner brackets */}
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-400/60"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-400/60"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-400/60"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-400/60"></div>

                          {/* Header */}
                          <div className="p-4 pb-3 border-b border-teal-400/30">
                            <h3 className="text-xl font-black text-teal-400 text-center tracking-wider"
                                style={{ textShadow: 'none' }}>
                              🤖 Chat with Ruby Ace
                            </h3>
                            <p className="text-xs text-slate-400 text-center mt-1">Your AI Poker Expert</p>
                          </div>

                          {/* Chat Messages */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {jackChatMessages.map((msg, idx) => (
                              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.role === 'user'
                                    ? 'bg-teal-600/30 border border-teal-400/40 text-white'
                                    : 'bg-slate-800/50 border border-slate-700 text-slate-200'
                                }`}>
                                  {msg.role === 'jack' && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-teal-400">Ruby Ace</span>
                                      <span className="text-xs text-slate-500">🤖</span>
                                    </div>
                                  )}
                                  <p className="text-sm leading-relaxed">{msg.text}</p>
                                </div>
                              </div>
                            ))}
                            
                            {/* Typing indicator */}
                            {jackIsTyping && (
                              <div className="flex justify-start">
                                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 max-w-[80%]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-teal-400">Ruby Ace</span>
                                    <span className="text-xs text-slate-500">🤖</span>
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Input Area */}
                          <div className="p-4 border-t border-teal-400/30">
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleJackChat(jackChatInput);
                              }}
                              className="flex gap-2"
                            >
                              <input
                                type="text"
                                value={jackChatInput}
                                onChange={(e) => setJackChatInput(e.target.value)}
                                placeholder="Ask Ruby Ace in your own words..."
                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400/50 transition-colors"
                                disabled={jackIsTyping}
                              />
                              <button
                                type="submit"
                                disabled={!jackChatInput.trim() || jackIsTyping}
                                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-all"
                              >
                                Send
                              </button>
                            </form>
                            <p className="text-[10px] text-slate-500 mt-2 text-center italic">{RUBY_INPUT_HINT} Ask "chat insights" to see what players ask most.</p>
                          </div>
                        </div>
                      </MovableResizablePanel>
                    </>
                  )}

                  {/* Floating Ruby Ace button */}
                  <button
                    onClick={() => {
                      setShowJackPopup(!showJackPopup);
                      playButtonClick();
                    }}
                    className="group relative w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-purple-600 
                              shadow-lg hover:scale-110 transition-all duration-300 border-2 border-teal-400/50
                              hover:shadow-teal-500/50"
                    style={{ 
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  >
                    <img 
                      src="/logo.png" 
                      alt="Ruby Ace Helper" 
                      className="w-full h-full rounded-full object-cover"
                      style={{ filter: '' }}
                    />
                    
                    {/* Tooltip on hover */}
                    <div className="absolute top-full left-0 mt-2 opacity-0 group-hover:opacity-100 
                                   transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                      <div className="bg-black/90 text-teal-400 text-xs font-bold px-3 py-2 rounded-lg border border-teal-400/50"
                           style={{ textShadow: 'none' }}>
                        Chat with Ruby Ace �
                      </div>
                    </div>
                  </button>
                </div>

                {/* Dealer Message - Speech Bubble from Ruby Ace */}
                <DealerMessage 
                  message={gameMessage} 
                  onDismiss={() => setGameMessage('')}
                  autoDismissDelay={5000}
                />

                {/* Hand Strength Indicator - Above Actions */}
                {!showLobby && isSeated && seatNumber >= 1 && (
                  <div className="absolute bottom-40 left-4 z-40">
                    <HandStrength 
                      myCards={myCards}
                      communityCards={communityCards}
                    />
                  </div>
                )}

                {/* Showdown Buttons - Only visible during showdown when it's player's turn */}
                {!showLobby && demoMode && demoGame && (
                  <ShowdownButtons
                    isMyTurn={demoGame.getShowdownState().isMyTurn}
                    awaitingShowdown={demoGame.getShowdownState().awaitingShowdown}
                    currentPlayer={demoGame.getState().players.find((p: any) => 
                      p && p.seat === demoGame.getShowdownState().currentShowdownPlayer
                    )}
                    mustShow={
                      demoGame.getState().players.find((p: any) => p.isMe)?.mustShowCards || false
                    }
                    canMuck={
                      demoGame.getState().players.find((p: any) => p.isMe)?.canMuck || false
                    }
                    onShowCards={() => {
                      console.log('[Showdown] Player choosing to SHOW cards');
                      playCardFlip();
                      demoGame.handleShowCards();
                    }}
                    onMuckCards={() => {
                      console.log('[Showdown] Player choosing to MUCK cards');
                      playFold();
                      demoGame.handleMuckCards();
                    }}
                    waitingForPlayer={
                      !demoGame.getShowdownState().isMyTurn && 
                      demoGame.getShowdownState().awaitingShowdown
                        ? demoGame.getState().players.find((p: any) => 
                            p && p.seat === demoGame.getShowdownState().currentShowdownPlayer
                          )?.name || 'opponent'
                        : undefined
                    }
                  />
                )}

                {/* Compact Action Console - Draggable and resizable with persistent placement */}
                {/* Hide during showdown - ShowdownButtons takes precedence */}
                {!showLobby && isSeated && !(demoMode && demoGame && demoGame.getShowdownState().awaitingShowdown) && (
                  <MovableResizablePanel
                    storageKey="action-console-v2"
                    defaultLayout={{ x: 12, y: 220, width: 200, height: 430 }}
                    minWidth={150}
                    minHeight={300}
                    maxWidth={400}
                    maxHeight={820}
                    zIndex={100}
                    scaleContent={true}
                    baseWidth={200}
                    baseHeight={430}
                    showResizeHandle={false}
                  >
                    <Actions 
                      onAction={handleAction} 
                      onStandUp={handleStandUp}
                      onRebuy={handleRebuy}
                      onShowMuck={handleShowMuck}
                      currentBet={currentBet}
                      playerStack={demoMode ? 
                        (demoGame?.getState().players.find((p: any) => p.isMe)?.stack || 0) : 
                        (players.find((p: any) => p && p.seat === seatNumber)?.stack || 0)
                      }
                      myBet={demoMode ? 
                        (demoGame?.getState().myBet || 0) : 
                        (players.find((p: any) => p && p.seat === seatNumber)?.bet || 0)
                      }
                      isMyTurn={isMyTurn}
                      validActions={(!demoMode && validActions) ? validActions : undefined}
                      bigBlind={gameState?.bigBlind || 10}
                      awaitingShowMuckDecision={demoMode ? 
                        (demoGame?.getState().awaitingShowMuckDecision || false) : 
                        false
                      }
                      autoFold={autoFold}
                      autoCheck={autoCheck}
                      onAutoFoldChange={handleAutoFoldChange}
                      onAutoCheckChange={handleAutoCheckChange}
                      sitOutNextHand={sitOutNextHand}
                      onSitOutToggle={() => {
                        const newSitOutState = !sitOutNextHand;
                        setSitOutNextHand(newSitOutState);
                        setGameMessage(newSitOutState ? '⏸️ Sitting out until unchecked' : 'Sit out cancelled ✅');
                        
                        // Immediately update the game engine
                        if (demoGameRef.current) {
                          const myPlayer = demoGameRef.current.getState().players.find((p: any) => p.isMe);
                          if (myPlayer) {
                            console.log('[Sit Out Toggle] Setting sit out status:', newSitOutState);
                            demoGameRef.current.setSitOutStatus(myPlayer.seat, newSitOutState);
                          }
                        }
                        
                        // Auto-dismiss message after 5 seconds (now handled by DealerMessage component)
                        // The DealerMessage component will automatically dismiss after 5 seconds
                      }}
                      isOverlay={true}
                    />
                  </MovableResizablePanel>
                )}

                {/* Session Stats - Hidden on mobile, visible on desktop */}
                {!showLobby && sessionStatsData && (
                  <div className="hidden md:block absolute top-[10px] right-4 z-[110]" style={{ width: '18rem' }}>
                    <SessionStats 
                      buyIn={sessionStatsData.startingBalance + sessionStatsData.totalChipsAdded}
                      currentStack={players.find((p: any) => p.isMe)?.stack || 0}
                    />
                  </div>
                )}

                {/* Mobile Fullscreen Button - Bottom right */}
                {!showLobby && (
                  <button
                    onClick={() => {
                      setIsMobileFullscreen(!isMobileFullscreen);
                      if (!isMobileFullscreen) {
                        // Enter fullscreen
                        document.documentElement.requestFullscreen?.() ||
                        (document.documentElement as any).webkitRequestFullscreen?.() ||
                        (document.documentElement as any).mozRequestFullScreen?.() ||
                        (document.documentElement as any).msRequestFullscreen?.();
                        
                        // Try to lock to landscape (may not work on all devices)
                        try {
                          (screen.orientation as any)?.lock?.('landscape').catch(() => {});
                        } catch (e) {}
                        
                        setGameMessage('🖥️ Fullscreen - Rotate to landscape!');
                      } else {
                        // Exit fullscreen
                        document.exitFullscreen?.() ||
                        (document as any).webkitExitFullscreen?.() ||
                        (document as any).mozCancelFullScreen?.() ||
                        (document as any).msExitFullscreen?.();
                        
                        setGameMessage('');
                      }
                      setTimeout(() => setGameMessage(''), 3000);
                    }}
                    className="md:hidden fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all"
                    style={{
                      background: isMobileFullscreen 
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))'
                        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))',
                      border: isMobileFullscreen
                        ? '2px solid rgba(239, 68, 68, 0.5)'
                        : '2px solid rgba(59, 130, 246, 0.5)',
                      boxShadow: isMobileFullscreen
                        ? '0 0 20px rgba(239, 68, 68, 0.4)'
                        : '0 0 20px rgba(59, 130, 246, 0.4)'
                    }}
                    title={isMobileFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    <span className="text-xl">{isMobileFullscreen ? '✕' : '🖥️'}</span>
                  </button>
                )}

                {/* Mobile Chat Drawer - Slides in from right */}
                {!showLobby && (
                  <div 
                    className={`md:hidden fixed top-0 right-0 h-full w-[min(100vw,24rem)] z-40 transition-transform duration-300 ${
                      chatDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                    style={{
                      background: 'rgba(15, 23, 42, 0.98)',
                      backdropFilter: 'blur(20px)',
                      borderLeft: '2px solid rgba(16, 185, 129, 0.3)',
                      boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    <div className="h-full flex flex-col p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-emerald-400">💬 Chat</h2>
                        <button
                          onClick={() => setChatDrawerOpen(false)}
                          className="text-2xl text-slate-400 hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <Chat messages={messages} onSendMessage={handleSendMessage} isOverlay={false} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop Chat - Hidden on mobile, visible on desktop */}
                {!showLobby && (
                  <div className="hidden md:block absolute bottom-3 right-3 z-40">
                    <Chat messages={messages} onSendMessage={handleSendMessage} isOverlay={true} />
                  </div>
                )}

                {/* Live Table Stats Banner - Hidden on mobile, visible on desktop, width fits content */}
                {demoMode && isSeated && (
                  <div className="hidden md:block absolute top-[10px] left-1/2 z-50"
                       style={{ transform: 'translate(-60%, 0)' }}>
                    <LiveTableStats
                      stats={{
                        totalWagered: tableStats.totalWagered,
                        handsPlayed: tableStats.handsPlayed,
                        biggestPot: tableStats.biggestPot,
                        averagePot: tableStats.averagePot,
                        tableStartTime: tableStats.tableStartTime,
                        totalPlayers: players.filter(p => p).length
                      }}
                      theme={theme === 'light' ? 'light' : 'dark'}
                      onOpenDetails={() => setShowStatsDetails(true)}
                    />
                  </div>
                )}

                {!showLobby && (
                  <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-50">
                    <div className="px-4 py-1.5 rounded-full border text-xs font-black tracking-wider bg-amber-500/20 border-amber-400/50 text-amber-100">
                      🎰 REAL PVP MAINNET
                    </div>
                  </div>
                )}

                {!showLobby && betweenHandsSeconds > 0 && (
                  <div className="absolute top-[48px] left-1/2 -translate-x-1/2 z-50">
                    <div className="px-4 py-2 rounded-full border text-xs font-semibold tracking-wide bg-cyan-900/60 border-teal-400/60 text-cyan-100 backdrop-blur-sm">
                      Next hand in {betweenHandsSeconds}s. Leave now to cash out.
                    </div>
                  </div>
                )}
                
                <RealisticTable
                  players={players}
                  communityCards={communityCards}
                  pot={pot}
                  sidePots={demoMode && demoGame ? demoGame.getState().sidePots : []}
                  currentPlayer={currentPlayer}
                  mySeat={seatNumber}
                  myCards={myCards}
                  opponentCards={demoMode && demoGame ? demoGame.getState().opponentCards : []}
                  showOpponentCards={demoMode && demoGame ? demoGame.getState().showOpponentCards : false}
                  playerAlias={resolvedPlayerIdentity}
                  myAvatar={avatarCategories[avatarCategory]?.[avatarIndex] || '🎮'}
                  theme={theme}
                  revealedCards={revealedCards}
                  timerState={timerState}
                  onRequestTimeBank={handleRequestTimeBank}
                  onSitAtSeat={handleSitAtSeat}
                  maxPlayers={6}
                  playerStreaks={playerStreaks}
                />
                
                {/* Flying card animations */}
                {flyingCards.map(card => (
                  <FlyingCard
                    key={card.id}
                    card={card.card}
                    startX={card.startX}
                    startY={card.startY}
                    endX={card.endX}
                    endY={card.endY}
                    delay={card.delay}
                    rank={card.rank}
                    onComplete={() => {
                      setFlyingCards(prev => prev.filter(c => c.id !== card.id));
                    }}
                  />
                ))}
              </div>

              {/* Panel Collapse/Expand Button - Positioned outside table on right edge */}
              <button
                onClick={() => setSidePanelCollapsed(!sidePanelCollapsed)}
                className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-50 w-10 h-16 rounded-lg bg-slate-800/90 backdrop-blur-sm border-2 border-amber-500/50 hover:border-amber-400 hover:bg-slate-700/90 transition-all items-center justify-center text-amber-400 hover:text-amber-300 shadow-lg hover:scale-110"
                title={sidePanelCollapsed ? "Expand panels" : "Collapse panels (fullscreen table)"}
                style={{
                  right: sidePanelCollapsed ? '1rem' : '21rem',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.3), inset 0 0 10px rgba(245, 158, 11, 0.1)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sidePanelCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  )}
                </svg>
              </button>
              
              {/* Right Side: Game Log (top) + Players List + Recent Winners (stacked) - Hidden on mobile */}
              <div className={`side-panels hidden md:flex relative flex-col gap-3 transition-all duration-300 h-full ${sidePanelCollapsed ? 'w-0 opacity-0' : 'w-[var(--side-panel-width)] min-w-[15.5rem] max-w-[22rem] opacity-100'}`}>
                {!sidePanelCollapsed && (
                  <>
                    {/* Game Log Panel - matches table height */}
                    <div className="flex-1 overflow-hidden min-h-0">
                      <GameLog gameLog={gameLog} />
                    </div>
                    
                    {/* Players List - matches table height */}
                    <div className="flex-1 overflow-hidden min-h-0">
                      <PlayersList 
                        players={players} 
                        walletAddress={walletAddress}
                      />
                    </div>

                    {/* Recent Winners Panel - matches table height */}
                    <div className="flex-1 overflow-hidden min-h-0">
                      <WinningHandsPanel recentHands={recentWinningHands} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Epic Winner Popup with Cards */}
            {showWinnerPopup && winnerPopupData && (
              <WinnerPopup
                winner={winnerPopupData.winner}
                amount={winnerPopupData.amount}
                winningHand={winnerPopupData.winningHand}
                winnerCards={winnerPopupData.winnerCards}
                secondPlace={winnerPopupData.secondPlace}
                onClose={() => setShowWinnerPopup(false)}
              />
            )}

            {/* 🎰 Chip Slide Animation - Pot to Winner(s) */}
            {chipSlideWinners.length > 0 && (
              <MultiChipSlide
                winners={chipSlideWinners}
                potPosition={{ x: window.innerWidth / 2, y: window.innerHeight / 2 }}
                onAllComplete={() => console.log('[Chip Animation] All chips delivered!')}
              />
            )}

          </>
        )}
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowDepositModal(false)}>
          <div className="glass-card p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-brand-primary mb-4">💰 Deposit wSHIDO</h3>
            <p className="text-sm text-brand-text-dark mb-4">
              Available Balance: {balance.toLocaleString()} wSHIDO
            </p>
            {!isSeated && (
              <p className="text-xs text-amber-300 mb-3">
                Join a seat first. Escrow top-ups apply to your active table seat.
              </p>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount to Deposit</label>
              <input 
                type="number" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                step="1000"
                min={rebuyPromptActive ? minimumTopUpAmount : 1000}
                max={balance}
                className="w-full bg-brand-surface border border-brand-primary/30 rounded px-4 py-2 text-white focus:outline-none focus:border-brand-primary"
                placeholder="Enter amount"
              />
              {rebuyPromptActive && (
                <p className="text-xs text-amber-300 mt-2">
                  Minimum to keep your seat: {minimumTopUpAmount.toLocaleString()} wSHIDO.
                </p>
              )}
            </div>
            {depositModalMessage && (
              <div className="mb-3 rounded border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs text-teal-200">
                {depositModalMessage}
              </div>
            )}
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" onClick={handleDeposit} disabled={depositInFlight}>
                {depositInFlight ? 'Processing...' : `Deposit ${depositAmount.toLocaleString()} wSHIDO`}
              </button>
              <button
                className="btn bg-gray-600 hover:bg-gray-700"
                onClick={() => {
                  setShowDepositModal(false);
                  if (rebuyPromptActive) {
                    setShowRebuyPopup(true);
                  }
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowWithdrawModal(false)}>
          <div className="glass-card p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-brand-primary mb-4">💸 Claim wSHIDO</h3>
            <p className="text-sm text-brand-text-dark mb-4">
              Mainnet mode claims your full seated escrow balance and leaves the table.
            </p>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" onClick={handleWithdraw}>
                Claim and Leave Table
              </button>
              <button className="btn bg-gray-600 hover:bg-gray-700" onClick={() => setShowWithdrawModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Alias Modal */}
      {showAliasModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative p-6 max-w-md w-full mx-4 rounded-xl transition-all duration-500"
               style={{
                 background: 'rgba(21, 25, 33, 0.96)',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(255, 255, 255, 0.08)',
                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
               }}>

            <h3 className="text-2xl font-bold text-teal-300 mb-2 relative z-10">Choose Your Alias</h3>
            <p className="text-sm text-gray-400 mb-4 relative z-10">
              This name is for this session only
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-brand-gold">Player Name</label>
              <input 
                type="text" 
                value={playerAlias} 
                onChange={(e) => setPlayerAlias(e.target.value)}
                maxLength={20}
                className="w-full bg-brand-surface border border-brand-cyan/30 rounded px-4 py-2 text-white focus:outline-none focus:border-brand-cyan"
                placeholder="Enter your poker name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerAlias.trim()) {
                    confirmSitDown();
                  }
                }}
              />
              <p className="text-xs text-brand-text-dark mt-1">
                Max 20 characters
              </p>
            </div>
            
            {/* Avatar Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-brand-gold">Choose Style</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {Object.keys(avatarCategories).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setAvatarCategory(category);
                      setAvatarIndex(0);
                    }}
                    className={`relative px-3 py-2 text-xs font-black tracking-widest uppercase transition-all duration-200 rounded ${
                      avatarCategory === category 
                        ? 'text-amber-400' 
                        : 'text-slate-400 hover:text-amber-400/70 opacity-60 hover:opacity-80'
                    }`}
                    style={avatarCategory === category ? {
                      background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))',
                      border: '1px solid rgba(251, 191, 36, 0.5)',
                      boxShadow: '0 0 10px rgba(251, 191, 36, 0.4), inset 0 0 10px rgba(251, 191, 36, 0.1)',
                      filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))'
                    } : {
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(71, 85, 105, 0.3)'
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <label className="block text-sm font-medium mb-2 text-brand-gold">Choose Avatar</label>
              <div className="grid grid-cols-3 gap-2">
                {avatars.map((avatar, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAvatarIndex(idx)}
                    className="relative p-4 text-4xl transition-all duration-200 rounded hover:scale-105"
                    style={avatarIndex === idx ? {
                      background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(14, 165, 233, 0.15))',
                      border: '2px solid rgba(20, 184, 166, 0.6)',
                      boxShadow: '0 0 15px rgba(20, 184, 166, 0.5), inset 0 0 15px rgba(20, 184, 166, 0.1)',
                      filter: 'drop-shadow(0 0 10px rgba(20, 184, 166, 0.7))'
                    } : {
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '2px solid rgba(71, 85, 105, 0.3)'
                    }}
                  >
                    {avatar.startsWith('IMG:') ? (
                      <img 
                        src={`/avatars/${avatar.replace('IMG:', '')}.png`} 
                        alt="avatar" 
                        className="w-12 h-12 object-contain mx-auto"
                      />
                    ) : (
                      avatar
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-primary flex-1" 
                onClick={() => confirmSitDown()}
                disabled={!playerAlias.trim()}
              >
                SIT DOWN 🪑
              </button>
              <button 
                className="btn bg-gray-600 hover:bg-gray-700" 
                onClick={() => {
                  setShowAliasModal(false);
                  setPlayerAlias('');
                  setSeatNumber(0);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provably Fair Modal */}
      {showFairnessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowFairnessModal(false)}>
          <div className="glass-card p-6 max-w-6xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-brand-cyan">🔒 Provably Fair Gaming & Recent Winners</h3>
              <button 
                onClick={() => setShowFairnessModal(false)}
                className="text-2xl text-brand-text hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* Side-by-side layout: Fairness (50%) | Winning Hands (50%) */}
            <div className="flex gap-4 flex-1 min-h-0">
              <div className="w-1/2">
                <FairnessPane />
              </div>
              <div className="w-1/2">
                <WinningHandsPanel recentHands={recentWinningHands} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard 
          onClose={() => setShowLeaderboard(false)}
          currentPlayerStats={playerStats}
        />
      )}

      {/* Table Stats Details Modal */}
      {showStatsDetails && (
        <TableStatsDetailsModal
          stats={tableStats}
          theme={theme === 'light' ? 'light' : 'dark'}
          onClose={() => setShowStatsDetails(false)}
        />
      )}

      {/* Session Stats Modal */}
      {showSessionStatsModal && (
        <SessionStatsModal
          stats={sessionStatsData}
          onClose={() => setShowSessionStatsModal(false)}
          onReset={() => {
            setSessionStatsData(null);
            if (playerAlias) {
              // Reset with actual buy-in amount
              const newStats = initializeStats(playerAlias, 0);
              setSessionStatsData(newStats);
              saveStats(newStats);
            }
          }}
        />
      )}

      {/* Banking Modal - Real mainnet banking */}
      <BankingModal
        isOpen={showBankingModal}
        onClose={() => setShowBankingModal(false)}
        balance={balance}
        tableStack={players.find((p: any) => p && p.seat === seatNumber)?.stack || 0}
        canClaimFromTable={walletConnected && walletOnShido && isSeated}
        onClaimFromTable={() => {
          setShowBankingModal(false);
          setShowWithdrawModal(true);
        }}
        canDepositToTable={walletConnected && walletOnShido && isSeated}
        onDepositToTable={() => {
          setShowBankingModal(false);
          setDepositModalMessage('');
          setShowDepositModal(true);
        }}
        claimHint={walletConnected && walletOnShido
          ? (isSeated ? 'Claims your seated escrow and exits your seat.' : 'Sit at a table seat to enable claim.')
          : 'Connect your wallet on Shido 9008 to manage escrow.'}
        depositHint={walletConnected && walletOnShido
          ? (isSeated ? 'Top up your active seated table holdings.' : 'Sit at a table seat to enable table holdings top-up.')
          : 'Connect your wallet on Shido 9008 to top up table holdings.'}
        theme={theme}
      />

      {/* Error Modal - Professional Error Handling */}
      <ErrorModal
        error={error}
        onRecover={() => {
          clearError();
          // Attempt to recover game state if needed
        }}
        onRestart={() => {
          clearError();
          window.location.reload();
        }}
        onDismiss={clearError}
      />

      {/* Loading Overlay - Professional Loading State */}
      {isInitializing && <LoadingOverlay message="Initializing game..." />}

      {/* Victory Animation - EPIC Fortnite-style effects for premium hands */}
      {showVictoryAnimation && victoryAnimationType && (
        <VictoryAnimation
          handType={victoryAnimationType}
          winner={victoryWinner}
          potSize={victoryPot}
          onComplete={() => {
            setShowVictoryAnimation(false);
            setVictoryAnimationType(null);
          }}
        />
      )}

      {/* Dev Panel - Shift+D to test animations */}
      <DevPanel
        isVisible={showDevPanel}
        onClose={() => setShowDevPanel(false)}
        onTestVictory={testVictoryAnimation}
      />

      {/* Members Dashboard Modal */}
      {showMembersDashboard && walletAddress && (
        <MembersDashboard 
          walletAddress={walletAddress}
          onClose={() => setShowMembersDashboard(false)}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      )}
    </div>
  );
}

export default App;
