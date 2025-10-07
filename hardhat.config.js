require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    shido: {
      url: "https://rpc-testnet-evm.shido.io", // Example RPC URL for Shido Testnet
      chainId: 9008, // Example Chain ID for Shido Testnet
      accounts: [], // Add private keys here
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
