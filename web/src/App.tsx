import './index.css';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ethers } from 'ethers';
import SplashScreen from './components/SplashScreen.tsx';
import LoginScreen from './components/LoginScreen.tsx';
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
import { HelpButton } from './components/HelpModal.tsx';
import SoundSettingsPanel from './components/SoundSettingsPanel.tsx';
import ErrorModal, { useErrorHandler } from './components/ErrorModal.tsx';
import { LoadingOverlay } from './components/LoadingStates.tsx';
import { useKeyboardShortcuts, POKER_SHORTCUTS } from './utils/keyboardShortcuts';
import SessionStatsModal from './components/SessionStatsModal.tsx';
import { SessionStats as SessionStatsType, initializeStats, loadStats, saveStats, updateStatsAfterHand, updateStatsAfterAction } from './utils/sessionStats';

// Helper function to convert card numbers to display
const cardToString = (cardNum: number): { suit: string, rank: string, color: string } => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const suit = suits[Math.floor(cardNum / 13)];
  const rank = ranks[cardNum % 13];
  const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
  
  return { suit, rank, color };
};

function App() {
  // 🎮 APP STATE - Login Flow
  const [appState, setAppState] = useState<'SPLASH' | 'LOGIN' | 'LOBBY' | 'GAME'>('SPLASH');
  
  const [betAmount, setBetAmount] = useState(10000);
  const [balance, setBalance] = useState(1000000); // 1M SHIDO starting balance
  const [pot, setPot] = useState(0);
  const [gameMessage, setGameMessage] = useState('');
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null); // Track when user last claimed chips
  
  // Wallet & Connection State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
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
  const [depositAmount, setDepositAmount] = useState(100000);
  const [withdrawAmount, setWithdrawAmount] = useState(50000);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showFairnessModal, setShowFairnessModal] = useState(false);
  
  // Socket and Game State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [communityCards, setCommunityCards] = useState<number[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<number>(-1);
  const [showLobby, setShowLobby] = useState(true);
  const [messages, setMessages] = useState<{ user: string, text: string }[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [myCards, setMyCards] = useState<number[]>([]);
  const [gameLog, setGameLog] = useState<{ action: string, player: string, timestamp: string, type?: string }[]>([]);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [theme, setTheme] = useState<'dark' | 'classic' | 'light' | 'executive'>('executive');
  const [revealedCards, setRevealedCards] = useState<number>(0); // How many community cards are revealed
  const [totalRakeCollected, setTotalRakeCollected] = useState<number>(0); // House rake
  const [opponentCards, setOpponentCards] = useState<number[]>([]); // Opponent cards for showdown
  const [showOpponentCards, setShowOpponentCards] = useState<boolean>(false); // Show at showdown
  const [autoFold, setAutoFold] = useState<boolean>(false); // Auto-fold when facing any bet
  const [autoCheck, setAutoCheck] = useState<boolean>(false); // Auto-check when no bet (won't call)
  const [recentWinningHands, setRecentWinningHands] = useState<Array<{
    handNumber: number;
    winner: string;
    handType: string;
    potSize: number;
    timestamp: number;
  }>>([]);
  
  // Timer state
  const [timerState, setTimerState] = useState<any>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [hexagonsActive, setHexagonsActive] = useState<boolean>(false); // Animate hexagons when timer active
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState<boolean>(false); // Collapse right side panel
  
  // Professional features
  const { error, handleError, clearError } = useErrorHandler();
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Sound control state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [soundVolume, setSoundVolume] = useState<number>(0.3); // 30% default
  const [showSoundSettings, setShowSoundSettings] = useState<boolean>(false);

  // Session stats - track buy-in amount
  const [sessionBuyIn, setSessionBuyIn] = useState<number>(0);

  // Session stats tracking
  const [sessionStatsData, setSessionStatsData] = useState<SessionStatsType | null>(null);

  // Pending rebuy - chips queued to be added at start of next hand
  const [pendingRebuy, setPendingRebuy] = useState<number>(0);
  const [showSessionStatsModal, setShowSessionStatsModal] = useState<boolean>(false);

  // Player count selection (2-6 players: 1 human + 1-5 AI)
  const [playerCount, setPlayerCount] = useState<number>(4); // Default: 4 players (1 human + 3 AI)

  // Win popup state
  const [winPopups, setWinPopups] = useState<{seat: number, amount: number}[]>([]);

  // DAVE helper popup
  const [showDavePopup, setShowDavePopup] = useState<boolean>(false);

  // Refs for auto-actions (to avoid stale closure in timer interval)
  const autoFoldRef = useRef<boolean>(false);
  const autoCheckRef = useRef<boolean>(false);
  
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

  // Table identifier (based on blinds)
  const [currentTableId, setCurrentTableId] = useState<string>('demo-table');
  
  // Load table stats from localStorage (persistent all-time stats)
  const loadTableStats = (tableId: string) => {
    const savedStats = localStorage.getItem(`poker-table-stats-${tableId}`);
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

  // Save table stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`poker-table-stats-${currentTableId}`, JSON.stringify(tableStats));
  }, [tableStats, currentTableId]);

  // Save balance to localStorage whenever it changes
  useEffect(() => {
    if (playerAlias && balance !== 1000000) { // Only save if not initial value
      localStorage.setItem(`poker_balance_${playerAlias}`, balance.toString());
    }
  }, [balance, playerAlias]);

  // Auto-action wrappers with logging
  const handleAutoFoldChange = (value: boolean) => {
    console.log('[Auto-Actions] Auto-Fold toggled:', value);
    setAutoFold(value);
    autoFoldRef.current = value;
  };

  const handleAutoCheckChange = (value: boolean) => {
    console.log('[Auto-Actions] Auto-Check toggled:', value);
    setAutoCheck(value);
    autoCheckRef.current = value;
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
        setPot(prev => prev + 5000);
        addGameLog('You call 5,000', 'You', 'call');
        break;
      case 'raise':
        actionType = 'RAISE';
        playRaise();
        setGameMessage(`You raised ${amount?.toLocaleString() || 0} SHIDO 🚀`);
        setPot(prev => prev + (amount || 0));
        setCurrentBet(amount || 0);
        addGameLog(`You raise to ${amount?.toLocaleString() || 0}`, 'You', 'raise');
        break;
      case 'allin':
        actionType = 'ALL_IN';
        playRaise();
        setGameMessage('ALL IN! 🔥🔥🔥');
        setPot(prev => prev + balance);
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
        p.seat === player.seat ? { ...p, folded: true } : p
      ));
    } else if (action === 'raise') {
      const raiseAmount = currentBet > 0 ? currentBet * 2 : 10000;
      setGameMessage(`Player at seat ${player.seat} raised to ${raiseAmount.toLocaleString()} SHIDO`);
      setPot(prev => prev + raiseAmount);
      setCurrentBet(raiseAmount);
      addGameLog(`Player_${player.seat} raises to ${raiseAmount.toLocaleString()}`, `Player_${player.seat}`, 'raise');
    } else if (action === 'call') {
      setGameMessage(`Player at seat ${player.seat} called ${currentBet.toLocaleString()}`);
      setPot(prev => prev + currentBet);
      addGameLog(`Player_${player.seat} calls ${currentBet.toLocaleString()}`, `Player_${player.seat}`, 'call');
    } else if (action === 'bet') {
      const betAmount = 10000;
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

  // Socket connection - DISABLED (server not running)
  // TODO: Enable socket connection when backend server is ready
  /*
  useEffect(() => {
    console.log('useEffect triggered:', { walletConnected, socket: !!socket });
    if (walletConnected && !socket) {
      console.log('Creating new socket connection...');
      const newSocket = io('http://localhost:3001');
      setSocket(newSocket);

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully! ID:', newSocket.id);
        console.log('Emitting join-game event:', { walletAddress, balance });
        newSocket.emit('join-game', {
          walletAddress,
          balance
        });
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('❌ Socket connection error:', error);
        setGameMessage('Connection failed! Check if server is running.');
      });

      newSocket.on('disconnect', (reason: any) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      newSocket.on('game-state', (state: any) => {
        console.log('Game state update:', state);
        setGameState(state);
        setPlayers(state.players || []);
        setCommunityCards(state.communityCards || []);
        setCurrentPlayer(state.currentPlayer || -1);
        setPot(state.pot || 0);
      });

      newSocket.on('player-joined', (data: any) => {
        setGameMessage(`Player ${data.playerId} joined! 👋`);
      });

      newSocket.on('player-sat', (data: any) => {
        console.log('Player sat event:', data);
        if (data.playerId === newSocket.id) {
          setIsSeated(true);
          setSeatNumber(data.seat);
          setGameMessage(`You sat at seat ${data.seat}! 🪑`);
          setShowLobby(false);
        }
      });

      newSocket.on('chat-message', (data: any) => {
        setMessages(prev => [...prev, { user: `Player ${data.from.slice(0, 4)}`, text: data.message }]);
      });

      newSocket.on('error', (error: any) => {
        console.error('Socket error:', error);
        
        // Handle wallet IP limit error specially
        if (error.code === 'WALLET_IP_LIMIT') {
          setGameMessage(`⛔ ${error.message}`);
          // Optionally disconnect
          newSocket.disconnect();
          setSocket(null);
        } else {
          setGameMessage(`Error: ${error.message} ❌`);
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [walletConnected, socket, walletAddress, balance]);
  */

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

  // Contract Configuration
  const TABLE_ESCROW_ADDRESS = '0x...'; // TODO: Add deployed TableEscrow contract address
  const TABLE_ESCROW_ABI = [
    "function sitDown(uint8 seat, uint256 amount) external payable",
    "function topUp(uint256 amount) external payable",
    "function standUp() external",
    "function seats(uint8 seat) external view returns (address player, uint256 stack, bool inHand)",
    "function minBuyIn() external view returns (uint256)",
    "function maxBuyIn() external view returns (uint256)"
  ];

  const fetchShidoBalance = async (provider: ethers.BrowserProvider, address: string) => {
    try {
      // Get native SHIDO balance
      const balance = await provider.getBalance(address);
      
      // Convert from wei to SHIDO (18 decimals)
      const formattedBalance = ethers.formatEther(balance);
      const balanceNumber = Math.floor(parseFloat(formattedBalance));
      
      setBalance(balanceNumber);
      console.log(`Native SHIDO Balance: ${balanceNumber} SHIDO`);
      
      if (balanceNumber === 0) {
        setGameMessage('No SHIDO found! You need native SHIDO to play 🪙');
      }
      
    } catch (error) {
      console.error('Error fetching SHIDO balance:', error);
      setBalance(0);
      setGameMessage('Could not fetch SHIDO balance. Check network connection 🔗');
    }
  };

  // Wallet Functions
  const connectWallet = async () => {
    console.log('connectWallet called');
    try {
      if (typeof (window as any).ethereum !== 'undefined') {
        console.log('MetaMask detected, connecting...');
        
        // Request account access
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create ethers provider and signer
        const web3Provider = new ethers.BrowserProvider((window as any).ethereum);
        const web3Signer = await web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        const network = await web3Provider.getNetwork();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setWalletAddress(address);
        setChainId(Number(network.chainId));
        setWalletConnected(true);
        
        // Check if on Shido Network
        if (Number(network.chainId) !== SHIDO_CHAIN_ID) {
          setGameMessage(`⚠️ Please switch to Shido Network (Chain ID: ${SHIDO_CHAIN_ID})`);
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: SHIDO_NETWORK.chainId }],
            });
          } catch (switchError: any) {
            // Chain doesn't exist, add it
            if (switchError.code === 4902) {
              try {
                await (window as any).ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [SHIDO_NETWORK],
                });
              } catch (addError) {
                setGameMessage('Failed to add Shido Network ❌');
                return;
              }
            }
          }
        }
        
        // Get native SHIDO balance
        await fetchShidoBalance(web3Provider, address);
        
        setWalletConnected(true);
        setGameMessage(`Connected to ${address.slice(0,6)}...${address.slice(-4)} on Shido Network 🔗`);
        
        // Listen for account changes
        (window as any).ethereum.on('accountsChanged', async (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnectWallet();
          } else {
            // Wallet switched - reconnect with new account
            setWalletAddress(accounts[0]);
            await fetchShidoBalance(web3Provider, accounts[0]);
            
            // Reset game state for new wallet
            setIsSeated(false);
            setSeatNumber(0);
            setShowLobby(true);
            
            // Reconnect socket with new wallet
            if (socket) {
              socket.disconnect();
              setSocket(null);
            }
            
            setGameMessage(`Switched to ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)} 🔄`);
            setTimeout(() => setGameMessage(''), 3000);
          }
        });
        
        // Listen for chain changes
        (window as any).ethereum.on('chainChanged', async (chainId: string) => {
          const newChainId = parseInt(chainId, 16);
          setChainId(newChainId);
          
          if (newChainId === SHIDO_CHAIN_ID) {
            setGameMessage('✅ Switched to Shido Network 🔄');
            await fetchShidoBalance(web3Provider, address);
          } else {
            setGameMessage(`⚠️ Wrong network! Please switch to Shido Network (${SHIDO_CHAIN_ID}) 🔄`);
          }
        });
        
      } else {
        setGameMessage('Please install MetaMask to play! 🦊');
        window.open('https://metamask.io/download/', '_blank');
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        setGameMessage('Connection rejected by user ❌');
      } else {
        setGameMessage('Failed to connect wallet ❌');
      }
    }
  };

  const disconnectWallet = () => {
    // Disconnect socket if connected
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setWalletConnected(false);
    setWalletAddress('');
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsSeated(false);
    setSeatNumber(0);
    setBalance(0);
    setShowLobby(true);
    setGameMessage('Wallet disconnected. You can now connect a different wallet. 👋');
    
    // Remove event listeners
    if ((window as any).ethereum) {
      (window as any).ethereum.removeAllListeners('accountsChanged');
      (window as any).ethereum.removeAllListeners('chainChanged');
    }
    
    setTimeout(() => setGameMessage(''), 3000);
  };

  // Deposit/Withdraw Functions
  const handleDeposit = async () => {
    if (!signer || !provider) {
      setGameMessage('Please connect your wallet first! 🦊');
      return;
    }

    try {
      setGameMessage('Preparing deposit transaction...');
      
      // Check if user has enough balance
      const walletBalance = await provider.getBalance(walletAddress);
      const depositAmountWei = ethers.parseEther(depositAmount.toString());
      
      if (walletBalance < depositAmountWei) {
        setGameMessage('Insufficient balance in wallet! ❌');
        return;
      }

      // If TableEscrow address is not set, just update local balance for testing
      if (TABLE_ESCROW_ADDRESS === '0x...') {
        setGameMessage('⚠️ Contract not deployed yet. Adding funds locally for testing...');
        setBalance(prev => prev + depositAmount);
        setShowDepositModal(false);
        setTimeout(() => setGameMessage(''), 3000);
        return;
      }

      // Real contract interaction
      const tableEscrow = new ethers.Contract(TABLE_ESCROW_ADDRESS, TABLE_ESCROW_ABI, signer);
      
      setGameMessage('Please confirm the transaction in MetaMask...');
      const tx = await tableEscrow.topUp(depositAmountWei, { value: depositAmountWei });
      
      setGameMessage('Transaction submitted! Waiting for confirmation...');
      await tx.wait();
      
      setBalance(prev => prev + depositAmount);
      setShowDepositModal(false);
      setGameMessage(`✅ Deposited ${depositAmount.toLocaleString()} SHIDO!`);
      setTimeout(() => setGameMessage(''), 5000);
      
    } catch (error: any) {
      console.error('Deposit error:', error);
      if (error.code === 4001) {
        setGameMessage('Transaction rejected by user ❌');
      } else {
        setGameMessage(`Deposit failed: ${error.message || 'Unknown error'} ❌`);
      }
      setTimeout(() => setGameMessage(''), 5000);
    }
  };

  // Rebuy/Add Chips function for busted players
  const handleRebuy = (amount: number = 100000) => {
    if (demoMode) {
      // Check if player has enough in their total balance
      if (balance < amount) {
        if (balance === 0 && lastClaimTime) {
          // Show cooldown message
          const now = Date.now();
          const timeSinceLastClaim = now - lastClaimTime;
          const hoursRemaining = Math.max(0, 24 - Math.floor(timeSinceLastClaim / 1000 / 60 / 60));
          const minutesRemaining = Math.max(0, Math.floor((86400000 - timeSinceLastClaim) / 1000 / 60) % 60);
          
          if (hoursRemaining === 0 && minutesRemaining === 0) {
            // Can claim now! Give them the bonus
            setBalance(1000000);
            setLastClaimTime(now);
            localStorage.setItem(`poker_balance_${playerAlias}`, '1000000');
            localStorage.setItem(`poker_claim_time_${playerAlias}`, now.toString());
            setGameMessage('🎁 Daily bonus claimed! 1,000,000 CHIPS added to your bankroll!');
            setTimeout(() => setGameMessage(''), 5000);
            return;
          }
          
          setGameMessage(`⏳ Out of chips! Come back in ${hoursRemaining}h ${minutesRemaining}m for your daily 1,000,000 CHIPS bonus.`);
        } else {
          setGameMessage(`❌ Insufficient balance! You need ${amount.toLocaleString()} CHIPS but only have ${balance.toLocaleString()} CHIPS`);
        }
        setTimeout(() => setGameMessage(''), 5000);
        return;
      }
      
      // Deduct from total balance (the 1M bankroll)
      setBalance(prev => prev - amount);
      
      // If there's an active demo game, queue chips for next hand
      if (demoGame && demoGameRef.current) {
        const currentState = demoGameRef.current.getState();
        const myPlayer = currentState.players.find((p: any) => p.isMe);
        
        if (myPlayer) {
          // Check if player is busted (0 chips)
          const wasBusted = myPlayer.stack === 0;
          
          // Check if hand is currently in progress (community cards dealt or betting happening)
          const handInProgress = currentState.communityCards.length > 0 || 
                                 currentState.street !== 'preflop' ||
                                 currentState.players.some((p: any) => p.bet > 0);
          
          if (wasBusted) {
            // Player is busted - add chips immediately and start new hand
            demoGameRef.current.addChips(myPlayer.seat, amount);
            setGameMessage(`💰 Added ${amount.toLocaleString()} CHIPS! Starting new hand... (${balance - amount} CHIPS remaining in bankroll)`);
            
            setTimeout(() => {
              if (demoGameRef.current) {
                demoGameRef.current.startNewHand();
                setGameMessage('🃏 New hand started! Good luck! 🍀');
              }
            }, 1500);
          } else if (handInProgress) {
            // Hand is in progress - queue chips for next hand
            setPendingRebuy(prev => prev + amount);
            setGameMessage(`⏳ ${amount.toLocaleString()} CHIPS queued! Will be added at start of next hand. (${balance - amount} CHIPS remaining in bankroll)`);
          } else {
            // No hand in progress - add chips immediately
            demoGameRef.current.addChips(myPlayer.seat, amount);
            setPendingRebuy(0); // Clear any pending
            setGameMessage(`💰 Added ${amount.toLocaleString()} CHIPS to your table stack! (${balance - amount} CHIPS remaining in bankroll)`);
          }
        }
      }
      
      setTimeout(() => setGameMessage(''), 3000);
      return;
    }
    
    // For non-demo mode, trigger the deposit modal
    setDepositAmount(amount);
    setShowDepositModal(true);
  };

  const handleShowMuck = (showCards: boolean) => {
    if (demoMode && demoGameRef.current) {
      console.log('[ShowMuck] Player chose to', showCards ? 'SHOW' : 'MUCK', 'cards');
      demoGameRef.current.handleShowMuckDecision(showCards);
    }
  };

  const handleWithdraw = () => {
    if (withdrawAmount > balance) {
      setGameMessage('Insufficient balance! ❌');
      return;
    }
    setBalance(prev => prev - withdrawAmount);
    setShowWithdrawModal(false);
    setGameMessage(`Withdrew ${withdrawAmount.toLocaleString()} SHIDO! 💸`);
  };

  // Table Functions
  const sitDown = (seat: number) => {
    console.log('Attempting to sit at seat:', seat);
    console.log('Wallet connected:', walletConnected);
    console.log('Socket connected:', !!socket);
    console.log('Balance:', balance);
    
    if (!walletConnected || !socket) {
      setGameMessage('Connect wallet first! 🔗');
      return;
    }
    if (balance < 50000) {
      setGameMessage('Need at least 50,000 SHIDO to sit! 💰');
      return;
    }
    
    console.log('Emitting sit-down event for seat:', seat);
    socket.emit('sit-down', { seat });
    setGameMessage(`Attempting to sit at seat ${seat}...`);
  };

  const handleSitDown = (tableId: string, seat: number) => {
    console.log('handleSitDown called with:', { tableId, seat, playerAlias });
    
    // Player already logged in via login screen, so just sit them down directly
    if (!playerAlias.trim()) {
      setGameMessage('Please enter your name first! ✏️');
      return;
    }
    
    // Check if player has enough balance (need at least 100K for buy-in)
    const buyInAmount = 100000;
    if (balance < buyInAmount) {
      if (balance === 0 && lastClaimTime) {
        // Show cooldown message
        const now = Date.now();
        const timeSinceLastClaim = now - lastClaimTime;
        const hoursRemaining = Math.max(0, 24 - Math.floor(timeSinceLastClaim / 1000 / 60 / 60));
        const minutesRemaining = Math.max(0, Math.floor((86400000 - timeSinceLastClaim) / 1000 / 60) % 60);
        
        if (hoursRemaining === 0 && minutesRemaining === 0) {
          // Can claim now!
          setBalance(1000000);
          setLastClaimTime(now);
          localStorage.setItem(`poker_balance_${playerAlias}`, '1000000');
          localStorage.setItem(`poker_claim_time_${playerAlias}`, now.toString());
          setGameMessage('🎁 Daily bonus claimed! 1,000,000 CHIPS added! You can now sit down.');
          setTimeout(() => setGameMessage(''), 5000);
          return;
        }
        
        setGameMessage(`⏳ Out of chips! Come back in ${hoursRemaining}h ${minutesRemaining}m for your daily 1,000,000 CHIPS bonus.`);
      } else {
        setGameMessage(`❌ Insufficient balance! You need ${buyInAmount.toLocaleString()} CHIPS but only have ${balance.toLocaleString()} CHIPS`);
      }
      setTimeout(() => setGameMessage(''), 5000);
      return;
    }
    
    // Sit down immediately with the selected seat
    confirmSitDown(seat);
  };

  const confirmSitDown = (seat?: number) => {
    if (!playerAlias.trim()) {
      setGameMessage('Please enter a name! ✏️');
      return;
    }
    
    const displayName = playerAlias.trim();
    const actualSeat = seat !== undefined ? seat : seatNumber;
    
    console.log('confirmSitDown - seatNumber:', actualSeat);
    console.log('confirmSitDown - displayName:', displayName);
    console.log('confirmSitDown - walletAddress:', walletAddress);
    console.log('confirmSitDown - before players:', players);
    
    // Create new player object with the selected avatar from current category
    const selectedAvatar = avatarCategories[avatarCategory][avatarIndex];
    const newPlayer = {
      name: displayName,
      chips: balance,
      stack: balance,
      bet: 0,
      seat: actualSeat,
      avatarIndex: avatarIndex,
      avatarCategory: avatarCategory,
      avatar: selectedAvatar,
      walletAddress: walletAddress,
      address: walletAddress,
      isActive: false
    };
    
    // Update players array - either add or replace existing player
    const newPlayers = players.filter(p => p && p.seat !== actualSeat);
    newPlayers.push(newPlayer);
    
    console.log('confirmSitDown - newPlayer:', newPlayer);
    console.log('confirmSitDown - after players:', newPlayers);
    
    setPlayers(newPlayers);
    setIsSeated(true);
    setSeatNumber(actualSeat); // Update seat number state
    
    // For now, allow joining even without socket connection for testing
    if (socket) {
      console.log(`Emitting sit-down event for seat: ${actualSeat}`);
      socket.emit('sit-down', { seat: actualSeat, alias: playerAlias, avatarIndex: avatarIndex });
    } else {
      console.log('No socket connection, joining table locally for testing');
    }
    
    setShowLobby(false); // Move to table view
    setAppState('GAME'); // Update app state to show game
    setShowAliasModal(false);
    setGameMessage(`Welcome to the table, ${playerAlias}! 🎰`);
    setTimeout(() => setGameMessage(''), 3000);
  };

  const handleStandUp = () => {
    // Proceed with leaving (no confirmation needed for kicks)
    if (socket) {
      socket.emit('stand-up');
    }
    
    // In demo mode, return remaining chips to balance
    if (demoMode && demoGameRef.current) {
      const currentState = demoGameRef.current.getState();
      const myPlayer = currentState.players.find((p: any) => p.isMe);
      
      if (myPlayer && myPlayer.stack > 0) {
        const remainingChips = myPlayer.stack;
        setBalance(prev => prev + remainingChips);
        setGameMessage(`💰 Returned ${remainingChips.toLocaleString()} CHIPS to your bankroll!`);
        setTimeout(() => setGameMessage(''), 3000);
      }
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
    
    // Clear demo game state if in demo mode
    if (demoMode) {
      setDemoGame(null);
      if (demoGameRef.current) {
        demoGameRef.current = null;
      }
      prevCommunityCardsLengthRef.current = 0; // Reset card sound tracking
      setMyCards([]);
      setCommunityCards([]);
      setPot(0);
      setCurrentBet(0);
      setCurrentPlayer(0);
      setPlayers([]);
      setGameLog([]);
    }
    
    // Reset session stats
    setSessionBuyIn(0);
    
    // Reset auto-actions
    setAutoFold(false);
    setAutoCheck(false);
    
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
    setGameMessage('Left the table 👋');
    setTimeout(() => setGameMessage(''), 3000);
  };

  const handleSitAtSeat = (seat: number) => {
    console.log('Sitting at seat:', seat);
    
    // Prevent re-seating if already seated
    if (isSeated && seatNumber > 0) {
      setGameMessage('You are already seated! Stand up first to change seats. 🪑');
      return;
    }
    
    if (!walletConnected && !demoMode) {
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
    
    if (socket) {
      socket.emit('sit-down', { seat });
    }
    
    // In demo mode, check if player has enough for initial buy-in (100K)
    const buyInAmount = 100000;
    if (demoMode && balance < buyInAmount) {
      setGameMessage(`❌ Insufficient balance! You need ${buyInAmount.toLocaleString()} CHIPS to sit down but only have ${balance.toLocaleString()} CHIPS`);
      setTimeout(() => setGameMessage(''), 3000);
      return;
    }
    
    // Deduct initial buy-in from balance
    if (demoMode) {
      setBalance(prev => prev - buyInAmount);
    }
    
    setIsSeated(true);
    setSeatNumber(seat);
    setGameMessage(`Welcome to Shido Poker! You brought ${buyInAmount.toLocaleString()} CHIPS to the table. ${balance - buyInAmount} CHIPS remaining in bankroll.`);
    setTimeout(() => setGameMessage(''), 5000);
    
    // Start demo game if in demo mode
    if (demoMode) {
      startDemoGame(seat);
    }
  };

  const startDemoTimer = (seat: number) => {
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Initialize timer state
    const initialTimerState = {
      playerId: seat.toString(),
      baseTimeMs: 20000, // 20 seconds
      baseMaxMs: 20000,
      timeBankMs: 10000, // 10 seconds time bank
      timeBankMaxMs: 10000,
      usingTimeBank: false
    };
    
    setTimerState(initialTimerState);
    
    // Start countdown
    const interval = setInterval(() => {
      setTimerState((prev: any) => {
        if (!prev) return null;
        
        if (!prev.usingTimeBank) {
          // Debug: Log every 5 seconds
          if (Math.floor(prev.baseTimeMs / 1000) % 5 === 0 && prev.baseTimeMs % 1000 === 0) {
            console.log('[Timer] Base time remaining:', Math.floor(prev.baseTimeMs / 1000), 'seconds');
          }
          // Countdown base timer
          const newBaseTime = Math.max(0, prev.baseTimeMs - 100);
          
          if (newBaseTime === 0 && prev.timeBankMs > 0) {
            // Switch to time bank
            return {
              ...prev,
              baseTimeMs: 0,
              usingTimeBank: true
            };
          } else if (newBaseTime === 0) {
            // Timer expired - check for auto-actions first
            clearInterval(interval);
            if (demoGameRef.current && seat) {
              // Get current game state to check actual bet amount
              const gameState = demoGameRef.current.getState();
              const myPlayer = gameState.players.find((p: any) => p.isMe);
              const callAmount = myPlayer ? gameState.currentBet - myPlayer.bet : 0;
              
              console.log('[Timer Expiry] Base time expired! Auto-fold:', autoFoldRef.current, 'Auto-check:', autoCheckRef.current, 'Call amount:', callAmount, 'Game currentBet:', gameState.currentBet, 'My bet:', myPlayer?.bet);
              
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
        } else {
          // Countdown time bank
          const newBankTime = Math.max(0, prev.timeBankMs - 100);
          
          if (newBankTime === 0) {
            // Time bank expired - check for auto-actions first
            clearInterval(interval);
            if (demoGameRef.current && seat) {
              // Get current game state to check actual bet amount
              const gameState = demoGameRef.current.getState();
              const myPlayer = gameState.players.find((p: any) => p.isMe);
              const callAmount = myPlayer ? gameState.currentBet - myPlayer.bet : 0;
              
              console.log('[Timer Expiry] Time bank expired! Auto-fold:', autoFoldRef.current, 'Auto-check:', autoCheckRef.current, 'Call amount:', callAmount, 'Game currentBet:', gameState.currentBet, 'My bet:', myPlayer?.bet);
              
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
            timeBankMs: newBankTime
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

  const startDemoGame = (playerSeat: number) => {
    // Import and create multi-player demo game with selected player count
    console.log('[startDemoGame] Creating game with:', { playerSeat, playerCount });
    import('./utils/MultiPlayerPokerGame').then(({ MultiPlayerPokerGame }) => {
      const game = new MultiPlayerPokerGame(playerSeat, playerCount, (gameState) => {
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
          
        // Check for auto-actions IMMEDIATELY when turn starts
        if (isNowMyTurn) {
          const myPlayer = gameState.players.find((p: any) => p.isMe);
          const callAmount = myPlayer ? gameState.currentBet - myPlayer.bet : 0;
          
          console.log('[Auto-Action Check] Turn started - Auto-fold:', autoFoldRef.current, 'Auto-check:', autoCheckRef.current, 'Call amount:', callAmount);
          
          // Auto-fold if enabled and facing a bet
          if (autoFoldRef.current && callAmount > 0 && demoGameRef.current) {
            console.log('[Auto-Action] IMMEDIATELY auto-folding to bet:', callAmount);
            setTimeout(() => {
              if (demoGameRef.current) {
                demoGameRef.current.handlePlayerAction('fold');
              }
            }, 500); // Small delay for visual feedback
          }
          // Auto-check if enabled and no bet to call
          else if (autoCheckRef.current && callAmount === 0 && demoGameRef.current) {
            console.log('[Auto-Action] IMMEDIATELY auto-checking (no bet)');
            setTimeout(() => {
              if (demoGameRef.current) {
                demoGameRef.current.handlePlayerAction('check');
              }
            }, 500); // Small delay for visual feedback
          }
        }
        
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
        
        // Apply pending rebuy at start of new hand
        if (gameState.street === 'preflop' && gameState.communityCards.length === 0 && pendingRebuy > 0) {
          const myPlayer = gameState.players.find((p: any) => p.isMe);
          if (myPlayer && demoGameRef.current) {
            console.log('[Rebuy] Applying pending rebuy:', pendingRebuy, 'chips at start of new hand');
            demoGameRef.current.addChips(myPlayer.seat, pendingRebuy);
            setGameMessage(`💰 ${pendingRebuy.toLocaleString()} CHIPS added to your stack!`);
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
            const prevStack = prev.totalWon - prev.totalLost + 100000; // Original starting stack
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
            // Parse winner and pot from log message
            // Format: "🏆 You win 400 with Two Pair, J's & 2's (K kicker)"
            const winMatch = winLog.action.match(/🏆 (.+?) win[s]? (\d+)/);
            if (winMatch) {
              const winner = winMatch[1];
              const potSize = parseInt(winMatch[2]);
              const currentHandNumber = handNumberRef.current + 1;
              
              console.log('[Winner Banner] Showing NEW winner:', winner, 'Pot:', potSize, 'Hand:', gameState.winningHand);
              
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
              
              // Hide banner after 4.5 seconds (before new hand starts at 5s)
              setTimeout(() => {
                console.log('[Winner Banner] Hiding banner');
                setShowWinningBanner(false);
              }, 4500);
            }
          } else {
            console.log('[Winner Banner] Already showed this win:', lastWinLogRef.current);
          }
        }
        
        // Clear the last win log ONLY when new hand starts (preflop with no community cards dealt yet)
        if (gameState.street === 'preflop' && gameState.communityCards.length === 0) {
          const hasWinLog = gameState.gameLog.some((log: any) => log.action.includes('🏆'));
          if (!hasWinLog && lastWinLogRef.current !== '') {
            // No win log means new hand has started, safe to clear
            console.log('[Winner Banner] New hand started, clearing lastWinLogRef');
            lastWinLogRef.current = '';
          }
        }
      }, (playerId) => {
        // Timer callback - start/restart timer on every turn
        startDemoTimer(playerId);
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
      
      // Start timer for first player's turn
      setTimeout(() => {
        try {
          const state = game.getState();
          console.log('[Demo Game] Current player:', state.currentPlayer, 'Your seat:', playerSeat);
          if (state.currentPlayer === playerSeat) {
            startDemoTimer(playerSeat);
          }
        } catch (error) {
          console.error('[Demo Game] Error getting state:', error);
        }
      }, 1000);
    }).catch(error => {
      console.error('[Demo Game] Failed to load game:', error);
      setGameMessage('❌ Failed to start demo game. Please refresh and try again.');
    });
  };

  const startDemoMode = () => {
    setDemoMode(true);
    setWalletConnected(true);
    setWalletAddress('0xDEMO...MODE');
    setBalance(250000);
    setGameMessage('🎮 Demo Mode Activated! Join a table to play.');
    setTimeout(() => setGameMessage(''), 3000);
  };

  const handleSendMessage = (message: string) => {
    const newMessage = { user: 'You', text: message };
    setMessages(prev => [...prev, newMessage]);
    
    // In demo mode, just add to local messages
    if (demoMode) {
      return;
    }
    
    // In multiplayer mode, send via socket
    if (socket && isSeated) {
      socket.emit('chat-message', { message });
    }
  };
  
  const handleRequestTimeBank = () => {
    if (!timerState || timerState.usingTimeBank || timerState.timeBankMs <= 0) {
      setGameMessage('⚠️ No time bank available!');
      return;
    }
    
    // Manually switch to time bank
    setTimerState((prev: any) => ({
      ...prev,
      usingTimeBank: true
    }));
    
    setGameMessage('⏱️ Time bank activated!');
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
    executive: { primary: '#D4AF3715', secondary: '#D4AF3708', accent: 'yellow-600/20' }
  };

  const currentGrid = themeGrids[theme];

  // Keyboard Shortcuts - Professional feature
  const isMyTurn = demoMode && demoGame 
    ? demoGame.getState().currentPlayer === seatNumber 
    : currentPlayer === seatNumber;

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
          : players.find((p: any) => p.seat === seatNumber);
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
        const raiseAmount = currentBet > 0 ? currentBet * 2 : 10000;
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
          : players.find((p: any) => p.seat === seatNumber)?.stack || 0;
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

  // 🎬 SPLASH SCREEN - Show on app load
  if (appState === 'SPLASH') {
    return <SplashScreen onComplete={() => setAppState('LOGIN')} />;
  }

  // 🎮 LOGIN SCREEN - Show after splash
  if (appState === 'LOGIN') {
    return <LoginScreen onLogin={(name, selectedAvatarCategory, selectedAvatarIndex) => {
      setPlayerAlias(name);
      // Use selected avatar from login screen
      setAvatarCategory(selectedAvatarCategory);
      setAvatarIndex(selectedAvatarIndex);
      // Automatically start play-money mode (no wallet needed)
      setDemoMode(true);
      setWalletConnected(true); // Treated as "logged in"
      setWalletAddress('0xPLAY...MODE'); // Placeholder
      
      // Load or initialize balance with 24-hour claim system
      const savedBalance = localStorage.getItem(`poker_balance_${name}`);
      const savedClaimTime = localStorage.getItem(`poker_claim_time_${name}`);
      
      if (savedBalance && savedClaimTime) {
        // User has played before
        const currentBalance = parseInt(savedBalance);
        const lastClaim = parseInt(savedClaimTime);
        setBalance(currentBalance);
        setLastClaimTime(lastClaim);
        
        // Check if they can claim daily bonus (24 hours = 86400000 ms)
        const now = Date.now();
        const timeSinceLastClaim = now - lastClaim;
        const hoursSinceLastClaim = Math.floor(timeSinceLastClaim / 1000 / 60 / 60);
        
        if (currentBalance === 0 && timeSinceLastClaim >= 86400000) {
          // It's been 24 hours and they're broke - give them 1M chips
          setBalance(1000000);
          setLastClaimTime(now);
          localStorage.setItem(`poker_balance_${name}`, '1000000');
          localStorage.setItem(`poker_claim_time_${name}`, now.toString());
          setGameMessage('🎁 Daily bonus claimed! 1,000,000 CHIPS added to your bankroll!');
        } else if (currentBalance === 0) {
          // They're broke but can't claim yet
          const hoursRemaining = 24 - hoursSinceLastClaim;
          setGameMessage(`⏳ Out of chips! Come back in ${hoursRemaining} hours for your daily 1M chips bonus.`);
        }
      } else {
        // New player - give them 1M chips
        setBalance(1000000);
        const now = Date.now();
        setLastClaimTime(now);
        localStorage.setItem(`poker_balance_${name}`, '1000000');
        localStorage.setItem(`poker_claim_time_${name}`, now.toString());
      }
      
      // Initialize or load session stats
      const existingStats = loadStats();
      if (existingStats && existingStats.playerAlias === name) {
        // Continue existing session for this player
        setSessionStatsData(existingStats);
      } else {
        // Start new session
        const newStats = initializeStats(name, 1000000);
        setSessionStatsData(newStats);
        saveStats(newStats);
      }
      
      setAppState('LOBBY');
      setGameMessage('🎰 Welcome! Join a table to start playing.');
      setTimeout(() => setGameMessage(''), 3000);
    }} />;
  }

  return (
    <div className="min-h-screen bg-black text-brand-text flex flex-col relative overflow-hidden">
      {/* ⬡🔥 NEON UNDERGROUND POKER ATMOSPHERE 🔥⬡ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        
        {/* Base hexagon grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexGrid" width="150" height="130" patternUnits="userSpaceOnUse">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(6, 182, 212, 0.15)" 
                strokeWidth="1.5" 
                fill="none"
              />
            </pattern>
            <filter id="hexGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexGrid)" />
        </svg>

        {/* Pulsing hexagons - Layer 1 (Cyan) - Static unless timer active */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`cyan-${i}`}
            className="absolute transition-opacity duration-300"
            style={{
              left: `${15 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 35}%`,
              width: '150px',
              height: '130px',
              animation: hexagonsActive ? `hexPulse ${3 + Math.random() * 4}s ease-in-out infinite` : 'none',
              animationDelay: `${Math.random() * 3}s`,
              opacity: hexagonsActive ? 0 : 0.08,
            }}
          >
            <svg viewBox="0 0 150 130" className="w-full h-full">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(6, 182, 212, 0.8)" 
                strokeWidth="2.5" 
                fill="rgba(6, 182, 212, 0.05)"
                filter="url(#hexGlow)"
              />
            </svg>
          </div>
        ))}

        {/* Pulsing hexagons - Layer 2 (Purple) - Static unless timer active */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`purple-${i}`}
            className="absolute transition-opacity duration-300"
            style={{
              left: `${25 + (i % 3) * 30}%`,
              top: `${25 + Math.floor(i / 3) * 30}%`,
              width: '150px',
              height: '130px',
              animation: hexagonsActive ? `hexPulse ${4 + Math.random() * 3}s ease-in-out infinite` : 'none',
              animationDelay: `${Math.random() * 4}s`,
              opacity: hexagonsActive ? 0 : 0.06,
            }}
          >
            <svg viewBox="0 0 150 130" className="w-full h-full">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(168, 85, 247, 0.7)" 
                strokeWidth="2.5" 
                fill="rgba(168, 85, 247, 0.04)"
                filter="url(#hexGlow)"
              />
            </svg>
          </div>
        ))}

        {/* ♠️♥️♦️♣️ FLOATING CARD SUITS ♠️♥️♦️♣️ */}
        {[
          { suit: '♠', color: 'rgba(6, 182, 212, 0.3)', delay: 0, duration: 15 },
          { suit: '♥', color: 'rgba(236, 72, 153, 0.3)', delay: 2, duration: 18 },
          { suit: '♦', color: 'rgba(168, 85, 247, 0.3)', delay: 4, duration: 20 },
          { suit: '♣', color: 'rgba(6, 182, 212, 0.25)', delay: 6, duration: 17 },
          { suit: '♠', color: 'rgba(168, 85, 247, 0.25)', delay: 8, duration: 19 },
          { suit: '♥', color: 'rgba(236, 72, 153, 0.25)', delay: 10, duration: 16 },
        ].map((item, i) => (
          <div
            key={`suit-${i}`}
            className="absolute text-4xl sm:text-5xl lg:text-6xl font-bold"
            style={{
              left: `${(i * 15) % 100}%`,
              top: `${((i * 23) % 80) + 10}%`,
              color: item.color,
              textShadow: `0 0 30px ${item.color}, 0 0 60px ${item.color}`,
              animation: `cardSuitFloat ${item.duration}s ease-in-out infinite`,
              animationDelay: `${item.delay}s`,
              opacity: 0,
              transform: 'rotate(0deg)',
            }}
          >
            {item.suit}
          </div>
        ))}

        {/* Radial glow overlays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/5 rounded-full blur-[80px] animate-pulse pointer-events-none" 
             style={{ animationDelay: '2s' }}></div>

        {/* Underground poker atmosphere with subtle green felt undertones */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(34, 139, 34, 0.1) 0px, transparent 1px, transparent 2px, rgba(34, 139, 34, 0.1) 3px),
              radial-gradient(circle at 30% 40%, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)
            `,
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }}
        ></div>
        
        {/* 3D Grid overlay */}
        <div 
          className="absolute inset-0 opacity-25" 
          style={{ 
            backgroundImage: `linear-gradient(to right, ${currentGrid.primary} 2px, transparent 2px), linear-gradient(to bottom, ${currentGrid.primary} 2px, transparent 2px)`, 
            backgroundSize: '60px 60px',
            transform: 'rotateX(60deg) scale(2)',
            transformOrigin: 'center bottom',
            backgroundPosition: 'center 20%'
          }}
        ></div>
        <div 
          className="absolute inset-0 opacity-15" 
          style={{ 
            backgroundImage: `linear-gradient(to right, ${currentGrid.secondary} 1px, transparent 1px), linear-gradient(to bottom, ${currentGrid.secondary} 1px, transparent 1px)`, 
            backgroundSize: '20px 20px',
            transform: 'rotateX(60deg) scale(2)',
            transformOrigin: 'center bottom',
            backgroundPosition: 'center 20%'
          }}
        ></div>
        
        {/* Poker table felt texture */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(34, 139, 34, 0.3) 0px, transparent 1px, transparent 2px, rgba(34, 139, 34, 0.3) 3px)`,
            backgroundSize: '100% 4px'
          }}
        ></div>
        
        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/70"></div>
      </div>
      
      {/* Fixed Header - Full Width */}
      <header 
        className="relative fixed top-0 left-0 right-0 flex justify-between items-center px-8 py-4 backdrop-blur-xl z-50"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '2px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)'
        }}
      >
        {/* 🔥 EXACT LOBBY CARD STYLE CORNERS 🔥 */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none z-10"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none z-10"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none z-10"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none z-10"
             style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
        
        {/* Corner glow dots */}
        <div className="absolute top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none z-10"
             style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>

        {/* Logo - New Design */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <img 
              src="/poker-logo.png" 
              alt="Poker Logo" 
              className="h-16 w-auto object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Theme Switcher - Cyberpunk Style */}
          <div className="flex gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-2 rounded border border-purple-500/20">
            <button 
              onClick={() => setTheme('executive')}
              className={`relative px-2.5 py-1.5 text-base transition-all rounded ${theme === 'executive' ? '' : 'opacity-40 hover:opacity-70'}`}
              style={theme === 'executive' ? {
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(217, 119, 6, 0.15))',
                border: '1px solid rgba(234, 179, 8, 0.5)',
                boxShadow: '0 0 10px rgba(234, 179, 8, 0.4), inset 0 0 10px rgba(234, 179, 8, 0.1)',
                filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))'
              } : {}}
              title="Executive Black & Gold"
            >
              💎
            </button>
            <button 
              onClick={() => setTheme('classic')}
              className={`relative px-2.5 py-1.5 text-base transition-all rounded ${theme === 'classic' ? '' : 'opacity-40 hover:opacity-70'}`}
              style={theme === 'classic' ? {
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.4), inset 0 0 10px rgba(16, 185, 129, 0.1)',
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
              } : {}}
              title="Classic Green Table"
            >
              🎲
            </button>
            <button 
              onClick={() => setTheme('light')}
              className={`relative px-2.5 py-1.5 text-base transition-all rounded ${theme === 'light' ? '' : 'opacity-40 hover:opacity-70'}`}
              style={theme === 'light' ? {
                background: 'linear-gradient(135deg, rgba(224, 242, 254, 0.15), rgba(186, 230, 253, 0.15))',
                border: '1px solid rgba(125, 211, 252, 0.5)',
                boxShadow: '0 0 10px rgba(125, 211, 252, 0.4), inset 0 0 10px rgba(224, 242, 254, 0.1)',
                filter: 'drop-shadow(0 0 8px rgba(125, 211, 252, 0.6))'
              } : {}}
              title="Light Mode"
            >
              ☀️
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`relative px-2.5 py-1.5 text-base transition-all rounded ${theme === 'dark' ? '' : 'opacity-40 hover:opacity-70'}`}
              style={theme === 'dark' ? {
                background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.15), rgba(71, 85, 105, 0.15))',
                border: '1px solid rgba(100, 116, 139, 0.5)',
                boxShadow: '0 0 10px rgba(100, 116, 139, 0.4), inset 0 0 10px rgba(100, 116, 139, 0.1)',
                filter: 'drop-shadow(0 0 8px rgba(100, 116, 139, 0.6))'
              } : {}}
              title="Dark Mode"
            >
              🌙
            </button>
          </div>
          
          {/* Player Info & Actions */}
          <div className="flex items-center gap-3">
              {/* Player Alias */}
              <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-cyan-400/40">
                <span className="text-cyan-400 font-mono text-sm font-bold">{playerAlias}</span>
              </div>
              
              {/* Balance */}
              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-sm px-5 py-2 rounded-xl border border-amber-400/40">
                <span className="text-amber-400 font-bold text-lg">{balance.toLocaleString()}</span>
                <span className="text-amber-300/60 text-xs ml-1.5 font-semibold">CHIPS</span>
                {pendingRebuy > 0 && (
                  <div className="text-cyan-400 text-xs mt-0.5 animate-pulse">
                    +{pendingRebuy.toLocaleString()} queued ⏳
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <button 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black rounded-xl shadow-lg shadow-blue-600/40 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-glow-cyan text-sm" 
                onClick={() => setShowFairnessModal(true)}
                title="Provably Fair"
              >
                🔒 FAIR
              </button>
              <button 
                className="px-5 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-black rounded-xl shadow-lg shadow-yellow-600/40 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-glow-amber text-sm" 
                onClick={() => setShowLeaderboard(true)}
                title="View Leaderboard"
              >
                🏆
              </button>
              <button 
                className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-600/40 transition-all hover:scale-105 active:scale-95 text-sm" 
                onClick={() => setShowDepositModal(true)}
              >
                💰 DEPOSIT
              </button>
              
              {/* Help Button */}
              <HelpButton />
              
              {/* Sound Settings Button */}
              <button
                onClick={() => setShowSoundSettings(true)}
                className="p-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-2 border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-600/20"
                title="Sound Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
              
              {/* Session Stats Button */}
              <button
                onClick={() => { playButtonClick(); setShowSessionStatsModal(true); }}
                className="relative p-2 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border-2 border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 hover:text-cyan-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-600/20"
                title="View Session Statistics"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {sessionStatsData && sessionStatsData.handsPlayed > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {sessionStatsData.handsPlayed}
                  </span>
                )}
              </button>
              
              {/* Show LEAVE TABLE button if seated, otherwise LOG OUT */}
              {isSeated ? (
                <button 
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/40 transition-all hover:scale-105 active:scale-95 text-sm" 
                  onClick={() => { playButtonClick(); handleStandUp(); }}
                  title="Leave table and return to lobby"
                >
                  🚪 LEAVE TABLE
                </button>
              ) : (
                <button 
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/40 transition-all hover:scale-105 active:scale-95 text-sm" 
                  onClick={() => {
                    playButtonClick();
                    setAppState('SPLASH');
                    setPlayerAlias('');
                    setBalance(0);
                    setDemoMode(false);
                    setWalletConnected(false);
                  }}
                  title="Log out and return to splash screen"
                >
                  ⏏️ LOG OUT
                </button>
              )}
            </div>
        </div>
      </header>

      {/* Main Content - 30px gap under header, fills remaining space */}
      <main className="fixed top-[120px] left-0 right-0 bottom-[10px] flex flex-col px-4 pb-3 gap-3 overflow-auto">
        {showLobby ? (
          <div className="flex flex-col items-center w-full gap-6 py-6">
            <Lobby 
              onSitDown={handleSitDown} 
              playerCount={playerCount}
              setPlayerCount={setPlayerCount}
            />

            {/* Floating DAVE Helper - Bottom Right */}
            <div className="fixed bottom-6 right-6 z-50">
              {/* DAVE Popup */}
              {showDavePopup && (
                <>
                  {/* Backdrop overlay - click to close */}
                  <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setShowDavePopup(false)}
                  />
                  
                  {/* Popup box */}
                  <div className="fixed bottom-28 right-6 w-96 z-50 animate-slide-in">
                    <div className="glass-card border-2 border-cyan-400/40 bg-black/90 backdrop-blur-xl shadow-2xl"
                         style={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.1)' }}>
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60"></div>
                      
                      {/* DAVE Avatar at top */}
                      <div className="flex justify-center -mt-10 mb-3">
                        <img 
                          src="/logo.png" 
                          alt="DAVE" 
                          className="w-20 h-20 rounded-full border-4 border-cyan-400/60 bg-black/80 shadow-lg"
                          style={{ filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.8))' }}
                        />
                      </div>

                      <div className="p-6 pt-2">
                        <h3 className="text-2xl font-black text-cyan-400 mb-3 text-center tracking-wider"
                            style={{ textShadow: '0 0 15px rgba(6, 182, 212, 0.8)' }}>
                          Meet DAVE, Your Dealer
                        </h3>
                        
                        <div className="text-slate-300 text-sm leading-relaxed space-y-3 mb-4">
                          <p>
                            DAVE isn't just an AI. He's <span className="text-cyan-400 font-semibold">the AI</span>. 
                            The one who somehow knows every poker rule, every side pot, and can track every last chip 
                            like a silicon savant. Ask him how to split the blinds? Instant answer. Ask him about 
                            quantum physics, or what day it is? He'll stare blankly into the void, maybe mumble 
                            something about nachos.
                          </p>
                          
                          <p>
                            He's a genius in the casino, a complete idiot outside it. That's why we love him. 
                            He's our dumb little robot with <span className="text-amber-400 font-semibold">all the poker answers</span>, 
                            and absolutely no clue about life.
                          </p>
                        </div>

                        <div className="text-center text-xs text-slate-500 italic border-t border-slate-700 pt-3">
                          More from Dave Coming Soon...
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Floating DAVE button */}
              <button
                onClick={() => {
                  setShowDavePopup(!showDavePopup);
                  playButtonClick();
                }}
                className="group relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 
                          shadow-lg hover:scale-110 transition-all duration-300 border-2 border-cyan-400/50
                          hover:shadow-cyan-500/50"
                style={{ 
                  boxShadow: '0 0 25px rgba(6, 182, 212, 0.5), inset 0 0 20px rgba(6, 182, 212, 0.2)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="DAVE Helper" 
                  className="w-full h-full rounded-full object-cover"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))' }}
                />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 
                               transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                  <div className="bg-black/90 text-cyan-400 text-xs font-bold px-3 py-2 rounded-lg border border-cyan-400/50"
                       style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.8)' }}>
                    Ask DAVE 🤖
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Main Layout: Table on left, Actions + Players on right (wider) */}
            <div className="flex gap-3 flex-1 min-h-0">
              {/* Left Side: Table (full height) */}
              <div className="flex-1 min-w-0 relative h-full">
                {/* Floating DAVE Helper - Top Left of Table */}
                <div className="absolute top-4 left-4 z-50">
                  {/* DAVE Popup */}
                  {showDavePopup && (
                    <>
                      {/* Backdrop overlay - click to close */}
                      <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => setShowDavePopup(false)}
                      />
                      
                      {/* Popup box */}
                      <div className="fixed top-24 left-20 w-96 z-50 animate-slide-in">
                        <div className="glass-card border-2 border-cyan-400/40 bg-black/90 backdrop-blur-xl shadow-2xl"
                             style={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.1)' }}>
                          {/* Corner brackets */}
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60"></div>
                          
                          {/* DAVE Avatar at top */}
                          <div className="flex justify-center -mt-10 mb-3">
                            <img 
                              src="/logo.png" 
                              alt="DAVE" 
                              className="w-20 h-20 rounded-full border-4 border-cyan-400/60 bg-black/80 shadow-lg"
                              style={{ filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.8))' }}
                            />
                          </div>

                          <div className="p-6 pt-2">
                            <h3 className="text-2xl font-black text-cyan-400 mb-3 text-center tracking-wider"
                                style={{ textShadow: '0 0 15px rgba(6, 182, 212, 0.8)' }}>
                              Meet DAVE, Your Dealer
                            </h3>
                            
                            <div className="text-slate-300 text-sm leading-relaxed space-y-3 mb-4">
                              <p>
                                DAVE isn't just an AI. He's <span className="text-cyan-400 font-semibold">the AI</span>. 
                                The one who somehow knows every poker rule, every side pot, and can track every last chip 
                                like a silicon savant. Ask him how to split the blinds? Instant answer. Ask him about 
                                quantum physics, or what day it is? He'll stare blankly into the void, maybe mumble 
                                something about nachos.
                              </p>
                              
                              <p>
                                He's a genius in the casino, a complete idiot outside it. That's why we love him. 
                                He's our dumb little robot with <span className="text-amber-400 font-semibold">all the poker answers</span>, 
                                and absolutely no clue about life.
                              </p>
                            </div>

                            <div className="text-center text-xs text-slate-500 italic border-t border-slate-700 pt-3">
                              More from Dave Coming Soon...
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Floating DAVE button */}
                  <button
                    onClick={() => {
                      setShowDavePopup(!showDavePopup);
                      playButtonClick();
                    }}
                    className="group relative w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 
                              shadow-lg hover:scale-110 transition-all duration-300 border-2 border-cyan-400/50
                              hover:shadow-cyan-500/50"
                    style={{ 
                      boxShadow: '0 0 20px rgba(6, 182, 212, 0.5), inset 0 0 15px rgba(6, 182, 212, 0.2)',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  >
                    <img 
                      src="/logo.png" 
                      alt="DAVE Helper" 
                      className="w-full h-full rounded-full object-cover"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' }}
                    />
                    
                    {/* Tooltip on hover */}
                    <div className="absolute top-full left-0 mt-2 opacity-0 group-hover:opacity-100 
                                   transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                      <div className="bg-black/90 text-cyan-400 text-xs font-bold px-3 py-2 rounded-lg border border-cyan-400/50"
                           style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.8)' }}>
                        Ask DAVE 🤖
                      </div>
                    </div>
                  </button>
                </div>

                {/* Game Message Overlay on Table */}
                {gameMessage && (
                  <div className="absolute top-4 right-4 bg-brand-surface/95 backdrop-blur-sm px-6 py-3 rounded-lg shadow-xl border border-brand-secondary z-50 animate-slide-in max-w-md">
                    <div className="text-brand-text font-medium">{gameMessage}</div>
                  </div>
                )}

                {/* Hand Strength Indicator - Above Actions */}
                {!showLobby && seatNumber > 0 && (
                  <div className="absolute bottom-32 left-4 z-40">
                    <HandStrength 
                      myCards={demoMode ? myCards : (gameState?.players.find((p: any) => p.seat === seatNumber)?.hand || [])}
                      communityCards={communityCards}
                    />
                  </div>
                )}

                {/* Glass Morphism Action Buttons Overlay - Bottom Left of Table */}
                {!showLobby && (
                  <div className="absolute bottom-4 left-4 z-40">
                    <Actions 
                      onAction={handleAction} 
                      onStandUp={handleStandUp}
                      onRebuy={handleRebuy}
                      onShowMuck={handleShowMuck}
                      currentBet={currentBet}
                      playerStack={demoMode ? 
                        (demoGame?.getState().players.find((p: any) => p.isMe)?.stack || 0) : 
                        (players.find((p: any) => p.seat === seatNumber)?.stack || 0)
                      }
                      myBet={demoMode ? 
                        (demoGame?.getState().myBet || 0) : 
                        (players.find((p: any) => p.seat === seatNumber)?.bet || 0)
                      }
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
                        setSitOutNextHand(!sitOutNextHand);
                        setGameMessage(sitOutNextHand ? 'Sit out cancelled ✅' : '⏸️ You will sit out next hand');
                      }}
                      isOverlay={true}
                    />
                  </div>
                )}

                {/* Session Stats - Top right of table with 10px padding */}
                {!showLobby && sessionBuyIn > 0 && (
                  <div className="absolute top-[10px] right-4 z-40" style={{ width: '18rem' }}>
                    <SessionStats 
                      buyIn={sessionBuyIn}
                      currentStack={players.find((p: any) => p.isMe)?.stack || 0}
                    />
                  </div>
                )}

                {/* Chat Overlay - Right side, larger for better visibility */}
                {!showLobby && (
                  <div className="absolute bottom-4 right-4 z-40" style={{ width: '33.6rem' }}>
                    <Chat messages={messages} onSendMessage={handleSendMessage} isOverlay={true} />
                  </div>
                )}

                {/* Live Table Stats Banner - Positioned at top center with 10px padding */}
                {demoMode && isSeated && (
                  <div className="absolute top-[10px] left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-5xl">
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
                
                <RealisticTable
                  players={players}
                  communityCards={communityCards}
                  pot={pot}
                  sidePots={demoMode && demoGame ? demoGame.getState().sidePots : []}
                  currentPlayer={currentPlayer}
                  mySeat={seatNumber}
                  myCards={demoMode ? myCards : (gameState?.players.find((p: any) => p.seat === seatNumber)?.hand || [])}
                  opponentCards={demoMode && demoGame ? demoGame.getState().opponentCards : []}
                  showOpponentCards={demoMode && demoGame ? demoGame.getState().showOpponentCards : false}
                  playerAlias={playerAlias}
                  myAvatar={avatarCategories[avatarCategory]?.[avatarIndex] || '🎮'}
                  theme={theme}
                  revealedCards={revealedCards}
                  timerState={timerState}
                  onRequestTimeBank={handleRequestTimeBank}
                  onSitAtSeat={handleSitAtSeat}
                  maxPlayers={playerCount}
                />
              </div>
              
              {/* Right Side: Game Log (top) + Players List + Recent Winners (stacked) */}
              <div className={`relative flex flex-col gap-3 transition-all duration-300 h-full ${sidePanelCollapsed ? 'w-12' : 'w-80'}`}>
                {sidePanelCollapsed ? (
                  /* Collapsed State - Expand Button */
                  <button
                    onClick={() => setSidePanelCollapsed(false)}
                    className="w-12 h-12 rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:border-amber-500/50 hover:bg-slate-700/80 transition-all flex items-center justify-center text-amber-400 hover:text-amber-300 shadow-lg"
                    title="Expand panels"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                ) : (
                  <>
                    {/* Collapse Button - Positioned at top right of panels */}
                    <button
                      onClick={() => setSidePanelCollapsed(true)}
                      className="absolute top-2 right-2 z-50 w-8 h-8 rounded-lg bg-slate-800/90 backdrop-blur-sm border border-slate-700 hover:border-amber-500/50 hover:bg-slate-700/90 transition-all flex items-center justify-center text-slate-400 hover:text-amber-300 shadow-lg"
                      title="Collapse panels (fullscreen table)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                    
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

            {/* Winning Hand Banner - Center overlay */}
            <WinningHandBanner 
              winningHand={bannerData.winningHand}
              winner={bannerData.winner}
              potSize={bannerData.potSize}
              visible={showWinningBanner}
            />

          </>
        )}
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowDepositModal(false)}>
          <div className="glass-card p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-brand-primary mb-4">💰 Deposit SHIDO</h3>
            <p className="text-sm text-brand-text-dark mb-4">
              Available Balance: {balance.toLocaleString()} SHIDO
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount to Deposit</label>
              <input 
                type="number" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                step="1000"
                min="1000"
                max={balance}
                className="w-full bg-brand-surface border border-brand-primary/30 rounded px-4 py-2 text-white focus:outline-none focus:border-brand-primary"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" onClick={handleDeposit}>
                Deposit {depositAmount.toLocaleString()} SHIDO
              </button>
              <button className="btn bg-gray-600 hover:bg-gray-700" onClick={() => setShowDepositModal(false)}>
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
            <h3 className="text-2xl font-bold text-brand-primary mb-4">💸 Withdraw SHIDO</h3>
            <p className="text-sm text-brand-text-dark mb-4">
              In-Game Balance: {balance.toLocaleString()} SHIDO
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount to Withdraw</label>
              <input 
                type="number" 
                value={withdrawAmount} 
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                step="1000"
                min="1000"
                max={balance}
                className="w-full bg-brand-surface border border-brand-primary/30 rounded px-4 py-2 text-white focus:outline-none focus:border-brand-primary"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1" onClick={handleWithdraw}>
                Withdraw {withdrawAmount.toLocaleString()} SHIDO
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
          <div className="relative p-6 max-w-md w-full mx-4 transition-all duration-500"
               style={{
                 background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.95) 100%)',
                 backdropFilter: 'blur(20px)',
                 border: '2px solid rgba(6, 182, 212, 0.3)',
                 boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)'
               }}>
            {/* 🔥 EXACT LOBBY CARD STYLE CORNERS 🔥 */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none"
                 style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none"
                 style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-cyan-400 opacity-80 pointer-events-none"
                 style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyan-400 opacity-80 pointer-events-none"
                 style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))' }}></div>
            
            {/* Corner glow dots */}
            <div className="absolute top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none"
                 style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none"
                 style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none"
                 style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 rounded-full opacity-80 animate-pulse pointer-events-none"
                 style={{ filter: 'blur(2px) drop-shadow(0 0 8px rgba(6, 182, 212, 1))' }}></div>

            <h3 className="text-2xl font-bold text-cyan-400 mb-2 relative z-10" style={{ textShadow: '0 0 15px rgba(6, 182, 212, 0.8)' }}>🎮 Choose Your Alias</h3>
            <p className="text-sm text-cyan-200 mb-4 relative z-10">
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
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(14, 165, 233, 0.15))',
                      border: '2px solid rgba(6, 182, 212, 0.6)',
                      boxShadow: '0 0 15px rgba(6, 182, 212, 0.5), inset 0 0 15px rgba(6, 182, 212, 0.1)',
                      filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.7))'
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

      {/* Sound Settings Modal */}
      {showSoundSettings && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <SoundSettingsPanel onClose={() => setShowSoundSettings(false)} />
        </div>
      )}

      {/* Session Stats Modal */}
      {showSessionStatsModal && (
        <SessionStatsModal
          stats={sessionStatsData}
          onClose={() => setShowSessionStatsModal(false)}
          onReset={() => {
            setSessionStatsData(null);
            if (playerAlias) {
              const newStats = initializeStats(playerAlias, balance);
              setSessionStatsData(newStats);
              saveStats(newStats);
            }
          }}
        />
      )}

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
    </div>
  );
}

export default App;
