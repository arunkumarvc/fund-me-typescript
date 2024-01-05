import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-solhint";
import "hardhat-contract-sizer";
import "dotenv/config";

// Ethereum and polygon mainnet RPC_URL
const ETHEREUM_MAINNET_RPC_URL = process.env.ETHEREUM_MAINNET_RPC_URL || "";
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL;

// Etherscan and Polygonscan testnet RPC_URL
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL;

// Etherscan, Polygonscan and CoinmarketCap API keys
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

// Private Key
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// Gas reporter
// const REPORT_GAS = process.env.REPORT_GAS || false;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",

  solidity: {
    compilers: [{ version: "0.6.12" }, { version: "0.8.20" }],
  },

  networks: {
    hardhat: {
      forking: {
        url: SEPOLIA_RPC_URL,
        blockNumber: 4490000,
      },
      chainId: 31337,
    },

    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337,
    },

    sepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    },

    mumbai: {
      url: MUMBAI_RPC_URL,
      chainId: 80001,
      accounts: [PRIVATE_KEY],
    },

    mainnet: {
      url: ETHEREUM_MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 1,
    },

    polygon: {
      url: POLYGON_MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 137,
    },
  },

  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
    },
  },

  gasReporter: {
    enabled: false,
    currency: "INR",
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "ETH",
    // outputFile: "gas-report.txt",
    // noColors: true,
  },
  contractSizer: {
    runOnCompile: false,
    only: ["FundMe"],
  },
  mocha: {
    timeout: 600000,
  },
};

export default config;
