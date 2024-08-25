import { ethers } from 'hardhat';

type NetworkConfig = {
  name: string;
  vrfCoordinator?: string;
  entranceFee: bigint;
  keyHash: string;
  subscriptionId?: string;
  callbackGasLimit: string;
  enableNativePayment: boolean;
  interval: string;
};

export const networkConfig: Record<string, NetworkConfig> = {
  11155111: {
    name: 'ethereum sepolia',
    vrfCoordinator: '0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B',
    entranceFee: ethers.parseEther('0.01'),
    keyHash:
      '0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae',
    subscriptionId:
      '8413420575713347438279475371557282730552385308244088423147202136625497173362',
    callbackGasLimit: '500000',
    enableNativePayment: false,
    interval: '30',
  },
  31337: {
    name: 'hardhat',
    entranceFee: ethers.parseEther('0.01'),
    keyHash:
      '0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae',
    callbackGasLimit: '500000',
    enableNativePayment: false,
    interval: '30',
  },
};

export const developmentChains = ['hardhat', 'local'];

export const BASE_FEE = ethers.parseEther('0.2');
export const GAS_PRICE = 1000000000;
export const WEI_PER_UNIT_LINK = 4410411539125376;
