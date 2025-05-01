import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { NETWORKS } from '../constants';

// Initialize Web3Modal
const providerOptions = {
  // Extended provider options can be added here
};

let web3Modal: Web3Modal;
// Initialize outside of component to avoid SSR issues
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: "arbitrum",
    cacheProvider: true,
    providerOptions,
    theme: "light"
  });
}

// Interface for the wallet context
interface WalletContextType {
  provider: ethers.providers.Provider | null;
  signer: ethers.Signer | null;
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  network: string | null;
  networkType: 'testnet' | 'mainnet';
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToNetwork: (networkType: 'testnet' | 'mainnet') => Promise<boolean>;
}

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  provider: null,
  signer: null,
  address: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  network: null,
  networkType: 'testnet',
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  switchToNetwork: async () => false,
});

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Props for the WalletProvider
interface WalletProviderProps {
  children: ReactNode;
  networkType?: 'testnet' | 'mainnet';
}

// Local storage key for remembering connection
const LOCAL_STORAGE_KEY = 'mor_staking_widget_connected';

export const WalletProvider: React.FC<WalletProviderProps> = ({ 
  children, 
  networkType = 'testnet' 
}) => {
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [currentNetworkType, setCurrentNetworkType] = useState<'testnet' | 'mainnet'>(networkType);
  const [web3Provider, setWeb3Provider] = useState<any>(null);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined') return;
      
      // Check if provider is cached
      if (web3Modal.cachedProvider) {
        connectWallet();
      }
    };
    
    checkConnection();
  }, []);
  
  // Update network when networkType prop changes
  useEffect(() => {
    if (isConnected && networkType !== currentNetworkType) {
      switchToNetwork(networkType);
    }
    setCurrentNetworkType(networkType);
  }, [networkType, isConnected]);

  // Setup event listeners for the provider
  const setupProviderEvents = (provider: any) => {
    if (!provider.on) {
      return;
    }

    // Remove any existing listeners first to prevent duplicates
    provider.removeListener("accountsChanged", handleAccountsChanged);
    provider.removeListener("chainChanged", handleChainChanged);
    provider.removeListener("disconnect", disconnectWallet);

    // Add listeners
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    provider.on("disconnect", disconnectWallet);
  };

  // Switch to a specific network
  const switchToNetwork = async (networkType: 'testnet' | 'mainnet'): Promise<boolean> => {
    if (!web3Provider) {
      console.error("No web3 provider found");
      return false;
    }
    
    try {
      const targetChainId = NETWORKS[networkType].chainId;
      
      // Check current chain
      const currentChainId = await web3Provider.request({ method: 'eth_chainId' });
      
      if (currentChainId !== targetChainId) {
        // Request chain switch
        try {
          await web3Provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError: any) {
          // Chain doesn't exist, add it
          if (switchError.code === 4902) {
            try {
              await web3Provider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: targetChainId,
                    chainName: NETWORKS[networkType].name,
                    rpcUrls: [NETWORKS[networkType].rpcUrl],
                    blockExplorerUrls: [NETWORKS[networkType].explorerUrl],
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    }
                  },
                ],
              });
            } catch (addError) {
              console.error('Error adding chain:', addError);
              return false;
            }
          } else {
            console.error('Error switching chain:', switchError);
            return false;
          }
        }
      }
      
      setCurrentNetworkType(networkType);
      
      // Refresh provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(web3Provider);
      const ethersSigner = ethersProvider.getSigner();
      
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      
      // Get the network
      const networkInfo = await ethersProvider.getNetwork();
      let chainName = networkInfo.name;
      
      // Handle special case for Arbitrum networks
      if (networkInfo.chainId === 421614) { // Arbitrum Sepolia
        chainName = 'Arbitrum Sepolia';
        setCurrentNetworkType('testnet');
      } else if (networkInfo.chainId === 42161) { // Arbitrum One
        chainName = 'Arbitrum One';
        setCurrentNetworkType('mainnet');
      }
      
      setNetwork(chainName);
      
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get provider from Web3Modal
      const instance = await web3Modal.connect();
      setWeb3Provider(instance);
      
      // Set up event listeners
      setupProviderEvents(instance);
      
      // Create ethers provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(instance);
      const ethersSigner = ethersProvider.getSigner();
      const userAddress = await ethersSigner.getAddress();
      
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setAddress(userAddress);
      
      // Get network info
      const networkInfo = await ethersProvider.getNetwork();
      let chainName = networkInfo.name;
      
      // Handle special case for Arbitrum networks
      if (networkInfo.chainId === 421614) { // Arbitrum Sepolia
        chainName = 'Arbitrum Sepolia';
        setCurrentNetworkType('testnet');
      } else if (networkInfo.chainId === 42161) { // Arbitrum One
        chainName = 'Arbitrum One';
        setCurrentNetworkType('mainnet');
      } else {
        // If not on an Arbitrum network, try to switch
        await switchToNetwork(networkType);
      }
      
      setNetwork(chainName);
      setIsConnected(true);
      
      // Save connection state in local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
      }
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      if (web3Modal) {
        web3Modal.clearCachedProvider();
      }
      
      // Reset state
      setProvider(null);
      setSigner(null);
      setAddress(null);
      setIsConnected(false);
      setNetwork(null);
      setWeb3Provider(null);
      
      // Remove from local storage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Handle account changes from wallet
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      await disconnectWallet();
    } else {
      // Account changed, update the signer
      if (provider) {
        const ethersProvider = provider as ethers.providers.Web3Provider;
        const ethersSigner = ethersProvider.getSigner();
        const newAddress = await ethersSigner.getAddress();
        
        setSigner(ethersSigner);
        setAddress(newAddress);
      }
    }
  };

  // Handle chain changes from wallet
  const handleChainChanged = async (_chainId: string) => {
    window.location.reload();
  };

  return (
    <WalletContext.Provider value={{
      provider,
      signer,
      address,
      isConnected,
      isConnecting,
      error,
      network,
      networkType: currentNetworkType,
      connectWallet,
      disconnectWallet,
      switchToNetwork
    }}>
      {children}
    </WalletContext.Provider>
  );
}; 