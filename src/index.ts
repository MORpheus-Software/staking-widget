// Export components
export { StakingButton } from './components/StakingButton';
export { StakingWidget } from './components/StakingWidget';
export { WalletProvider, useWallet } from './context/WalletContext';

// Export types
export type { StakingButtonProps } from './components/StakingButton';
export type { StakingWidgetProps } from './components/StakingWidget';

// Export constants and utils for customization
export { NETWORK_SUBNETS, NETWORKS, CONTRACT_ADDRESSES } from './constants';
export { BuildersClient } from './staking/BuildersClient';
export { getChecksumAddress } from './utils/addressUtils';

// Export environment utilities
export {
  getEnvVar,
  getRpcUrl,
  getChainId,
  getDefaultNetwork,
  getDefaultStakeAmount,
  useMockData,
  isDemoMode
} from './utils/envUtils'; 