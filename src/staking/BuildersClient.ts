import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants';

// Default builders contract address (testnet)
const DEFAULT_BUILDERS_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.testnet.builders;

// Default MOR token address (testnet)
const DEFAULT_MOR_TOKEN_ADDRESS = CONTRACT_ADDRESSES.testnet.token;

// ABIs for the Builders Contract and MOR token
const BUILDERS_CONTRACT_ABI = [
    // Pool creation and management
    "function createBuilderPool((string name, address admin, uint128 poolStart, uint128 withdrawLockPeriodAfterDeposit, uint128 claimLockEnd, uint256 minimalDeposit) builderPool_) external",
    "function editBuilderPool((string name, address admin, uint128 poolStart, uint128 withdrawLockPeriodAfterDeposit, uint128 claimLockEnd, uint256 minimalDeposit) builderPool_) external",
    "function builderPools(bytes32 builderPoolId) external view returns (string name, address admin, uint128 poolStart, uint128 withdrawLockPeriodAfterDeposit, uint128 claimLockEnd, uint256 minimalDeposit)",
    "function buildersPoolData(bytes32 builderPoolId) external view returns (uint128 lastDeposit, uint256 deposited, uint256 virtualDeposited, uint256 rate, uint256 pendingRewards)",
    
    // Deposit and withdrawal
    "function deposit(bytes32 builderPoolId_, uint256 amount_) external",
    "function withdraw(bytes32 builderPoolId_, uint256 amount_) external",
    
    // Rewards and claiming
    "function getCurrentBuilderReward(bytes32 builderPoolId_) external view returns (uint256)",
    "function claim(bytes32 builderPoolId_, address receiver_) external",
    
    // User data
    "function usersData(address user, bytes32 builderPoolId) external view returns (uint128 lastDeposit, uint128 claimLockStart, uint256 deposited, uint256 virtualDeposited)",
    
    // Other utility functions
    "function getPoolId(string memory builderPoolName_) public pure returns (bytes32)",
    "function getCurrentUserMultiplier(bytes32 builderPoolId_, address user_) external view returns (uint256)",
    "function depositToken() external view returns (address)"
];

// Simplified ERC20 ABI for the MOR token
const MOR_TOKEN_ABI = [
    "function balanceOf(address owner) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
];

/**
 * Client for interacting with the Morpheus Builders Contract
 */
export class BuildersClient {
    provider: ethers.providers.Provider;
    signer: ethers.Signer;
    buildersContract: ethers.Contract;
    morToken: ethers.Contract;
    contractAddress: string;
    tokenAddress: string;
    networkType: 'mainnet' | 'testnet';

    /**
     * Create a new BuildersClient
     * @param provider Ethereum provider
     * @param signer Ethereum signer for transactions
     * @param buildersContractAddress Address of the Builders Contract (optional)
     * @param morTokenAddress Address of the MOR token (optional)
     */
    constructor(
        provider: ethers.providers.Provider, 
        signer: ethers.Signer,
        buildersContractAddress: string = DEFAULT_BUILDERS_CONTRACT_ADDRESS,
        morTokenAddress: string = DEFAULT_MOR_TOKEN_ADDRESS
    ) {
        this.provider = provider;
        this.signer = signer;
        this.contractAddress = buildersContractAddress.toLowerCase();
        this.tokenAddress = morTokenAddress.toLowerCase();
        
        // Determine network type based on addresses
        if (
            this.contractAddress === CONTRACT_ADDRESSES.mainnet.builders.toLowerCase() ||
            this.tokenAddress === CONTRACT_ADDRESSES.mainnet.token.toLowerCase()
        ) {
            this.networkType = 'mainnet';
        } else {
            this.networkType = 'testnet';
        }
        
        // Initialize contract instances
        this.buildersContract = new ethers.Contract(this.contractAddress, BUILDERS_CONTRACT_ABI, signer);
        this.morToken = new ethers.Contract(this.tokenAddress, MOR_TOKEN_ABI, signer);
    }

    /**
     * Get network type (mainnet or testnet)
     * @returns Network type string
     */
    getNetworkType(): 'mainnet' | 'testnet' {
        return this.networkType;
    }

    /**
     * Generate a pool ID for a given name
     * @param name Pool name
     * @returns Pool ID (bytes32 hex string)
     */
    getPoolId(name: string): string {
        return this.buildersContract.getPoolId(name);
    }

    /**
     * Get pool information by ID
     * @param poolId Pool ID (bytes32 hex string)
     * @returns Pool information object
     */
    async getPoolInfo(poolId: string) {
        try {
            const [
                poolInfo,
                poolData
            ] = await Promise.all([
                this.buildersContract.builderPools(poolId),
                this.buildersContract.buildersPoolData(poolId)
            ]);
            
            return {
                name: poolInfo.name,
                admin: poolInfo.admin,
                poolStart: {
                    timestamp: poolInfo.poolStart,
                    date: new Date(Number(poolInfo.poolStart) * 1000)
                },
                withdrawLockPeriodAfterDeposit: poolInfo.withdrawLockPeriodAfterDeposit,
                claimLockEnd: poolInfo.claimLockEnd,
                minimalDeposit: {
                    wei: poolInfo.minimalDeposit,
                    formatted: ethers.utils.formatEther(poolInfo.minimalDeposit)
                },
                lastDeposit: {
                    timestamp: poolData.lastDeposit,
                    date: new Date(Number(poolData.lastDeposit) * 1000)
                },
                deposited: {
                    wei: poolData.deposited,
                    formatted: ethers.utils.formatEther(poolData.deposited)
                },
                virtualDeposited: {
                    wei: poolData.virtualDeposited,
                    formatted: ethers.utils.formatEther(poolData.virtualDeposited)
                },
                rate: poolData.rate.toString(),
                pendingRewards: {
                    wei: poolData.pendingRewards,
                    formatted: ethers.utils.formatEther(poolData.pendingRewards)
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to get pool info: ${error.message}`);
        }
    }

    /**
     * Approve MOR tokens to be spent by the builders contract
     * @param amount Amount to approve (in MOR)
     * @returns Transaction object
     */
    async approveMorTokens(amount: string) {
        const amountWei = ethers.utils.parseEther(amount);
        try {
            return await this.morToken.approve(this.contractAddress, amountWei);
        } catch (error: any) {
            throw new Error(`Failed to approve tokens: ${error.message}`);
        }
    }

    /**
     * Get MOR token allowance for builders contract
     * @returns Allowance in wei (bigint)
     */
    async getMorAllowance(): Promise<bigint> {
        try {
            const address = await this.signer.getAddress();
            const allowance = await this.morToken.allowance(address, this.contractAddress);
            return BigInt(allowance.toString());
        } catch (error: any) {
            throw new Error(`Failed to get token allowance: ${error.message}`);
        }
    }

    /**
     * Get MOR token balance for connected wallet
     * @returns Balance in wei (bigint)
     */
    async getMorBalance(): Promise<bigint> {
        try {
            const address = await this.signer.getAddress();
            const balance = await this.morToken.balanceOf(address);
            return BigInt(balance.toString());
        } catch (error: any) {
            throw new Error(`Failed to get token balance: ${error.message}`);
        }
    }

    /**
     * Deposit MOR tokens into a builder pool
     * @param poolId Pool ID to deposit into
     * @param amount Amount to deposit (in MOR)
     * @returns Transaction object
     */
    async deposit(poolId: string, amount: string) {
        const amountWei = ethers.utils.parseEther(amount);
        try {
            return await this.buildersContract.deposit(poolId, amountWei);
        } catch (error: any) {
            throw new Error(`Failed to deposit: ${error.message}`);
        }
    }

    /**
     * Withdraw MOR tokens from a builder pool
     * @param poolId Pool ID to withdraw from
     * @param amount Amount to withdraw (in MOR)
     * @returns Transaction object
     */
    async withdraw(poolId: string, amount: string) {
        const amountWei = ethers.utils.parseEther(amount);
        try {
            return await this.buildersContract.withdraw(poolId, amountWei);
        } catch (error: any) {
            throw new Error(`Failed to withdraw: ${error.message}`);
        }
    }

    /**
     * Get user data for a specific pool
     * @param address User address
     * @param poolId Pool ID
     * @returns User data object
     */
    async getUserData(address: string, poolId: string) {
        try {
            const userData = await this.buildersContract.usersData(address, poolId);
            
            return {
                lastDeposit: {
                    timestamp: userData.lastDeposit,
                    date: new Date(Number(userData.lastDeposit) * 1000)
                },
                claimLockStart: {
                    timestamp: userData.claimLockStart,
                    date: new Date(Number(userData.claimLockStart) * 1000)
                },
                deposited: {
                    wei: userData.deposited,
                    formatted: ethers.utils.formatEther(userData.deposited)
                },
                virtualDeposited: {
                    wei: userData.virtualDeposited,
                    formatted: ethers.utils.formatEther(userData.virtualDeposited)
                }
            };
        } catch (error: any) {
            throw new Error(`Failed to get user data: ${error.message}`);
        }
    }
} 