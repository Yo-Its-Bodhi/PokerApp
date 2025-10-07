// server/src/rules.ts

import { Player } from "./game";

export enum ActionType {
    FOLD,
    CHECK,
    CALL,
    RAISE,
    ALL_IN
}

export interface Action {
    type: ActionType;
    amount?: number;
}

export enum Street {
    PREFLOP,
    FLOP,
    TURN,
    RIVER
}

export class Hand {
    // Hand evaluation logic will go here
}

export class Pot {
    public amount: number = 0;
    public eligiblePlayers: string[] = [];
}

export class Rules {
    public static isValidAction(action: Action, state: any, player?: Player): boolean {
        // Basic validation logic
        if (!player || !player.inHand || player.folded) return false;
        
        switch (action.type) {
            case ActionType.FOLD:
                return true;
            case ActionType.CHECK:
                // Can check if no bet to call
                return true; // Simplified for now
            case ActionType.CALL:
                return player.stack > 0;
            case ActionType.RAISE:
                return player.stack > 0 && (action.amount || 0) > 0;
            case ActionType.ALL_IN:
                return player.stack > 0;
            default:
                return false;
        }
    }

    public static calculateRake(pot: number, rakeBps: number, rakeCap: number): number {
        const rake = Math.floor((pot * rakeBps) / 10000);
        return Math.min(rake, rakeCap);
    }

    public static calculatePots(players: Player[]): Pot[] {
        const pots: Pot[] = [];
        const allInPlayers = players.filter(p => p.inHand && p.stack === 0).sort((a, b) => (a.bet || 0) - (b.bet || 0));
        const activePlayers = players.filter(p => p.inHand);

        if (activePlayers.length <= 1) {
            return pots;
        }

        let lastBet = 0;
        for (const player of allInPlayers) {
            const playerBet = player.bet || 0;
            const potAmount = (playerBet - lastBet) * players.filter(p => (p.bet || 0) >= playerBet).length;
            if (potAmount > 0) {
                const newPot: Pot = {
                    amount: potAmount,
                    eligiblePlayers: players.filter(p => (p.bet || 0) >= playerBet).map(p => p.id)
                };
                pots.push(newPot);
                lastBet = playerBet;
            }
        }

        const mainPotAmount = players.reduce((sum, p) => {
            const playerBet = p.bet || 0;
            return sum + (playerBet > lastBet ? lastBet : playerBet)
        }, 0);
        
        const mainPotPlayers = activePlayers.map(p => p.id);

        const totalBet = players.reduce((sum, p) => sum + (p.bet || 0), 0);
        const remainingPot = totalBet - pots.reduce((sum, pot) => sum + pot.amount, 0);

        if (remainingPot > 0) {
            pots.push({
                amount: remainingPot,
                eligiblePlayers: activePlayers.filter(p => p.stack > 0).map(p => p.id)
            });
        }

        return pots;
    }
}
