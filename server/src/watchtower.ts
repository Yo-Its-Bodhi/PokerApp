// server/src/watchtower.ts

import { ethers } from 'ethers';

export class Watchtower {
    private auditorSigner: ethers.Wallet;

    constructor(auditorKey: string) {
        this.auditorSigner = new ethers.Wallet(auditorKey);
    }

    public async validateAndSign(handData: any): Promise<string> {
        // Re-validate hand data
        const handHash = this.calculateHandHash(handData);
        
        // Co-sign with auditorSigner
        const signature = await this.auditorSigner.signMessage(ethers.getBytes(handHash));
        return signature;
    }

    private calculateHandHash(handData: any): string {
        // Calculate the same hand hash as the server
        const packedData = ethers.solidityPacked(
            ["uint256", "bytes32", "uint256[]", "uint256"],
            [handData.handId, handData.handHash, handData.payouts, handData.rake]
        );
        return ethers.keccak256(packedData);
    }
}
