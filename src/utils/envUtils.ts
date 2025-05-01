/// <reference types="vite/client" />

/**
 * Get environment variable with fallback
 * @param key Environment variable key
 * @param fallback Fallback value if environment variable is not set
 * @returns The environment variable value or fallback
 */
export const getEnvVar = (key: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // For Vite applications
  if (typeof import.meta !== 'undefined' && 'env' in import.meta && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }

  // For browser environment using Vite
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key] as string;
  }

  return fallback;
};

/**
 * Get the RPC URL for the specified network type
 * @param networkType 'mainnet' or 'testnet'
 * @returns RPC URL
 */
export const getRpcUrl = (networkType: 'mainnet' | 'testnet'): string => {
  return networkType === 'mainnet'
    ? getEnvVar('VITE_MAINNET_RPC_URL', 'https://arb1.arbitrum.io/rpc')
    : getEnvVar('VITE_TESTNET_RPC_URL', 'https://sepolia-rollup.arbitrum.io/rpc');
};

/**
 * Get the chain ID for the specified network type
 * @param networkType 'mainnet' or 'testnet'
 * @returns Chain ID in hex format
 */
export const getChainId = (networkType: 'mainnet' | 'testnet'): string => {
  return networkType === 'mainnet'
    ? getEnvVar('VITE_MAINNET_CHAIN_ID', '0xa4b1') // Arbitrum One
    : getEnvVar('VITE_TESTNET_CHAIN_ID', '0x66eee'); // Arbitrum Sepolia
};

/**
 * Get the default network type from environment variables
 * @returns Default network type ('mainnet' or 'testnet')
 */
export const getDefaultNetwork = (): 'mainnet' | 'testnet' => {
  const defaultNetwork = getEnvVar('VITE_DEFAULT_NETWORK', 'testnet');
  return defaultNetwork === 'mainnet' ? 'mainnet' : 'testnet';
};

/**
 * Get the default stake amount from environment variables
 * @returns Default stake amount as string
 */
export const getDefaultStakeAmount = (): string => {
  return getEnvVar('VITE_DEFAULT_STAKE_AMOUNT', '0.01');
};

/**
 * Check if mock data should be used
 * @returns true if mock data should be used
 */
export const useMockData = (): boolean => {
  return getEnvVar('VITE_USE_MOCK_DATA', 'false').toLowerCase() === 'true';
};

/**
 * Check if demo mode is enabled
 * @returns true if demo mode is enabled
 */
export const isDemoMode = (): boolean => {
  return getEnvVar('VITE_DEMO_MODE', 'false').toLowerCase() === 'true';
};

// TypeScript declaration for window with __ENV__
declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
} 