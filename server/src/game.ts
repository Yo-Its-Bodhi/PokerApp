// server/src/game.ts

import { CommitRevealRNG } from './rng';
import { Rules, Action, Street, Pot, ActionType } from './rules';

export enum GameState {
    PRE_HAND,
    DEALING,
    BETTING,
    SHOWDOWN,
}

export class Player {
    public cards: number[] = [];
    public seat: number = -1;
    public isSeated: boolean = false;
    public folded: boolean = false;
    public allIn: boolean = false;
    
    constructor(
        public id: string, 
        public stack: number, 
        public inHand: boolean = true, 
        public bet: number = 0
    ) {}
}

export class Game {
    private rng: CommitRevealRNG;
    public state: GameState = GameState.PRE_HAND;
    public street: Street = Street.PREFLOP;
    public players: Player[] = [];
    public pots: Pot[] = [];
    public deck: number[] = [];
    public communityCards: number[] = [];
    public currentPlayerIndex: number = 0;
    public smallBlind: number = 2500;
    public bigBlind: number = 5000;
    public dealerPosition: number = 0;
    public seatedPlayers: Player[] = [];

    constructor() {
        this.rng = new CommitRevealRNG();
    }

    public addPlayer(player: Player) {
        this.players.push(player);
    }

    public removePlayer(player: Player) {
        this.players = this.players.filter(p => p.id !== player.id);
        this.seatedPlayers = this.seatedPlayers.filter(p => p.id !== player.id);
    }

    public sitPlayer(player: Player, seat: number) {
        if (this.seatedPlayers.find(p => p.seat === seat)) {
            throw new Error('Seat already occupied');
        }
        if (player.stack < this.bigBlind * 10) {
            throw new Error('Insufficient balance to sit');
        }

        player.seat = seat;
        player.isSeated = true;
        this.seatedPlayers.push(player);
        this.seatedPlayers.sort((a, b) => a.seat - b.seat);

        // Start hand if we have enough players
        if (this.seatedPlayers.length >= 2 && this.state === GameState.PRE_HAND) {
            setTimeout(() => this.startHand(), 1000);
        }
    }

    public startHand() {
        const activePlayers = this.seatedPlayers.filter(p => p.stack >= this.bigBlind);
        if (activePlayers.length < 2) return;

        this.state = GameState.DEALING;
        this.street = Street.PREFLOP;
        this.communityCards = [];
        this.pots = [];
        
        // Reset players
        this.seatedPlayers.forEach(p => {
            p.inHand = true;
            p.bet = 0;
            p.cards = [];
            p.folded = false;
            p.allIn = false;
        });

        // Shuffle deck
        this.deck = this.rng.getDeck(this.rng.getCombinedSeed());
        
        // Deal hole cards
        for (let i = 0; i < 2; i++) {
            this.seatedPlayers.forEach(player => {
                player.cards.push(this.deck.pop()!);
            });
        }

        // Post blinds
        this.postBlinds();
        
        // Start betting
        this.state = GameState.BETTING;
        this.currentPlayerIndex = this.getNextActivePlayer((this.dealerPosition + 3) % this.seatedPlayers.length);
    }

    private postBlinds() {
        const sbIndex = (this.dealerPosition + 1) % this.seatedPlayers.length;
        const bbIndex = (this.dealerPosition + 2) % this.seatedPlayers.length;

        const sbPlayer = this.seatedPlayers[sbIndex];
        const bbPlayer = this.seatedPlayers[bbIndex];

        sbPlayer.bet = Math.min(this.smallBlind, sbPlayer.stack);
        sbPlayer.stack -= sbPlayer.bet;

        bbPlayer.bet = Math.min(this.bigBlind, bbPlayer.stack);
        bbPlayer.stack -= bbPlayer.bet;
    }

    public applyAction(player: Player, action: Action) {
        if (!this.isPlayerTurn(player)) {
            throw new Error("Not your turn");
        }

        if (!Rules.isValidAction(action, this, player)) {
            throw new Error("Invalid action");
        }

        switch (action.type) {
            case ActionType.FOLD:
                player.folded = true;
                player.inHand = false;
                break;
                
            case ActionType.CHECK:
                // No additional logic needed
                break;
                
            case ActionType.CALL:
                const callAmount = this.getCallAmount(player);
                const actualCall = Math.min(callAmount, player.stack);
                player.bet += actualCall;
                player.stack -= actualCall;
                if (player.stack === 0) player.allIn = true;
                break;
                
            case ActionType.RAISE:
                const raiseAmount = action.amount || this.bigBlind;
                const callFirst = this.getCallAmount(player);
                const totalBet = callFirst + raiseAmount;
                const actualBet = Math.min(totalBet, player.stack);
                player.bet += actualBet;
                player.stack -= actualBet;
                if (player.stack === 0) player.allIn = true;
                break;
        }

        // Move to next player or next street
        this.advanceAction();
    }

    private isPlayerTurn(player: Player): boolean {
        return this.seatedPlayers[this.currentPlayerIndex]?.id === player.id;
    }

    private getCallAmount(player: Player): number {
        const maxBet = Math.max(...this.seatedPlayers.map(p => p.bet));
        return maxBet - player.bet;
    }

    private advanceAction() {
        if (this.isBettingRoundComplete()) {
            this.advanceStreet();
        } else {
            this.currentPlayerIndex = this.getNextActivePlayer(this.currentPlayerIndex);
        }
    }

    private isBettingRoundComplete(): boolean {
        const activePlayers = this.seatedPlayers.filter(p => p.inHand && !p.allIn);
        if (activePlayers.length <= 1) return true;

        const maxBet = Math.max(...this.seatedPlayers.map(p => p.bet));
        return activePlayers.every(p => p.bet === maxBet || p.folded);
    }

    private advanceStreet() {
        this.pots = Rules.calculatePots(this.seatedPlayers);
        
        // Reset bets for next street
        this.seatedPlayers.forEach(p => p.bet = 0);

        switch (this.street) {
            case Street.PREFLOP:
                this.street = Street.FLOP;
                this.communityCards.push(...this.deck.splice(-3));
                break;
            case Street.FLOP:
                this.street = Street.TURN;
                this.communityCards.push(this.deck.pop()!);
                break;
            case Street.TURN:
                this.street = Street.RIVER;
                this.communityCards.push(this.deck.pop()!);
                break;
            case Street.RIVER:
                this.showdown();
                return;
        }

        this.currentPlayerIndex = this.getNextActivePlayer(this.dealerPosition);
    }

    private showdown() {
        this.state = GameState.SHOWDOWN;
        // Hand evaluation and pot distribution would go here
        setTimeout(() => {
            this.dealerPosition = (this.dealerPosition + 1) % this.seatedPlayers.length;
            this.state = GameState.PRE_HAND;
            this.startHand();
        }, 5000);
    }

    private getNextActivePlayer(startIndex: number): number {
        for (let i = 1; i <= this.seatedPlayers.length; i++) {
            const index = (startIndex + i) % this.seatedPlayers.length;
            const player = this.seatedPlayers[index];
            if (player.inHand && !player.allIn && !player.folded) {
                return index;
            }
        }
        return startIndex;
    }

    public isHandComplete(): boolean {
        const activePlayers = this.seatedPlayers.filter(p => p.inHand && !p.folded);
        return activePlayers.length <= 1 || this.state === GameState.SHOWDOWN;
    }

    public getPublicState() {
        return {
            state: this.state,
            street: this.street,
            communityCards: this.communityCards,
            pot: this.pots.reduce((sum, pot) => sum + pot.amount, 0),
            players: this.seatedPlayers.map(p => ({
                id: p.id,
                seat: p.seat,
                stack: p.stack,
                bet: p.bet,
                inHand: p.inHand,
                folded: p.folded,
                allIn: p.allIn,
                cards: p.id // Only show own cards to player
            })),
            currentPlayer: this.currentPlayerIndex,
            smallBlind: this.smallBlind,
            bigBlind: this.bigBlind
        };
    }
}
