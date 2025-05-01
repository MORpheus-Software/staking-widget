# MOR Staking Widget Demo Setup

This guide will walk you through building and running the MOR Staking Widget demo locally.

## Prerequisites

- Node.js (v14+)
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
# or
yarn
```

## Building the Widget

1. Build the staking widget library:

```bash
npm run build
# or
yarn build
```

This will create the following files in the `dist` directory:
- `index.es.js` - ES module version
- `index.umd.js` - UMD version (used by the demo)
- Type definitions (`.d.ts` files)

## Running the Demo

There are two ways to run the demo:

### Option 1: Using the Node.js server

```bash
npm run serve-demo
# or
yarn serve-demo
```

This will start a simple HTTP server on port 3000. Open your browser to [http://localhost:3000](http://localhost:3000) to view the demo.

### Option 2: Using Vite's development server

```bash
npm run dev
# or
yarn dev
```

This will start Vite's development server with hot module reloading.

## Troubleshooting

### Common Issues

1. **Widget doesn't load in the demo**

   Make sure you've built the widget first with `npm run build`.

2. **TypeScript errors during build**

   The most common TypeScript errors are related to missing type definitions. Make sure all dependencies are installed and check the console for specific error messages.

3. **Wallet Connection Issues**

   For testing wallet connections, you'll need:
   - A browser with MetaMask or another Ethereum wallet extension installed
   - Some testnet ETH on Arbitrum Sepolia
   - Some testnet MOR tokens (get them from the testnet faucet)

## Demo Features

The demo allows you to:

1. Connect your wallet (using MetaMask or other providers)
2. View your MOR balance
3. Stake MOR tokens to a subnet
4. Unstake MOR tokens
5. View transaction status and history

Note that the demo defaults to the Arbitrum Sepolia testnet for safety. 