import { task } from 'hardhat/config';

task('accounts', 'Prints the list of accounts', async (_, hre) => {
  const signers = await hre.ethers.getSigners();

  for (const account of signers) {
    console.log(account.address);
  }
});
