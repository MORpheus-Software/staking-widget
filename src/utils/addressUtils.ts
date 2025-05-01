import { ethers } from 'ethers';

/**
 * Ensure an address is properly formatted with correct checksum
 * @param address Ethereum address
 * @returns Checksum formatted address
 */
export const getChecksumAddress = (address: string): string => {
    if (!address) return "";
    try {
        return ethers.utils.getAddress(address.toLowerCase());
    } catch (error) {
        console.error("Invalid address format:", error);
        // Return the original address if conversion fails
        return address.toLowerCase();
    }
}; 