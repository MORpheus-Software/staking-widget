# MOR Staking Widget

A React component library for integrating MOR token staking functionality into your web application.

## Features

- Connect to Ethereum wallets using Web3Modal
- Support for Arbitrum One (mainnet) and Arbitrum Sepolia (testnet)
- Stake and unstake MOR tokens in subnets
- View balances and staking status
- Configurable UI components

## Installation

```bash
npm install mor-staking-widget
```

## Quick Start

Integrate the full staking widget into your React application:

```jsx
import React from 'react';
import { WalletProvider, StakingWidget } from 'mor-staking-widget';

function App() {
  return (
    <div>
      <h1>MOR Staking</h1>
      
      <WalletProvider networkType="testnet">
        <StakingWidget 
          networkType="testnet"
          defaultAmount="0.01"
          onSuccess={(action, txHash) => {
            console.log(`${action} successful! Transaction: ${txHash}`);
          }}
          onError={(error) => {
            console.error('Error:', error);
          }}
        />
      </WalletProvider>
    </div>
  );
}

export default App;
```

## Environment Configuration

To configure the widget, create a `.env` file in your project with the following variables:

```
# Network Configuration
VITE_MAINNET_RPC_URL=https://arb1.arbitrum.io/rpc
VITE_TESTNET_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Contract Addresses - Mainnet (Arbitrum One)
VITE_MAINNET_MOR_TOKEN_ADDRESS=0x1c9491865a1de77c5b6e19d2e6a5f1d7a6f2b25f
VITE_MAINNET_BUILDERS_CONTRACT_ADDRESS=0xC0eD68f163d44B6e9985F0041fDf6f67c6BCFF3f

# Contract Addresses - Testnet (Arbitrum Sepolia)
VITE_TESTNET_MOR_TOKEN_ADDRESS=0x34a285A1B1C166420Df5b6630132542923B5b27E
VITE_TESTNET_BUILDERS_CONTRACT_ADDRESS=0xF651907Bfc6A67eCAb3E448c6C8200cD13566baA

# Default Network
VITE_DEFAULT_NETWORK=testnet
```

You can find a complete list of available configuration options in the `.env.example` file. For most use cases, you can use the default values provided in the example.

## Components

### WalletProvider

Provides wallet connection context to staking components.

```jsx
<WalletProvider networkType="testnet">
  {/* Staking components */}
</WalletProvider>
```

Props:
- `networkType`: 'mainnet' | 'testnet' (default: 'testnet')

### StakingWidget

Full-featured widget that includes wallet connection, balance display, and staking/unstaking functionality.

```jsx
<StakingWidget 
  networkType="testnet"
  defaultAmount="0.01"
  showWalletInfo={true}
  showBalances={true}
  onSuccess={(action, txHash) => console.log(action, txHash)}
  onError={(error) => console.error(error)}
/>
```

Props:
- `networkType`: 'mainnet' | 'testnet' (default: 'testnet')
- `defaultAmount`: string (default: '0.01')
- `subnetId`: string (optional) - ID of the subnet to stake in, uses default subnet if not provided
- `containerStyle`: React.CSSProperties (optional) - Custom styles for the container
- `containerClassName`: string (optional) - Custom class for the container
- `showWalletInfo`: boolean (default: true) - Whether to show wallet connection info
- `showBalances`: boolean (default: true) - Whether to show balance information
- `onSuccess`: (action: 'stake' | 'unstake', txHash: string) => void (optional) - Callback for successful transactions
- `onError`: (error: string) => void (optional) - Callback for errors

### StakingButton

Minimal staking button component for simpler integration.

```jsx
<StakingButton 
  networkType="testnet"
  amount="0.01"
  buttonText="Stake MOR"
  buttonStyle={{ backgroundColor: '#3b82f6' }}
  buttonClassName="custom-button"
  onSuccess={(txHash) => console.log('Success!', txHash)}
  onError={(error) => console.error('Error:', error)}
  onStatusChange={(status, message) => console.log(status, message)}
/>
```

Props:
- `networkType`: 'mainnet' | 'testnet' (default: 'testnet')
- `amount`: string (default: '0.01')
- `subnetId`: string (optional) - ID of the subnet to stake in, uses default subnet if not provided
- `buttonStyle`: React.CSSProperties (optional) - Custom styles for the button
- `buttonClassName`: string (optional) - Custom class for the button
- `buttonText`: string (default: 'Stake MOR')
- `onSuccess`: (txHash: string) => void (optional) - Callback for successful transactions
- `onError`: (error: string) => void (optional) - Callback for errors
- `onStatusChange`: (status: 'idle' | 'staking' | 'success' | 'error', message?: string) => void (optional) - Callback for status changes

## Advanced Usage

### Using the BuildersClient Directly

For more advanced use cases, you can use the `BuildersClient` directly:

```jsx
import { BuildersClient, useWallet } from 'mor-staking-widget';

function CustomStakingComponent() {
  const { provider, signer, isConnected } = useWallet();
  
  const handleStake = async () => {
    if (isConnected && provider && signer) {
      const client = new BuildersClient(provider, signer);
      // Use client methods for custom staking logic
      const tx = await client.deposit(poolId, amount);
      // ...
    }
  };
  
  return (
    // Your custom UI
  );
}
```

### Custom Subnet Configuration

You can override the default subnet configuration:

```jsx
import { NETWORK_SUBNETS } from 'mor-staking-widget';

// Add or modify subnets
const customSubnets = {
  ...NETWORK_SUBNETS,
  testnet: [
    ...NETWORK_SUBNETS.testnet,
    {
      id: "your-custom-subnet-id",
      name: "Custom Subnet",
      description: "My custom subnet",
      admin: "0x...",
      minimalDeposit: {
        formatted: "0.5"
      },
      active: true
    }
  ]
};
```

## Networks

The widget supports the following networks:

- **Mainnet**: Arbitrum One
- **Testnet**: Arbitrum Sepolia

## License

MIT 