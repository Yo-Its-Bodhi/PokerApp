import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { TableEscrow, RakeVault, TableFactory } from "../typechain-types";

describe("TableEscrow", function () {
    let tableFactory: TableFactory;
    let tableEscrow: TableEscrow;
    let rakeVault: RakeVault;
    let owner: SignerWithAddress;
    let serverSigner: SignerWithAddress;
    let auditorSigner: SignerWithAddress;
    let player1: SignerWithAddress;
    let player2: SignerWithAddress;
    let treasury: SignerWithAddress;

    const minBuyIn = ethers.parseEther("50");
    const maxBuyIn = ethers.parseEther("200");
    const rakeBps = 500; // 5%
    const rakeCap = ethers.parseEther("3");

    beforeEach(async function () {
        [owner, serverSigner, auditorSigner, player1, player2, treasury] = await ethers.getSigners();

        const RakeVaultFactory = await ethers.getContractFactory("RakeVault");
        rakeVault = await RakeVaultFactory.deploy(treasury.address);
        
        const TableFactoryFactory = await ethers.getContractFactory("TableFactory");
        tableFactory = await TableFactoryFactory.deploy();
        
        await tableFactory.connect(owner).createTable(
            minBuyIn,
            maxBuyIn,
            rakeBps,
            rakeCap,
            await rakeVault.getAddress(),
            serverSigner.address,
            auditorSigner.address
        );

        const tableAddress = await tableFactory.tables(0);
        tableEscrow = await ethers.getContractAt("TableEscrow", tableAddress);
    });

    describe("Player Actions", function () {
        it("Should allow a player to sit down", async function () {
            await expect(tableEscrow.connect(player1).sitDown(0, minBuyIn, { value: minBuyIn }))
                .to.emit(tableEscrow, "Seated")
                .withArgs(0, player1.address, minBuyIn);
            
            const seat = await tableEscrow.seats(0);
            expect(seat.player).to.equal(player1.address);
            expect(seat.stack).to.equal(minBuyIn);
        });

        it("Should allow a player to stand up", async function () {
            await tableEscrow.connect(player1).sitDown(0, minBuyIn, { value: minBuyIn });
            await expect(tableEscrow.connect(player1).standUp())
                .to.emit(tableEscrow, "StoodUp");
            
            const seat = await tableEscrow.seats(0);
            expect(seat.player).to.equal(ethers.ZeroAddress);
        });
    });

    describe("Settlement", function () {
        it("Should settle a hand with valid signatures", async function () {
            await tableEscrow.connect(player1).sitDown(0, minBuyIn, { value: minBuyIn });
            await tableEscrow.connect(player2).sitDown(1, minBuyIn, { value: minBuyIn });

            const handId = 1;
            const handHash = ethers.keccak256(ethers.toUtf8Bytes("hand1"));
            const payouts = [ethers.parseEther("10")];
            const seats = [0];
            const rake = ethers.parseEther("1");

            const messageHash = ethers.keccak256(
                ethers.solidityPacked(
                    ["uint256", "bytes32", "uint256[]", "uint8[]", "uint256"],
                    [handId, handHash, payouts, seats, rake]
                )
            );
            
            const serverSig = await serverSigner.signMessage(ethers.getBytes(messageHash));
            const auditorSig = await auditorSigner.signMessage(ethers.getBytes(messageHash));

            await expect(tableEscrow.settleHand(handId, handHash, payouts, seats, rake, serverSig, auditorSig))
                .to.emit(tableEscrow, "HandSettled");
        });
    });
});
