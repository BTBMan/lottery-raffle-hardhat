import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import Raffle from '../ignition/modules/Raffle';
import { Contract } from 'ethers';

describe('Raffle', () => {
  const deployFixture = async () => {
    const { contract, VRFCoordinatorV2_5MockContract } =
      await hre.ignition.deploy(Raffle);

    return { contract, VRFCoordinatorV2_5MockContract };
  };

  describe('view / pure functions', async () => {
    it('get subscription id', async () => {
      const { contract } = await loadFixture(deployFixture);

      expect(typeof (await contract.getSubscriptionId()) === 'bigint').to.equal(
        true,
      );
    });
  });
});
