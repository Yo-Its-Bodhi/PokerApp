// server/src/server.ts

import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import { Game, Player } from './game';
import { ActionType } from './rules';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "http://localhost:5176",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Game instances (one per table)
const games = new Map<string, Game>();
const players = new Map<string, { socket: any, gameId: string, player: Player }>();

// IP-based wallet tracking
// Maps IP address -> Set of wallet addresses
const ipToWallets = new Map<string, Set<string>>();
// Maps wallet address -> IP address
const walletToIp = new Map<string, string>();
// Configuration: enforce one wallet per IP
const ENFORCE_ONE_WALLET_PER_IP = true;

// Create a default game
const defaultGameId = 'table-1';
games.set(defaultGameId, new Game());

io.on('connection', (socket) => {
  console.log('🔗 Player connected:', socket.id);

  // Join game
  socket.on('join-game', (data: { walletAddress: string, balance: number }) => {
    console.log('🎮 Player joining game:', socket.id, data);
    
    const game = games.get(defaultGameId);
    if (!game) {
      console.log('❌ No game found with ID:', defaultGameId);
      return;
    }

    // Get client IP address
    const clientIp = socket.handshake.headers['x-forwarded-for'] || 
                     socket.handshake.address || 
                     socket.conn.remoteAddress || 
                     'unknown';
    const ipAddress = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim();

    console.log('📍 Player IP:', ipAddress, 'Wallet:', data.walletAddress);

    // Check if this IP already has a different wallet registered
    if (ENFORCE_ONE_WALLET_PER_IP) {
      const existingWallets = ipToWallets.get(ipAddress);
      if (existingWallets && existingWallets.size > 0) {
        // Check if trying to use a different wallet from this IP
        if (!existingWallets.has(data.walletAddress)) {
          console.log('❌ IP already has a wallet registered:', Array.from(existingWallets));
          socket.emit('error', { 
            message: 'Only one wallet per IP address is allowed. Please use your previously registered wallet.',
            code: 'WALLET_IP_LIMIT'
          });
          return;
        }
      }
    }

    // Register wallet-IP mapping
    if (!ipToWallets.has(ipAddress)) {
      ipToWallets.set(ipAddress, new Set());
    }
    ipToWallets.get(ipAddress)!.add(data.walletAddress);
    walletToIp.set(data.walletAddress, ipAddress);

    const player = new Player(socket.id, data.balance);
    game.addPlayer(player);
    
    players.set(socket.id, {
      socket,
      gameId: defaultGameId,
      player
    });

    socket.join(defaultGameId);
    
    // Send game state to player
    const gameState = game.getPublicState();
    console.log('📤 Sending game state to player:', gameState);
    socket.emit('game-state', gameState);
    socket.emit('player-joined', { playerId: socket.id, balance: data.balance });
    
    // Notify others
    socket.to(defaultGameId).emit('player-joined', { 
      playerId: socket.id, 
      balance: data.balance 
    });
  });

  // Sit down at table
  socket.on('sit-down', (data: { seat: number }) => {
    console.log(`Player ${socket.id} attempting to sit at seat ${data.seat}`);
    
    const playerData = players.get(socket.id);
    if (!playerData) {
      console.log('Player data not found for:', socket.id);
      return;
    }

    const game = games.get(playerData.gameId);
    if (!game) {
      console.log('Game not found for:', playerData.gameId);
      return;
    }

    try {
      console.log('Calling game.sitPlayer with:', { playerId: playerData.player.id, seat: data.seat });
      game.sitPlayer(playerData.player, data.seat);
      
      console.log('Player successfully sat, emitting events');
      io.to(playerData.gameId).emit('player-sat', {
        playerId: socket.id,
        seat: data.seat
      });
      
      const gameState = game.getPublicState();
      console.log('Game state after sitting:', gameState);
      io.to(playerData.gameId).emit('game-state', gameState);
    } catch (error) {
      console.error('Error sitting player:', error);
      socket.emit('error', { message: (error as Error).message });
    }
  });

  // Player action
  socket.on('player-action', (data: { action: ActionType, amount?: number }) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const game = games.get(playerData.gameId);
    if (!game) return;

    try {
      game.applyAction(playerData.player, {
        type: data.action,
        amount: data.amount
      });

      // Broadcast game state to all players
      io.to(playerData.gameId).emit('game-state', game.getPublicState());
      
      // Check if hand is complete
      if (game.isHandComplete()) {
        setTimeout(() => {
          game.startHand();
          io.to(playerData.gameId).emit('game-state', game.getPublicState());
        }, 3000);
      }
    } catch (error) {
      socket.emit('error', { message: (error as Error).message });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const playerData = players.get(socket.id);
    if (playerData) {
      const game = games.get(playerData.gameId);
      if (game) {
        game.removePlayer(playerData.player);
        io.to(playerData.gameId).emit('player-left', { playerId: socket.id });
        io.to(playerData.gameId).emit('game-state', game.getPublicState());
      }
      players.delete(socket.id);
    }
    
    // Note: We don't remove IP-wallet mappings on disconnect to maintain the restriction
    // If you want to allow re-registration, uncomment the cleanup below:
    /*
    const clientIp = socket.handshake.headers['x-forwarded-for'] || 
                     socket.handshake.address || 
                     socket.conn.remoteAddress || 
                     'unknown';
    const ipAddress = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim();
    
    // Find and remove wallet associated with this connection
    const walletsAtIp = ipToWallets.get(ipAddress);
    if (walletsAtIp) {
      // We don't know which wallet this socket was using, so we keep the mapping
      // To properly clean up, you'd need to track socket.id -> wallet mapping
    }
    */
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎰 Poker server running on port ${PORT}`);
});
