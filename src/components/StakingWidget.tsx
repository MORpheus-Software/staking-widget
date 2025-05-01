import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BuildersClient } from '../staking/BuildersClient';
import { useWallet } from '../context/WalletContext';
import { NETWORK_SUBNETS } from '../constants';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

// Define component props
export interface StakingWidgetProps {
  networkType?: 'mainnet' | 'testnet';
  defaultAmount?: string;
  subnetId?: string;
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  showWalletInfo?: boolean;
  showBalances?: boolean;
  onSuccess?: (action: 'stake' | 'unstake', txHash: string) => void;
  onError?: (error: string) => void;
}

/**
 * StakingWidget component for staking and unstaking MOR tokens
 */
export const StakingWidget: React.FC<StakingWidgetProps> = ({
  networkType = 'testnet',
  defaultAmount = '0.01',
  subnetId,
  containerStyle,
  containerClassName = '',
  showWalletInfo = true,
  showBalances = true,
  onSuccess,
  onError
}) => {
  // Wallet context
  const { 
    provider, 
    signer, 
    address, 
    isConnected, 
    connectWallet, 
    disconnectWallet,
    networkType: walletNetworkType, 
    switchToNetwork 
  } = useWallet();
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amount, setAmount] = useState(defaultAmount);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [buildersClient, setBuildersClient] = useState<BuildersClient | null>(null);
  const [userBalance, setUserBalance] = useState('0');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [minStakeRequired, setMinStakeRequired] = useState('0');
  const [apiAccessEnabled, setApiAccessEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [action, setAction] = useState<'stake' | 'unstake'>('stake');
  
  // Selected subnet information
  const [selectedSubnet, setSelectedSubnet] = useState<any>(null);
  
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
              return;
            }
          }
          
          // Initialize builders client
          const client = new BuildersClient(provider, signer);
          setBuildersClient(client);
          
          // Set default pool if not specified
          let poolId = subnetId;
          if (!poolId) {
            // Use first subnet from default list
            const pools = NETWORK_SUBNETS[networkType];
            if (pools && pools.length > 0) {
              poolId = pools[0].id;
              // Find and set subnet info
              const subnet = pools.find(p => p.id === poolId);
              if (subnet) {
                setSelectedSubnet(subnet);
                setMinStakeRequired(subnet.minimalDeposit.formatted);
              }
            } else {
              setError(`No subnets available for ${networkType}`);
              return;
            }
          } else {
            // Find the subnet in the configured networks
            const pools = NETWORK_SUBNETS[networkType];
            const subnet = pools?.find(p => p.id === poolId);
            if (subnet) {
              setSelectedSubnet(subnet);
              setMinStakeRequired(subnet.minimalDeposit.formatted);
            } else {
              // Try to fetch subnet info from blockchain
              try {
                const poolInfo = await client.getPoolInfo(poolId);
                setSelectedSubnet({
                  id: poolId,
                  name: poolInfo.name,
                  description: 'MOR Staking Subnet',
                  admin: poolInfo.admin,
                  minimalDeposit: poolInfo.minimalDeposit,
                  active: true
                });
                setMinStakeRequired(poolInfo.minimalDeposit.formatted);
              } catch (error) {
                console.error('Error fetching subnet info:', error);
              }
            }
          }
          
          setSelectedPool(poolId);
          
          // Fetch user data
          await fetchUserData(client, poolId);
        } catch (err: any) {
          console.error('Error initializing builders client:', err);
          setError(err.message || 'Failed to initialize blockchain client');
        }
      }
    };
    
    initClient();
  }, [isConnected, provider, signer, networkType, walletNetworkType, subnetId, switchToNetwork]);
  
  // Fetch user data (balances)
  const fetchUserData = async (client?: BuildersClient, poolId?: string) => {
    const activeClient = client || buildersClient;
    const activePool = poolId || selectedPool;
    
    if (!activeClient || !activePool || !address) {
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      // Get MOR balance
      try {
        const morBalance = await activeClient.getMorBalance();
        setUserBalance(ethers.utils.formatEther(morBalance));
      } catch (balanceError) {
        console.error("Error fetching MOR balance:", balanceError);
      }
      
      // Get staked balance
      try {
        const userData = await activeClient.getUserData(address, activePool);
        setStakedBalance(userData.deposited.formatted);
        
        if (minStakeRequired) {
          setApiAccessEnabled(parseFloat(userData.deposited.formatted) >= parseFloat(minStakeRequired));
        }
      } catch (userDataError: any) {
        console.error("Error fetching user data:", userDataError);
        setStakedBalance('0');
        setApiAccessEnabled(false);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle stake action
  const handleStake = async () => {
    await performAction('stake');
  };
  
  // Handle unstake action
  const handleUnstake = async () => {
    await performAction('unstake');
  };
  
  // Common function for stake and unstake actions
  const performAction = async (actionType: 'stake' | 'unstake') => {
    setError(null);
    setSuccess(null);
    
    if (!isConnected) {
      try {
        await connectWallet();
        return; // Will trigger the useEffect to initialize the client
      } catch (err: any) {
        console.error('Connection error:', err);
        setError(err.message || 'Failed to connect wallet');
        onError?.(err.message || 'Failed to connect wallet');
        return;
      }
    }
    
    if (!buildersClient || !selectedPool) {
      setError('Staking system not initialized');
      onError?.('Staking system not initialized');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError(`Please enter an amount to ${actionType}`);
      onError?.(`Please enter an amount to ${actionType}`);
      return;
    }
    
    setLoading(true);
    
    try {
      if (actionType === 'stake') {
        // Perform approval first for staking
        const allowance = await buildersClient.getMorAllowance();
        const amountWei = ethers.utils.parseEther(amount);
        
        if (allowance < BigInt(amountWei.toString())) {
          setSuccess('Approving tokens...');
          const approveTx = await buildersClient.approveMorTokens(amount);
          await approveTx.wait();
          setSuccess('Tokens approved. Proceeding with staking...');
        }
        
        // Perform the stake
        const tx = await buildersClient.deposit(selectedPool, amount);
        setSuccess('Transaction submitted. Waiting for confirmation...');
        const receipt = await tx.wait();
        
        setSuccess(`Successfully staked ${amount} MOR!`);
        onSuccess?.('stake', receipt.transactionHash);
      } else {
        // Unstake logic
        const tx = await buildersClient.withdraw(selectedPool, amount);
        setSuccess('Transaction submitted. Waiting for confirmation...');
        const receipt = await tx.wait();
        
        setSuccess(`Successfully unstaked ${amount} MOR!`);
        onSuccess?.('unstake', receipt.transactionHash);
      }
      
      // Refresh user data
      await fetchUserData();
      
      // Reset amount field
      setAmount('');
    } catch (err: any) {
      console.error(`${actionType} error:`, err);
      setError(err.message || `Error during ${actionType} operation`);
      onError?.(err.message || `Error during ${actionType} operation`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchUserData();
    }
  };
  
  // Set max amount based on action
  const handleSetMax = () => {
    if (action === 'stake') {
      setAmount(userBalance);
    } else {
      setAmount(stakedBalance);
    }
  };
  
  // Calculate progress percentage toward minimum stake
  const progressPercentage = () => {
    if (!minStakeRequired || parseFloat(minStakeRequired) === 0) {
      return 0;
    }
    
    const percent = (parseFloat(stakedBalance) / parseFloat(minStakeRequired)) * 100;
    return Math.min(Math.max(percent, 0), 100);
  };
  
  // Container default styles
  const defaultContainerStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '500px',
    margin: '0 auto',
    ...containerStyle
  };
  
  return (
    <div 
      className={`mor-staking-widget ${containerClassName}`}
      style={defaultContainerStyle}
    >
      {!isConnected ? (
        <div style={{ 
          borderRadius: '8px', 
          padding: '16px',
          backgroundColor: '#edf2f7' 
        }}>
          <p style={{ marginBottom: '16px' }}>Please connect your wallet to stake/unstake MOR tokens.</p>
          <button
            onClick={connectWallet}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Wallet Info Section */}
          {showWalletInfo && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ color: '#4b5563', fontWeight: 'bold' }}>Network:</span>
                <span style={{ marginLeft: '8px' }}>
                  {networkType === 'testnet' ? 'Arbitrum Sepolia' : 'Arbitrum One'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {address && (
                  <div style={{ marginRight: '12px', fontSize: '14px', color: '#4b5563' }}>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                )}
                
                <button
                  onClick={disconnectWallet}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
          
          {/* Subnet Info */}
          {selectedSubnet && (
            <div style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                {selectedSubnet.name}
              </h3>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Min. Stake:</span> {minStakeRequired} MOR
                </div>
                {selectedSubnet.description && (
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>Description:</span> {selectedSubnet.description}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Balances Section */}
          {showBalances && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ margin: '0', fontSize: '16px' }}>Your MOR Balance</h4>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{
                      backgroundColor: '#e5e7eb',
                      color: '#4b5563',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: isRefreshing ? 'wait' : 'pointer'
                    }}
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                <p style={{ fontSize: '20px', margin: '0' }}>{userBalance} MOR</p>
              </div>
              
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ margin: '0', fontSize: '16px' }}>Your Staked MOR</h4>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{
                      backgroundColor: '#e5e7eb',
                      color: '#4b5563',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: isRefreshing ? 'wait' : 'pointer'
                    }}
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                <p style={{ fontSize: '20px', margin: '0 0 8px 0' }}>{stakedBalance} MOR</p>
                <div style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 8px 0' }}>
                  Minimum Required: {minStakeRequired} MOR
                </div>
                
                {/* Progress bar */}
                <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px' }}>
                  <div 
                    style={{ 
                      width: `${progressPercentage()}%`, 
                      backgroundColor: progressPercentage() >= 100 ? '#10b981' : '#3b82f6',
                      borderRadius: '9999px',
                      height: '8px'
                    }}
                  ></div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: '4px',
                  fontSize: '12px'
                }}>
                  <span style={{ color: '#6b7280' }}>{progressPercentage().toFixed(0)}% complete</span>
                  {apiAccessEnabled && (
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>API Access Enabled</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Stake/Unstake Controls */}
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
              Stake/Unstake MOR
            </h3>
            
            {/* Action selector */}
            <div style={{ 
              display: 'flex', 
              marginBottom: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '4px'
            }}>
              <button
                onClick={() => setAction('stake')}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: action === 'stake' ? '#3b82f6' : 'transparent',
                  color: action === 'stake' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Stake
              </button>
              <button
                onClick={() => setAction('unstake')}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: action === 'unstake' ? '#3b82f6' : 'transparent',
                  color: action === 'unstake' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Unstake
              </button>
            </div>
            
            {/* Amount input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#374151'
              }}>
                Amount
              </label>
              <div style={{ display: 'flex' }}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                  placeholder="Enter MOR amount"
                />
                <button
                  onClick={handleSetMax}
                  style={{
                    marginLeft: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#e5e7eb',
                    color: '#4b5563',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Max
                </button>
              </div>
            </div>
            
            {/* Action button */}
            <button
              onClick={action === 'stake' ? handleStake : handleUnstake}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#6b7280' : action === 'stake' ? '#10b981' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'wait' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <>
                  <span style={{ marginRight: '8px' }}>
                    {action === 'stake' ? 'Staking...' : 'Unstaking...'}
                  </span>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                </>
              ) : (
                action === 'stake' ? 'Stake MOR' : 'Unstake MOR'
              )}
            </button>
            
            {/* Status messages */}
            {error && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '4px'
              }}>
                {error}
              </div>
            )}
            
            {success && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                borderRadius: '4px'
              }}>
                {success}
              </div>
            )}
            
            {/* Network notice */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: networkType === 'testnet' ? '#dbeafe' : '#fef3c7',
              color: networkType === 'testnet' ? '#1e40af' : '#92400e',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {networkType === 'testnet' ? (
                <p style={{ margin: 0 }}>
                  <strong>Note:</strong> You are using the Arbitrum Sepolia testnet for demo purposes. No real assets are at risk.
                </p>
              ) : (
                <p style={{ margin: 0 }}>
                  <strong>Warning:</strong> You are using Arbitrum One mainnet with real assets. Please stake responsibly.
                </p>
              )}
            </div>
          </div>
          
          {/* API Access Banner */}
          {apiAccessEnabled && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#d1fae5',
              borderRadius: '8px',
              borderWidth: '1px',
              borderColor: '#a7f3d0',
              borderStyle: 'solid'
            }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                color: '#065f46',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                API Access Enabled
              </h3>
              <p style={{ 
                margin: '0', 
                color: '#065f46',
                fontSize: '14px'
              }}>
                You've met the minimum staking requirement of {minStakeRequired} MOR! You can now access the API key management page to create and manage your API keys.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 