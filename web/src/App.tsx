import './index.css';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ethers } from 'ethers';
import Lobby from './components/Lobby.tsx';
import Table from './components/Table.tsx';
import RealisticTable from './components/RealisticTable.tsx';
import FairnessPane from './components/FairnessPane.tsx';
import WinningHandsPanel from './components/WinningHandsPanel.tsx';
import PlayersList from './components/PlayersList.tsx';
import FairnessInfo from './components/FairnessInfo.tsx';
import Chat from './components/Chat.tsx';
import GameLog from './components/GameLog.tsx';
import Actions from './components/Actions.tsx';
import Leaderboard, { PlayerStats } from './components/Leaderboard.tsx';
import { playTurnNotification, playCardWoosh, playCardFlip, playChipBet, playWinPot, playFold, playButtonClick, playSliderTick } from './utils/audioSystem';

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
  const [betAmount, setBetAmount] = useState(10000);
  const [balance, setBalance] = useState(250000);
  const [pot, setPot] = useState(0);
  const [gameMessage, setGameMessage] = useState('');
  
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
  const [autoCheck, setAutoCheck] = useState(false);
  const [sitOutNextHand, setSitOutNextHand] = useState(false);
  
  // Deposit/Withdraw
  const [depositAmount, setDepositAmount] = useState(100000);
  const [withdrawAmount, setWithdrawAmount] = useState(50000);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
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
  const [useRealisticTable, setUseRealisticTable] = useState<boolean>(true); // Toggle realistic vs simple table
  const [autoFold, setAutoFold] = useState<boolean>(false); // Auto-fold when facing bet
  const [autoCall, setAutoCall] = useState<boolean>(false); // Auto-call when possible
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

  // Win popup state
  const [winPopups, setWinPopups] = useState<{seat: number, amount: number}[]>([]);
  const prevPotRef = useRef<number>(0);

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

  const addGameLog = (action: string, player: string, type?: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
    setGameLog(prev => [...prev, { action, player, timestamp, type }]);
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

    // If in demo mode with heads-up game, use the game engine
    if (demoMode && demoGame) {
      demoGame.handlePlayerAction(action, amount);
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
        playChipBet();
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
        playChipBet();
        setGameMessage(`You raised ${amount?.toLocaleString() || 0} SHIDO 🚀`);
        setPot(prev => prev + (amount || 0));
        setCurrentBet(amount || 0);
        addGameLog(`You raise to ${amount?.toLocaleString() || 0}`, 'You', 'raise');
        break;
      case 'allin':
        actionType = 'ALL_IN';
        playChipBet();
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
      // In demo mode, just add chips locally
      setBalance(prev => prev + amount);
      
      // If there's an active demo game, add chips to the player
      if (demoGame && demoGameRef.current) {
        const currentState = demoGameRef.current.getState();
        const myPlayer = currentState.players.find((p: any) => p.isMe);
        
        if (myPlayer) {
          // Update player's stack in the game
          demoGameRef.current.addChips(amount);
          setGameMessage(`💰 Added ${amount.toLocaleString()} SHIDO to your stack!`);
          
          // If player was at 0 chips, start a new hand
          if (myPlayer.stack === 0) {
            setTimeout(() => {
              demoGameRef.current.startNewHand();
              setGameMessage('🃏 New hand started after rebuy! Good luck! 🍀');
            }, 1500);
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
    console.log('handleSitDown called with:', { tableId, seat, hasSocket: !!socket, walletConnected });
    
    if (!walletConnected) {
      setGameMessage('Please connect your wallet first! 🦊');
      return;
    }
    
    // Show alias modal before sitting
    setSeatNumber(seat);
    setShowAliasModal(true);
    setGameMessage('Choose your player name for this session 🎮');
  };

  const confirmSitDown = () => {
    if (!playerAlias.trim()) {
      setGameMessage('Please enter a name! ✏️');
      return;
    }
    
    const displayName = playerAlias.trim();
    
    console.log('confirmSitDown - seatNumber:', seatNumber);
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
      seat: seatNumber,
      avatarIndex: avatarIndex,
      avatarCategory: avatarCategory,
      avatar: selectedAvatar,
      walletAddress: walletAddress,
      address: walletAddress,
      isActive: false
    };
    
    // Update players array - either add or replace existing player
    const newPlayers = players.filter(p => p && p.seat !== seatNumber);
    newPlayers.push(newPlayer);
    
    console.log('confirmSitDown - newPlayer:', newPlayer);
    console.log('confirmSitDown - after players:', newPlayers);
    
    setPlayers(newPlayers);
    setIsSeated(true);
    
    // For now, allow joining even without socket connection for testing
    if (socket) {
      console.log(`Emitting sit-down event for seat: ${seatNumber}`);
      socket.emit('sit-down', { seat: seatNumber, alias: playerAlias, avatarIndex: avatarIndex });
    } else {
      console.log('No socket connection, joining table locally for testing');
    }
    
    setShowLobby(false); // Move to table view
    setShowAliasModal(false);
    setGameMessage(`Welcome to the table, ${playerAlias}! 🎰`);
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
    
    setShowLobby(true);
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
    
    // In demo mode, only allow seats 1-4 (4-player game)
    if (demoMode && (seat < 1 || seat > 4)) {
      setGameMessage('Demo game is 4 players only. Please choose seats 1-4. 🎮');
      setTimeout(() => setGameMessage(''), 3000);
      return;
    }
    
    if (socket) {
      socket.emit('sit-down', { seat });
    }
    
    setIsSeated(true);
    setSeatNumber(seat);
    setGameMessage(`Welcome to Shido Poker! Take a seat to start the game. 2 players min to play.`);
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
            console.log('[Timer Expiry] Base time expired! Auto-fold:', autoFold, 'Auto-call:', autoCall);
            clearInterval(interval);
            if (demoGameRef.current && seat) {
              // Check if auto-actions are enabled
              if (autoCall && currentBet > 0) {
                // Auto-call any bet
                console.log('[Auto-Action] Auto-calling bet:', currentBet);
                demoGameRef.current.handlePlayerAction('call', currentBet);
              } else if (autoFold && currentBet > 0) {
                // Auto-fold when facing a bet
                console.log('[Auto-Action] Auto-folding to bet:', currentBet);
                demoGameRef.current.handlePlayerAction('fold');
              } else {
                // No auto-action enabled, use default timeout behavior
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
            console.log('[Timer Expiry] Time bank expired! Auto-fold:', autoFold, 'Auto-call:', autoCall);
            clearInterval(interval);
            if (demoGameRef.current && seat) {
              // Check if auto-actions are enabled
              if (autoCall && currentBet > 0) {
                // Auto-call any bet
                console.log('[Auto-Action] Auto-calling bet:', currentBet);
                demoGameRef.current.handlePlayerAction('call', currentBet);
              } else if (autoFold && currentBet > 0) {
                // Auto-fold when facing a bet
                console.log('[Auto-Action] Auto-folding to bet:', currentBet);
                demoGameRef.current.handlePlayerAction('fold');
              } else {
                // No auto-action enabled, use default timeout behavior
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
    // Import and create 4-player demo game
    import('./utils/MultiPlayerPokerGame').then(({ MultiPlayerPokerGame }) => {
      const game = new MultiPlayerPokerGame(playerSeat, 4, (gameState) => {
        // Update UI with game state
        setPlayers(gameState.players);
        
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
        
        // Check if it's now player's turn
        const wasMyTurn = currentPlayer === playerSeat;
        const isNowMyTurn = gameState.currentPlayer === playerSeat;
        if (!wasMyTurn && isNowMyTurn) {
          playTurnNotification(); // Subtle nudge when it's your turn
          
          // Auto-check if enabled and no bet to call
          if (autoCall && currentBet === 0 && demoGameRef.current) {
            console.log('[Auto-Action] Auto-checking (no bet to call)');
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

  return (
    <div className={`min-h-screen ${themeBackgrounds[theme]} ${theme === 'light' ? 'text-gray-900' : 'text-brand-text'} flex flex-col relative overflow-hidden`}>
      {/* Casino Poker Table Background with 3D Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ perspective: '1000px' }}>
        {/* Casino background pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, rgba(139, 69, 19, 0.1) 0px, rgba(139, 69, 19, 0.1) 10px, transparent 10px, transparent 20px),
              repeating-linear-gradient(-45deg, rgba(34, 139, 34, 0.15) 0px, rgba(34, 139, 34, 0.15) 10px, transparent 10px, transparent 20px),
              radial-gradient(circle at 20% 30%, rgba(218, 165, 32, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(218, 165, 32, 0.1) 0%, transparent 50%)
            `,
            backgroundColor: 'rgba(20, 30, 20, 0.5)'
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
      <header className="fixed top-0 left-0 right-0 flex justify-between items-center px-8 py-4 bg-black/95 border-b-2 border-cyan-500/40 backdrop-blur-xl z-50 shadow-[0_4px_20px_rgba(0,0,0,0.8)]" 
              style={{ boxShadow: '0 4px 30px rgba(6, 182, 212, 0.3), inset 0 1px 1px rgba(6,182,212,0.2)' }}>
        {/* Logo with Shido Image */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-black/60 rounded-xl border border-cyan-500/30 backdrop-blur-sm">
            <img 
              src="/shido-logo.png" 
              alt="Shido Logo" 
              className="w-36 h-36 object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]"
            />
            <h1 className="text-3xl font-black tracking-tight relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400" 
                style={{ textShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(168, 85, 247, 0.4)' }}>
              POKER
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Table View Toggle */}
          <div className="flex gap-1 bg-black/30 backdrop-blur-sm px-1.5 py-1.5 rounded-xl border border-white/10">
            <button 
              onClick={() => setUseRealisticTable(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${useRealisticTable ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/50' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Realistic Oval Table"
            >
              🎰 REALISTIC
            </button>
            <button 
              onClick={() => setUseRealisticTable(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!useRealisticTable ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Simple Table View"
            >
              📐 SIMPLE
            </button>
          </div>
          
          {/* Theme Switcher */}
          <div className="flex gap-1 bg-black/30 backdrop-blur-sm px-1.5 py-1.5 rounded-xl border border-white/10">
            <button 
              onClick={() => setTheme('executive')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'executive' ? 'bg-gradient-to-r from-yellow-600 to-amber-700 text-white shadow-lg shadow-yellow-500/50' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Executive Black & Gold"
            >
              💎
            </button>
            <button 
              onClick={() => setTheme('classic')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'classic' ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg shadow-green-500/50' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Classic Green Table"
            >
              🎲
            </button>
            <button 
              onClick={() => setTheme('light')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'light' ? 'bg-gradient-to-r from-blue-500 to-sky-600 text-white shadow-lg shadow-blue-500/50' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Light Mode"
            >
              ☀️
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-gradient-to-r from-slate-700 to-gray-800 text-white shadow-lg shadow-slate-500/50' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Dark Mode"
            >
              🌙
            </button>
          </div>
          {!walletConnected ? (
            <div className="flex items-center gap-3">
              <button 
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/50 transition-all hover:scale-105" 
                onClick={connectWallet}
              >
                🔗 CONNECT WALLET
              </button>
              <button 
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/50 transition-all hover:scale-105" 
                onClick={startDemoMode}
              >
                🎮 DEMO MODE
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Wallet Address */}
              <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-cyan-400/40">
                <span className="text-cyan-400 font-mono text-sm font-bold">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </div>
              
              {/* Balance */}
              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-sm px-5 py-2 rounded-xl border border-amber-400/40">
                <span className="text-amber-400 font-bold text-lg">{balance.toLocaleString()}</span>
                <span className="text-amber-300/60 text-xs ml-1.5 font-semibold">SHIDO</span>
              </div>
              
              {/* House Rake */}
              {totalRakeCollected > 0 && (
                <div className="bg-green-500/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-green-400/30">
                  <span className="text-green-400 font-mono text-xs font-semibold">Rake: {totalRakeCollected.toLocaleString()}</span>
                </div>
              )}
              
              {/* Action Buttons */}
              <button 
                className="px-5 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-black rounded-xl shadow-lg shadow-yellow-600/40 transition-all hover:scale-105 text-sm" 
                onClick={() => setShowLeaderboard(true)}
                title="View Leaderboard"
              >
                🏆
              </button>
              <button 
                className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-600/40 transition-all hover:scale-105 text-sm" 
                onClick={() => setShowDepositModal(true)}
              >
                💰 DEPOSIT
              </button>
              <button 
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/40 transition-all hover:scale-105 text-sm" 
                onClick={disconnectWallet}
              >
                ⏏️ DISCONNECT
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Padded to account for fixed header */}
      <main className="flex-grow flex flex-col pt-24 pb-3 px-4 min-h-0 gap-3">
        {showLobby ? (
          <div className="flex items-center justify-center w-full h-full">
            <Lobby onSitDown={handleSitDown} />
          </div>
        ) : (
          <>
            {/* Main Layout: Table on left, Actions + Players on right (wider) */}
            <div className="flex gap-3 flex-1 min-h-0">
              {/* Left Side: Table (full height) */}
              <div className="flex-1 min-w-0 relative">
                {/* Game Message Overlay on Table */}
                {gameMessage && (
                  <div className="absolute top-4 right-4 bg-brand-surface/95 backdrop-blur-sm px-6 py-3 rounded-lg shadow-xl border border-brand-secondary z-50 animate-slide-in max-w-md">
                    <div className="text-brand-text font-medium">{gameMessage}</div>
                  </div>
                )}
                
                {useRealisticTable ? (
                  <RealisticTable
                    players={players}
                    communityCards={communityCards}
                    pot={pot}
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
                  />
                ) : (
                  <Table
                    players={players}
                    communityCards={communityCards}
                    pot={pot}
                    currentPlayer={currentPlayer}
                    mySeat={seatNumber}
                    myCards={demoMode ? myCards : (gameState?.players.find((p: any) => p.seat === seatNumber)?.hand || [])}
                    opponentCards={demoMode && demoGame ? demoGame.getState().opponentCards : []}
                    showOpponentCards={demoMode && demoGame ? demoGame.getState().showOpponentCards : false}
                    playerAlias={playerAlias}
                    avatarIndex={avatarIndex}
                    myAvatar={avatarCategories[avatarCategory]?.[avatarIndex] || '🎮'}
                    timerState={timerState}
                    theme={theme}
                    revealedCards={revealedCards}
                    winPopups={winPopups}
                    onAction={handleAction}
                    onStandUp={handleStandUp}
                    onSitAtSeat={handleSitAtSeat}
                    onRequestTimeBank={handleRequestTimeBank}
                  />
                )}
              </div>
              
              {/* Right Side: Game Log (top) + Players List (bottom) - wider for better visibility */}
              <div className="w-80 flex flex-col gap-3">
                {/* Game Log Panel - fixed height to prevent overflow */}
                <div className="h-80 overflow-hidden">
                  <GameLog gameLog={gameLog} />
                </div>
                
                {/* Players List - scrollable */}
                <div className="flex-1 min-h-0">
                  <PlayersList players={players} walletAddress={walletAddress} />
                </div>
              </div>
            </div>
            
            {/* Bottom Row: Actions | Chat | Fairness + Winning Hands (all equal width, taller for action buttons) */}
            <div className="grid grid-cols-3 gap-3 h-80">
              <div className="overflow-hidden">
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
                  autoCall={autoCall}
                  onAutoFoldChange={setAutoFold}
                  onAutoCallChange={setAutoCall}
                />
              </div>
              <div className="overflow-hidden">
                <Chat messages={messages} onSendMessage={handleSendMessage} />
              </div>
              {/* Fairness + Winning Hands side by side */}
              <div className="grid grid-cols-2 gap-3 overflow-hidden">
                <div className="overflow-hidden">
                  <FairnessPane />
                </div>
                <div className="overflow-hidden">
                  <WinningHandsPanel recentHands={recentWinningHands} />
                </div>
              </div>
            </div>
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
          <div className="glass-card p-6 max-w-md w-full mx-4 border-2 border-brand-cyan shadow-glow-cyan">
            <h3 className="text-2xl font-bold text-brand-cyan mb-2">🎮 Choose Your Alias</h3>
            <p className="text-sm text-brand-text-dark mb-4">
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
                    className={`glass-card p-2 text-xs font-semibold uppercase hover:scale-105 transition-all duration-200 ${
                      avatarCategory === category 
                        ? 'ring-2 ring-brand-magenta shadow-glow-magenta bg-brand-magenta/20 text-brand-magenta' 
                        : 'hover:bg-brand-magenta/10 text-brand-text-dark'
                    }`}
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
                    className={`glass-card p-3 text-4xl hover:scale-110 transition-all duration-200 ${
                      avatarIndex === idx 
                        ? 'ring-2 ring-brand-cyan shadow-glow-cyan bg-brand-cyan/20' 
                        : 'hover:bg-brand-cyan/10'
                    }`}
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
                onClick={confirmSitDown}
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

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard 
          onClose={() => setShowLeaderboard(false)}
          currentPlayerStats={playerStats}
        />
      )}
    </div>
  );
}

export default App;
