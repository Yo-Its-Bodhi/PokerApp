// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "solmate/src/utils/SafeTransferLib.sol";
import "solmate/src/auth/Owned.sol";
import "solmate/src/security/ReentrancyGuard.sol";
import "./RakeVault.sol";

interface ITableEscrow {
    event Seated(uint8 indexed seat, address indexed player, uint256 amount);
    event ToppedUp(uint8 indexed seat, uint256 amount);
    event StoodUp(uint8 indexed seat, address indexed player);
    event HandSettled(uint256 indexed handId, bytes32 handHash, uint256 rake);
    event Paused(address account);
    event Unpaused(address account);
    event RakePaid(uint256 amount);

    function sitDown(uint8 seat, uint256 amount) external payable;
    function topUp(uint256 amount) external payable;
    function standUp() external;
    function settleHand(
        uint256 handId,
        bytes32 handHash,
        uint256[] calldata payouts,
        uint8[] calldata seats,
        uint256 rake,
        bytes calldata sigServer,
        bytes calldata sigAuditor
    ) external;
    function pause() external;
    function unpause() external;
}

contract TableEscrow is ITableEscrow, ReentrancyGuard, Owned {
    using SafeTransferLib for address;
    using SafeTransferLib for address payable;

    struct Seat {
        address player;
        uint256 stack;
        bool inHand;
    }

    // Table configuration
    uint256 public immutable minBuyIn;
    uint256 public immutable maxBuyIn;
    uint16 public immutable rakeBps;
    uint256 public immutable rakeCap;
    address public immutable feeRecipient;
    address public immutable serverSigner;
    address public immutable auditorSigner;

    // State
    Seat[6] public seats;
    uint256 public handId;
    bytes32 public lastHandHash;
    bool public paused;

    mapping(bytes32 => bool) public usedHandHashes;

    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Pausable: not paused");
        _;
    }
    
    modifier onlyPlayerInSeat() {
        bool isPlayer = false;
        for (uint8 i = 0; i < 6; i++) {
            if (seats[i].player == msg.sender) {
                isPlayer = true;
                break;
            }
        }
        require(isPlayer, "Not a seated player");
        _;
    }

    constructor(
        uint256 _minBuyIn,
        uint256 _maxBuyIn,
        uint16 _rakeBps,
        uint256 _rakeCap,
        address _feeRecipient,
        address _serverSigner,
        address _auditorSigner,
        address _owner
    ) Owned(_owner) {
        minBuyIn = _minBuyIn;
        maxBuyIn = _maxBuyIn;
rakeBps = _rakeBps;
        rakeCap = _rakeCap;
        feeRecipient = _feeRecipient;
        serverSigner = _serverSigner;
        auditorSigner = _auditorSigner;
    }

    function sitDown(uint8 seat, uint256 amount) external payable override whenNotPaused {
        require(seat < 6, "Invalid seat");
        require(seats[seat].player == address(0), "Seat taken");
        require(msg.value == amount, "Incorrect deposit amount");
        require(amount >= minBuyIn && amount <= maxBuyIn, "Invalid buy-in");

        seats[seat] = Seat(msg.sender, amount, false);
        emit Seated(seat, msg.sender, amount);
    }

    function topUp(uint256 amount) external payable override whenNotPaused onlyPlayerInSeat {
        require(msg.value == amount, "Incorrect deposit amount");
        for (uint8 i = 0; i < 6; i++) {
            if (seats[i].player == msg.sender) {
                uint256 newStack = seats[i].stack + amount;
                require(newStack <= maxBuyIn, "Exceeds max buy-in");
                seats[i].stack = newStack;
                emit ToppedUp(i, amount);
                return;
            }
        }
    }

    function standUp() external override onlyPlayerInSeat {
        for (uint8 i = 0; i < 6; i++) {
            if (seats[i].player == msg.sender) {
                require(!seats[i].inHand, "Cannot stand up while in a hand");
                uint256 balance = seats[i].stack;
                seats[i].player = address(0);
                seats[i].stack = 0;
                payable(msg.sender).safeTransfer(balance);
                emit StoodUp(i, msg.sender);
                return;
            }
        }
    }

    function emergencyWithdraw() external whenPaused {
        for (uint8 i = 0; i < 6; i++) {
            if (seats[i].player == msg.sender) {
                require(!seats[i].inHand, "Cannot withdraw while in a hand");
                uint256 balance = seats[i].stack;
                seats[i].player = address(0);
                seats[i].stack = 0;
                payable(msg.sender).safeTransfer(balance);
                emit StoodUp(i, msg.sender);
                return;
            }
        }
        revert("Player not seated or has funds in play");
    }

    function settleHand(
        uint256 _handId,
        bytes32 _handHash,
        uint256[] calldata payouts,
        uint8[] calldata payoutSeats,
        uint256 rake,
        bytes calldata sigServer,
        bytes calldata sigAuditor
    ) external override whenNotPaused nonReentrant {
        require(_handId == handId + 1, "Incorrect handId");
        require(!usedHandHashes[_handHash], "Hand hash already used");

        bytes32 messageHash = keccak256(abi.encodePacked(_handId, _handHash, payouts, payoutSeats, rake));
        address recoveredServer = recoverSigner(messageHash, sigServer);
        address recoveredAuditor = recoverSigner(messageHash, sigAuditor);

        require(recoveredServer == serverSigner, "Invalid server signature");
        require(recoveredAuditor == auditorSigner, "Invalid auditor signature");
        require(serverSigner != auditorSigner, "Signers must be different");

        uint256 totalPayouts;
        for (uint i = 0; i < payouts.length; i++) {
            uint8 seat = payoutSeats[i];
            require(seat < 6, "Invalid seat in payout");
            require(payouts[i] <= seats[seat].stack, "Payout exceeds stack");
            seats[seat].stack -= payouts[i];
            totalPayouts += payouts[i];
        }

        uint256 potSize = totalPayouts + rake;
        // Allow for 1 wei rounding differences
        require(potSize >= totalPayouts && potSize <= totalPayouts + 1, "Invalid pot calculation");
        require(rake <= rakeCap, "Rake exceeds cap");

        if (rake > 0) {
            payable(feeRecipient).safeTransfer(rake);
            emit RakePaid(rake);
        }

        handId = _handId;
        lastHandHash = _handHash;
        usedHandHashes[_handHash] = true;

        emit HandSettled(_handId, _handHash, rake);
    }

    function pause() external override onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external override onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function recoverSigner(bytes32 _hash, bytes calldata _signature) internal pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        return ecrecover(_hash, v, r, s);
    }

    function emergencyWithdraw(address payable to) external whenPaused {
        for (uint8 i = 0; i < 6; i++) {
            if (seats[i].player == to) {
                require(!seats[i].inHand, "Cannot withdraw while in a hand");
                uint256 balance = seats[i].stack;
                seats[i].player = address(0);
                seats[i].stack = 0;
                to.safeTransfer(balance);
                emit StoodUp(i, to);
                return;
            }
        }
        revert("Player not seated or has funds in play");
    }
}
