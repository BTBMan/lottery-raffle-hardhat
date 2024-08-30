import { expect } from 'chai';
import { network, ethers } from 'hardhat';
import { developmentChains, networkConfig } from '../../helper-hardhat-config';

developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle staging test', () => {
      const chainId = network.config.chainId!;
      const networkConfigItem = networkConfig[chainId];

      describe('fulfillRandomWords', () => {
        it('works with live chainlink automation, chainlink VRF, we got a random winner', async () => {
          console.log('Setting up test...');
          const [deployer] = await ethers.getSigners();
          const contract = await ethers.getContractAt(
            'Raffle',
            '0x1dE93Bf1975BBd0BA62572F7aE96610EDca155CB',
            deployer,
          );

          const startingTimestamp = await contract.getLatestTimeStamp();

          console.log('Setting up Listener...');
          return new Promise(async (resolve, reject) => {
            try {
              contract.once(
                contract.getEvent('WinnerPicked'),
                async (recentWinner) => {
                  console.log('WinnerPicked event fired!');
                  try {
                    const raffleState = await contract.getRaffleState();
                    const endingTimestamp = await contract.getLatestTimeStamp();
                    const numberPlayers = await contract.getNumberOfPlayers();
                    const winnerEndingBalance =
                      await ethers.provider.getBalance(recentWinner);
                    console.log('winnerEndingBalance', winnerEndingBalance);

                    expect(raffleState).to.equal('0');
                    expect(numberPlayers).to.equal(0);
                    expect(endingTimestamp).to.greaterThan(startingTimestamp);
                    expect(recentWinner).to.equal(deployer.address);
                    // 10-2-1=7
                    // 7+2-1=8
                    // gas fee???
                    expect(winnerEndingBalance).to.equal(
                      winnerStartingBalance +
                        BigInt(networkConfigItem.entranceFee),
                    );

                    resolve();
                  } catch (error) {
                    console.log(error);
                    reject();
                  }
                },
              );

              console.log('Entering Raffle...');
              const tx = await contract.enterRaffle({
                value: networkConfigItem.entranceFee,
                gasLimit: '1500000',
              });
              await tx.wait();
              console.log('Ok, time to wait...');

              // get the balance after enter the raffle
              const winnerStartingBalance = await ethers.provider.getBalance(
                deployer.address,
              );
              console.log('winnerStartingBalance', winnerStartingBalance);
            } catch (error) {
              console.log(error);
              reject();
            }
          });
        });
      });
    });
