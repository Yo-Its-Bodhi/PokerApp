// indexer/src/indexer.ts

import { ethers } from 'ethers';
import { TableEscrow } from '../artifacts/contracts/TableEscrow.sol/TableEscrow.json';

export class Indexer {
    private provider: ethers.JsonRpcProvider;
    private tableContracts: Map<string, ethers.Contract> = new Map();

    constructor(rpcUrl: string) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    public async addTable(tableAddress: string) {
        const contract = new ethers.Contract(tableAddress, TableEscrow.abi, this.provider);
        this.tableContracts.set(tableAddress, contract);
        this.listenToEvents(contract);
    }

    private listenToEvents(contract: ethers.Contract) {
        contract.on('Seated', (seat, player, amount) => {
            console.log(`Seat ${seat} taken by ${player} with ${ethers.formatEther(amount)} SHIDO`);
            // Update materialized view
        });

        contract.on('ToppedUp', (seat, amount) => {
            console.log(`Seat ${seat} topped up with ${ethers.formatEther(amount)} SHIDO`);
            // Update materialized view
        });

        contract.on('StoodUp', (seat, player) => {
            console.log(`Player ${player} stood up from seat ${seat}`);
            // Update materialized view
        });

        contract.on('HandSettled', (handId, handHash, rake) => {
            console.log(`Hand ${handId} settled. Rake: ${ethers.formatEther(rake)} SHIDO`);
            // Update materialized view & trigger parity check
        });
    }
}
