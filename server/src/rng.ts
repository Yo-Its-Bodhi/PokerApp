// server/src/rng.ts

import { createHash } from 'crypto';
import { randomBytes } from 'crypto';

export interface Commit {
    player: string;
    commit: string;
}

export interface Reveal {
    player: string;
    seed: string;
    salt: string;
}

export class CommitRevealRNG {
    private commits: Map<string, string> = new Map();
    private reveals: Map<string, { seed: string; salt: string }> = new Map();

    public generateCommit(player: string, tableId: string, handId: number): { commit: string; seed: string; salt: string } {
        const seed = `0x${randomBytes(32).toString('hex')}`;
        const salt = `0x${randomBytes(32).toString('hex')}`;
        const commit = '0x' + createHash('sha256').update(seed + salt + tableId + handId.toString()).digest('hex');
        this.commits.set(player, commit);
        return { commit, seed, salt };
    }

    public storeCommit(player: string, commit: string) {
        this.commits.set(player, commit);
    }

    public storeReveal(player: string, seed: string, salt: string, tableId: string, handId: number): boolean {
        const expectedCommit = '0x' + createHash('sha256').update(seed + salt + tableId + handId.toString()).digest('hex');
        if (this.commits.get(player) === expectedCommit) {
            this.reveals.set(player, { seed, salt });
            return true;
        }
        return false;
    }

    public getCombinedSeed(): string {
        const revealedSeeds = Array.from(this.reveals.values()).map(r => r.seed);
        if (revealedSeeds.length === 0) {
            throw new Error("No seeds revealed");
        }
        
        let combined = revealedSeeds[0];
        for (let i = 1; i < revealedSeeds.length; i++) {
            combined = '0x' + createHash('sha256').update(combined + revealedSeeds[i]).digest('hex');
        }
        return combined;
    }

    public getDeck(combinedSeed: string): number[] {
        const deck: number[] = Array.from({ length: 52 }, (_, i) => i);
        let seed = BigInt(combinedSeed);

        for (let i = deck.length - 1; i > 0; i--) {
            const j = Number(seed % BigInt(i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
            seed = BigInt('0x' + createHash('sha256').update(seed.toString()).digest('hex'));
        }

        return deck;
    }

    public clear() {
        this.commits.clear();
        this.reveals.clear();
    }
}
