/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAINNET_RPC_URL: string;
  readonly VITE_TESTNET_RPC_URL: string;
  readonly VITE_MAINNET_CHAIN_ID: string;
  readonly VITE_TESTNET_CHAIN_ID: string;
  readonly VITE_MAINNET_MOR_TOKEN_ADDRESS: string;
  readonly VITE_MAINNET_BUILDERS_CONTRACT_ADDRESS: string;
  readonly VITE_MAINNET_FEE_CONFIG_ADDRESS: string;
  readonly VITE_MAINNET_BUILDERS_TREASURY_ADDRESS: string;
  readonly VITE_TESTNET_MOR_TOKEN_ADDRESS: string;
  readonly VITE_TESTNET_BUILDERS_CONTRACT_ADDRESS: string;
  readonly VITE_TESTNET_FEE_CONFIG_ADDRESS: string;
  readonly VITE_TESTNET_BUILDERS_TREASURY_ADDRESS: string;
  readonly VITE_MAINNET_SUBNET_ID: string;
  readonly VITE_TESTNET_SUBNET_ID: string;
  readonly VITE_DEFAULT_NETWORK: string;
  readonly VITE_DEFAULT_STAKE_AMOUNT: string;
  readonly VITE_USE_MOCK_DATA: string;
  readonly VITE_DEMO_MODE: string;
  // more env variables...
  readonly [key: string]: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 