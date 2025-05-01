import { getChecksumAddress } from './utils/addressUtils';
import { getEnvVar, getChainId, getRpcUrl } from './utils/envUtils';

// Network configurations
export const NETWORKS = {
  mainnet: {
    chainId: getChainId('mainnet'),
    name: 'Arbitrum One',
    rpcUrl: getRpcUrl('mainnet'),
    explorerUrl: 'https://arbiscan.io'
  },
  testnet: {
    chainId: getChainId('testnet'),
    name: 'Arbitrum Sepolia',
    rpcUrl: getRpcUrl('testnet'),
    explorerUrl: 'https://sepolia.arbiscan.io'
  }
};

// Contract addresses based on network
export const CONTRACT_ADDRESSES = {
  mainnet: {
    token: getChecksumAddress(
      getEnvVar('VITE_MAINNET_MOR_TOKEN_ADDRESS', '0x1c9491865a1de77c5b6e19d2e6a5f1d7a6f2b25f')
    ),
    builders: getChecksumAddress(
      getEnvVar('VITE_MAINNET_BUILDERS_CONTRACT_ADDRESS', '0xC0eD68f163d44B6e9985F0041fDf6f67c6BCFF3f')
    ),
    feeConfig: getChecksumAddress(
      getEnvVar('VITE_MAINNET_FEE_CONFIG_ADDRESS', '')
    ),
    treasury: getChecksumAddress(
      getEnvVar('VITE_MAINNET_BUILDERS_TREASURY_ADDRESS', '')
    )
  },
  testnet: {
    token: getChecksumAddress(
      getEnvVar('VITE_TESTNET_MOR_TOKEN_ADDRESS', '0x34a285A1B1C166420Df5b6630132542923B5b27E')
    ), // Arbitrum Sepolia Test MOR Token
    builders: getChecksumAddress(
      getEnvVar('VITE_TESTNET_BUILDERS_CONTRACT_ADDRESS', '0xF651907Bfc6A67eCAb3E448c6C8200cD13566baA')
    ), // Arbitrum Sepolia Builders Contract
    feeConfig: getChecksumAddress(
      getEnvVar('VITE_TESTNET_FEE_CONFIG_ADDRESS', '0xA961F1c0A03aA601a951cf84F93492aE620Bd82A')
    ),
    treasury: getChecksumAddress(
      getEnvVar('VITE_TESTNET_BUILDERS_TREASURY_ADDRESS', '0x4e766052bdEc519cDe88C732C08835Ca3bA33Daf')
    )
  }
};

// Network-specific subnet configurations
export const NETWORK_SUBNETS = {
  mainnet: [
    {
      id: getEnvVar('VITE_MAINNET_SUBNET_ID', '0x69357171d8794841df9985947a3c20c807b56d43'),
      name: "MOR API Access Subnet - Mainnet",
      description: "Official MOR subnet for API access on Arbitrum One",
      admin: "0x8F3b7156763717a99de1eBcB552f879fB5973c73",
      poolStart: {
        timestamp: 1743657004,
        date: new Date(1743657004 * 1000)
      },
      areDepositsLocked: false,
      areBuilderRewardsStaked: true,
      minimalDeposit: {
        formatted: "10"
      },
      active: true
    }
  ],
  testnet: [
    {
      id: getEnvVar('VITE_TESTNET_SUBNET_ID', '0xf827e8c0bff69fdcd1f130641f57cc4ada1f1a54f3c9133b14c58d99151a5e4c'),
      name: "TestPool_1743817095 (Test)",
      description: "Test pool for development and testing",
      admin: "0x8F3b7156763717a99de1eBcB552f879fB5973c73",
      poolStart: {
        timestamp: 1743817155,
        date: new Date(1743817155 * 1000)
      },
      areDepositsLocked: false,
      areBuilderRewardsStaked: false,
      minimalDeposit: {
        formatted: getEnvVar('VITE_DEFAULT_STAKE_AMOUNT', '0.01')
      },
      active: true
    }
  ]
}; 