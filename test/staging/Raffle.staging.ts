import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { network, ignition, ethers } from 'hardhat';
import Raffle from '../../ignition/modules/Raffle';
import { developmentChains, networkConfig } from '../../helper-hardhat-config';
import { Contract, EventLog } from 'ethers';

developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle', () => {
      const deployFixture = async () => {
        const { contract } = await ignition.deploy(Raffle);

        return { contract };
      };
      const chainId = network.config.chainId!;
      const networkConfigItem = networkConfig[chainId];

      describe('fulfillRandomWords', () => {
        // let raffleContract: Contract;
        // before(async () => {
        //   const { contract } = await loadFixture(deployFixture);
        //   raffleContract = contract;
        // });

        it('works with live chainlink automation, chainlink VRF, we got a random winner', async () => {
          const { contract } = await loadFixture(deployFixture);
          const [deployer] = await ethers.getSigners();

          const startingTimestamp = await contract.getLatestTimeStamp();

          return new Promise(async (resolve, reject) => {
            contract.once('WinnerPicked', async (recentWinner) => {
              try {
                const raffleState = await contract.getRaffleState();
                const endingTimestamp = await contract.getLatestTimeStamp();
                const numberPlayers = await contract.getNumberOfPlayers();
                const winnerEndingBalance = await ethers.provider.getBalance(
                  recentWinner,
                );

                expect(raffleState).to.equal('0');
                expect(numberPlayers).to.equal(0);
                expect(endingTimestamp).to.greaterThan(startingTimestamp);
                expect(recentWinner).to.equal(deployer.address);
                expect(winnerEndingBalance).to.equal(
                  winnerStartingBalance + BigInt(networkConfigItem.entranceFee),
                );

                resolve();
              } catch (error) {
                reject();
              }
            });

            await contract.enterRaffle({
              value: networkConfigItem.entranceFee,
            });

            // get the balance after enter the raffle
            const winnerStartingBalance = await ethers.provider.getBalance(
              deployer.address,
            );
          });
        });
      });
    });
