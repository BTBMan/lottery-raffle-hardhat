import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { network, ignition, ethers } from 'hardhat';
import Raffle from '../ignition/modules/Raffle';
import { networkConfig } from '../helper-hardhat-config';
import { Contract } from 'ethers';

describe('Raffle', () => {
  const deployFixture = async () => {
    const { contract, VRFCoordinatorV2_5MockContract } = await ignition.deploy(
      Raffle,
    );

    return { contract, VRFCoordinatorV2_5MockContract };
  };
  const chainId = network.config.chainId!;
  const networkConfigItem = networkConfig[chainId];

  describe('constructor', () => {
    it('initializes the raffle correctly', async () => {
      const { contract } = await loadFixture(deployFixture);
      const raffleState = await contract.getRaffleState();
      const interval = await contract.getInterval();

      expect(raffleState).to.equal(0);
      expect(interval).to.equal(networkConfigItem.interval);
    });
  });

  describe('enterRaffle', () => {
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

    it('emits event when they enter', async () => {
      const { contract } = await loadFixture(deployFixture);

      await expect(
        contract.enterRaffle({
          value: networkConfigItem.entranceFee,
        }),
      ).to.emit(contract, 'RaffleEnter');
    });

    it("doesn't allow entrance when raffle is calculating", async () => {
      const { contract } = await loadFixture(deployFixture);

      await contract.enterRaffle({
        value: networkConfigItem.entranceFee,
      });
      await network.provider.send('evm_increaseTime', [
        Number(networkConfigItem.interval),
      ]); // increase block chain time
      await network.provider.send('evm_mine', []); // wait a block mined
      await contract.performUpkeep(new Uint8Array());
      await expect(
        contract.enterRaffle({
          value: networkConfigItem.entranceFee,
        }),
      ).to.revertedWithCustomError(contract, 'Raffle__NotOpen');
    });
  });

  describe('checkUpkeep', () => {
    it("returns false if they haven't sent any ETH", async () => {
      const { contract } = await loadFixture(deployFixture);

      await network.provider.send('evm_increaseTime', [
        networkConfigItem.interval + 1,
      ]);
      await network.provider.send('evm_mine', []);

      const [upkeepNeeded] = await contract.checkUpkeep(new Uint8Array());

      expect(upkeepNeeded).to.equal(false);
    });

    it("returns false if raffle isn't open", async () => {
      const { contract } = await loadFixture(deployFixture);

      await contract.enterRaffle({
        value: networkConfigItem.entranceFee,
      });
      await network.provider.send('evm_increaseTime', [
        networkConfigItem.interval + 1,
      ]);
      await network.provider.send('evm_mine', []);
      await contract.performUpkeep(new Uint8Array());

      const raffleState = await contract.getRaffleState();
      const [upkeepNeeded] = await contract.checkUpkeep(new Uint8Array());

      expect(raffleState).to.equal('1');
      expect(upkeepNeeded).to.equal(false);
    });

    it("returns false if enough time hasn't passed", async () => {
      const { contract } = await loadFixture(deployFixture);

      await contract.enterRaffle({
        value: networkConfigItem.entranceFee,
      });
      await network.provider.send('evm_increaseTime', [
        Number(networkConfigItem.interval) - 3,
      ]);
      await network.provider.send('evm_mine', []);

      const [upkeepNeeded] = await contract.checkUpkeep(new Uint8Array());

      expect(upkeepNeeded).to.equal(false);
    });

    it('returns true if enough time has passed, has players, eth, and is open', async () => {
      const { contract } = await loadFixture(deployFixture);

      await contract.enterRaffle({
        value: networkConfigItem.entranceFee,
      });
      await network.provider.send('evm_increaseTime', [
        Number(networkConfigItem.interval) + 1,
      ]);
      await network.provider.send('evm_mine', []);

      const [upkeepNeeded] = await contract.checkUpkeep(new Uint8Array());

      expect(upkeepNeeded).to.equal(true);
    });
  });

  describe('performUpkeep', () => {
    it('it can only run if checkUpkeep is true', async () => {
      const { contract } = await loadFixture(deployFixture);

      await contract.enterRaffle({
        value: networkConfigItem.entranceFee,
      });
      await network.provider.send('evm_increaseTime', [
        networkConfigItem.interval + 1,
      ]);
      await network.provider.send('evm_mine', []);

      const tx = await contract.performUpkeep(new Uint8Array());

      expect(tx).to.exist;
    });

    it('reverts when checkUpkeep is false', async () => {
      const { contract } = await loadFixture(deployFixture);

      await expect(
        contract.performUpkeep(new Uint8Array()),
      ).to.revertedWithCustomError(contract, 'Raffle__UpkeepNotNeeded');
    });

    it('updates the raffle state, emits and event, and calls vrf coordinator', async () => {
      const { contract } = await loadFixture(deployFixture);

      await contract.enterRaffle({
        value: networkConfigItem.entranceFee,
      });
      await network.provider.send('evm_increaseTime', [
        networkConfigItem.interval + 1,
      ]);
      await network.provider.send('evm_mine', []);

      await expect(contract.performUpkeep(new Uint8Array()))
        .to.emit(contract, 'RequestedRaffleWinner')
        .withArgs((id: bigint) => id > 0);

      const raffleState = await contract.getRaffleState();

      expect(raffleState).to.equal('1');
    });
  });

  describe('fulfillRandomWords', () => {
    let raffleContract: Contract;
    let VRFCoordinatorMockContract: Contract | undefined;
    before(async () => {
      const { contract, VRFCoordinatorV2_5MockContract } = await loadFixture(
        deployFixture,
      );
      raffleContract = contract;
      VRFCoordinatorMockContract = VRFCoordinatorV2_5MockContract;

      await raffleContract.enterRaffle({
        value: networkConfigItem.entranceFee,
      });
      await network.provider.send('evm_increaseTime', [
        networkConfigItem.interval + 1,
      ]);
      await network.provider.send('evm_mine', []);
    });

    it('cat only be called after performUpkeep', async () => {
      if (VRFCoordinatorMockContract) {
        await expect(
          VRFCoordinatorMockContract.fulfillRandomWords(0, raffleContract),
        ).to.revertedWithCustomError(
          VRFCoordinatorMockContract,
          'InvalidRequest',
        );
        await expect(
          VRFCoordinatorMockContract.fulfillRandomWords(1, raffleContract),
        ).to.revertedWithCustomError(
          VRFCoordinatorMockContract,
          'InvalidRequest',
        );
      }
    });
  });

  // just test
  describe.skip('view / pure functions', () => {
    it('get subscription id', async () => {
      const { contract } = await loadFixture(deployFixture);

      expect(typeof (await contract.getSubscriptionId()) === 'bigint').to.equal(
        true,
      );
    });
  });
});
