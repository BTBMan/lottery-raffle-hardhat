import { task } from 'hardhat/config';

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

task('print', 'Just test', async () => {
  console.log(SEPOLIA_RPC_URL, PRIVATE_KEY);
});
