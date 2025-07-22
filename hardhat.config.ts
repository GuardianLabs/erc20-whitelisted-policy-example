import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-ignition-ethers';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-contract-sizer';
import { HardhatUserConfig } from 'hardhat/config';
import {
  developmentChainId,
  forkingConfig,
  getBasescanApiKey,
  getBlockchainNodeRpcUri,
  getDevelopmentNodeRpcUri,
  getMnemonic,
  getPolygonscanApiKey,
  isAutoMiningEnabled,
  miningInterval,
  NetworkName,
  REPORT_GAS,
} from './config-hardhat';
import { Config } from './config-hardhat/env-config-reader';

const MAX_ACCOUNT_NUMBER = 30;
const DEFAULT_BALANCE_PER_ADDRESS = '166000000000000000000';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.29',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'cancun',
    },
  },
  networks: {
    hardhat: {
      gasPrice: 'auto',
      allowUnlimitedContractSize: true,
      forking: forkingConfig(NetworkName.amoy).forkingConfig,
      accounts: {
        mnemonic: getMnemonic(),
        count: MAX_ACCOUNT_NUMBER,
        accountsBalance: DEFAULT_BALANCE_PER_ADDRESS,
      },
      chainId: forkingConfig(NetworkName.amoy).chainId,
      mining: {
        auto: isAutoMiningEnabled(),
        interval: miningInterval(),
      },
    },
    development: {
      url: getDevelopmentNodeRpcUri(),
      chainId: developmentChainId(),
    },
    [NetworkName.amoy]: {
      chainId: 80002,
      accounts: {
        mnemonic: getMnemonic(),
        count: MAX_ACCOUNT_NUMBER,
      },
      url: getBlockchainNodeRpcUri(NetworkName.amoy),
    },
    [NetworkName.baseMainnet]: {
      chainId: 8453,
      accounts: {
        mnemonic: getMnemonic(),
        count: MAX_ACCOUNT_NUMBER,
      },
      url: getBlockchainNodeRpcUri(NetworkName.baseMainnet),
    },
    [NetworkName.baseSepolia]: {
      chainId: 84532,
      accounts: {
        mnemonic: getMnemonic(),
        count: MAX_ACCOUNT_NUMBER,
      },
      url: getBlockchainNodeRpcUri(NetworkName.baseSepolia),
    },
  },
  paths: {
    tests: 'test',
    sources: './contracts',
    artifacts: './artifacts',
    cache: './cache',
  },
  etherscan: {
    apiKey: {
      polygonMainnet: getPolygonscanApiKey(),
      polygonAmoy: getPolygonscanApiKey(),
      baseMainnet: getBasescanApiKey(),
      baseSepolia: getBasescanApiKey(),
    },
    customChains: [
      {
        network: NetworkName.baseSepolia,
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
    ],
  },
  typechain: {
    outDir: 'src/typechain',
    target: 'ethers-v6',
  },
  gasReporter: {
    enabled: Config.isSet(REPORT_GAS),
    currency: 'USD',
    showTimeSpent: true,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: true,
    runOnCompile: true,
    only: [':ERC20PolicyEnforced$'],
    strict: false,
  },
};

export default config;
