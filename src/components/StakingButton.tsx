import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BuildersClient } from '../staking/BuildersClient';
import { useWallet } from '../context/WalletContext';
import { NETWORK_SUBNETS } from '../constants';

// Helper function for JSON stringification with BigInt
const jsonStringifyReplacer = (_: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Define component props
export interface StakingButtonProps {
  networkType?: 'mainnet' | 'testnet';
  amount?: string;
  subnetId?: string;
  buttonStyle?: React.CSSProperties;
  buttonClassName?: string;
  buttonText?: string;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'idle' | 'staking' | 'success' | 'error', message?: string) => void;
}

/**
 * StakingButton component for staking MOR tokens
 */
export const StakingButton: React.FC<StakingButtonProps> = ({
  networkType = 'testnet',
  amount = '0.01',
  subnetId,
  buttonStyle,
  buttonClassName = '',
  buttonText = 'Stake MOR',
  onSuccess,
  onError,
  onStatusChange
}) => {
  // Wallet context for connection
  const { provider, signer, isConnected, connectWallet, networkType: walletNetworkType, switchToNetwork } = useWallet();
  
  // Staking state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stakingAmount] = useState(amount);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [buildersClient, setBuildersClient] = useState<BuildersClient | null>(null);
  
  // Initialize builders client when wallet is connected
  useEffect(() => {
    const initClient = async () => {
      if (isConnected && provider && signer) {
        try {
          // Ensure network matches
          if (networkType !== walletNetworkType) {
            const switched = await switchToNetwork(networkType);
            if (!switched) {
              setError(`Please switch to ${networkType === 'testnet' ? 'Arbitrum Sepolia' : 'Arbitrum One'} network`);
              onStatusChange?.('error', `Please switch to ${networkType === 'testnet' ? 'Arbitrum Sepolia' : 'Arbitrum One'} network`);
              return;
            }
          }
          
          // Initialize builders client
          const client = new BuildersClient(provider, signer);
          setBuildersClient(client);
          
          // Set default pool if not specified
          if (!subnetId) {
            // Use first subnet from default list
            const pools = NETWORK_SUBNETS[networkType];
            if (pools && pools.length > 0) {
              setSelectedPool(pools[0].id);
            } else {
              setError(`No subnets available for ${networkType}`);
              onStatusChange?.('error', `No subnets available for ${networkType}`);
            }
          } else {
            setSelectedPool(subnetId);
          }
        } catch (err: any) {
          console.error('Error initializing builders client:', err);
          setError(err.message || 'Failed to initialize blockchain client');
          onStatusChange?.('error', err.message || 'Failed to initialize blockchain client');
        }
      }
    };
    
    initClient();
  }, [isConnected, provider, signer, networkType, walletNetworkType, subnetId, switchToNetwork, onStatusChange]);
  
  // Handle stake action
  const handleStake = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
        return; // Will trigger the useEffect to initialize the client
      } catch (err: any) {
        console.error('Connection error:', err);
        setError(err.message || 'Failed to connect wallet');
        onStatusChange?.('error', err.message || 'Failed to connect wallet');
        onError?.(err.message || 'Failed to connect wallet');
        return;
      }
    }
    
    if (!buildersClient || !selectedPool) {
      setError('Staking system not initialized');
      onStatusChange?.('error', 'Staking system not initialized');
      onError?.('Staking system not initialized');
      return;
    }
    
    setLoading(true);
    setError(null);
    onStatusChange?.('staking', `Staking ${stakingAmount} MOR...`);
    
    try {
      // Perform approval first
      console.log('Checking allowance...');
      const allowance = await buildersClient.getMorAllowance();
      const amountToStakeWei = ethers.utils.parseEther(stakingAmount);
      
      // Convert BigNumber to BigInt for comparison
      if (allowance < BigInt(amountToStakeWei.toString())) {
        onStatusChange?.('staking', 'Approving tokens...');
        const approveTx = await buildersClient.approveMorTokens(stakingAmount);
        await approveTx.wait();
        onStatusChange?.('staking', 'Tokens approved. Proceeding with staking...');
      }
      
      // Perform the stake
      const tx = await buildersClient.deposit(selectedPool, stakingAmount);
      onStatusChange?.('staking', 'Transaction submitted. Waiting for confirmation...');
      const receipt = await tx.wait();
      
      console.log('Staking successful:', JSON.stringify(receipt, jsonStringifyReplacer, 2));
      
      onStatusChange?.('success', `Successfully staked ${stakingAmount} MOR!`);
      onSuccess?.(receipt.transactionHash);
    } catch (err: any) {
      console.error("Staking error:", err);
      setError(err.message || 'Error staking MOR');
      onStatusChange?.('error', err.message || 'Error staking MOR');
      onError?.(err.message || 'Error staking MOR');
    } finally {
      setLoading(false);
    }
  };
  
  // Default button styles
  const defaultButtonStyle: React.CSSProperties = {
    backgroundColor: loading ? '#4a5568' : error ? '#e53e3e' : '#3b82f6',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: loading ? 'wait' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
    ...buttonStyle
  };
  
  // Default button classes
  const defaultButtonClass = `mor-staking-button ${buttonClassName}`;
  
  return (
    <button
      onClick={handleStake}
      disabled={loading}
      style={defaultButtonStyle}
      className={defaultButtonClass}
    >
      {loading ? (
        <>
          <span className="mr-2">Staking...</span>
          <span className="animate-spin">⟳</span>
        </>
      ) : (
        buttonText
      )}
    </button>
  );
}; 