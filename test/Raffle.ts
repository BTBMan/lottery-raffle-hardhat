import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { network, ignition, ethers } from 'hardhat';
import Raffle from '../ignition/modules/Raffle';
import { networkConfig } from '../helper-hardhat-config';

describe('Raffle', () => {
  const deployFixture = async () => {
    const { contract, VRFCoordinatorV2_5MockContract } = await ignition.deploy(
      Raffle,
    );

    return { contract, VRFCoordinatorV2_5MockContract };
  };
  const chainId = network.config.chainId!;
  const networkConfigItem = networkConfig[chainId];

  describe('constructor', async () => {
    it('initializes the raffle correctly', async () => {
      const { contract } = await loadFixture(deployFixture);
      const raffleState = await contract.getRaffleState();
      const interval = await contract.getInterval();

      expect(raffleState).to.equal(0);
      expect(interval).to.equal(networkConfigItem.interval);
    });
  });

  describe('enterRaffle', async () => {
    it("revert when you don't pay enough", async () => {
      const { contract } = await loadFixture(deployFixture);

      await expect(contract.enterRaffle()).to.revertedWithCustomError(
        contract,
        'Raffle__NotEnoughETHEntered',
      );
    });

    it('records players when they enter', async () => {
      const { contract } = await loadFixture(deployFixture);
      const [deployer] = await ethers.getSigners();

      await contract.enterRaffle({
        value: networkConfigItem.entranceFee,
      });

      expect(await contract.getNumberOfPlayers()).to.greaterThan(0);
      expect(await contract.getPlayer(0)).to.equal(deployer);
    });
  });

  describe.skip('view / pure functions', async () => {
    it('get subscription id', async () => {
      const { contract } = await loadFixture(deployFixture);

      expect(typeof (await contract.getSubscriptionId()) === 'bigint').to.equal(
        true,
      );
    });
  });
});
