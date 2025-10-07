// indexer/src/parity.ts

import { ethers } from 'ethers';

export class ParityMonitor {

    public async checkParity(tableAddress: string, handId: number) {
        // 1. Fetch on-chain state from the TableEscrow contract
        // 2. Recompute off-chain state from hand transcript
        // 3. Compare and alert if there is a drift

        console.log(`Parity check for hand ${handId} on table ${tableAddress}`);
    }
}
