import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { ethers, network } from 'hardhat';
import { developmentChains, networkConfig } from '../../helper-hardhat-config';
import VRFCoordinatorV2_5Mock from './VRFCoordinatorV2_5Mock';

const VRF_SUB_FUND_AMOUNT = ethers.parseEther('5');

const Raffle = buildModule('Raffle', (m) => {
  const chainId = network.config.chainId!;
  const networkConfigItem = networkConfig[chainId];
  let vrfCoordinatorAddress;
  let VRFCoordinatorV2_5MockContract;
  let subscriptionId;

  if (developmentChains.includes(network.name)) {
    VRFCoordinatorV2_5MockContract = m.useModule(
      VRFCoordinatorV2_5Mock,
    ).contract;
    const transactionResponse = m.call(
      VRFCoordinatorV2_5MockContract,
      'createSubscription',
    );
    subscriptionId = m.readEventArgument(
      transactionResponse,
      'SubscriptionCreated',
      'subId',
    );
    m.call(VRFCoordinatorV2_5MockContract, 'fundSubscription', [
      subscriptionId,
      VRF_SUB_FUND_AMOUNT,
    ]);
  } else {
    vrfCoordinatorAddress = networkConfigItem.vrfCoordinator;
    subscriptionId = networkConfigItem.subscriptionId;
  }

  const contract = m.contract('Raffle', [
    (vrfCoordinatorAddress || VRFCoordinatorV2_5MockContract)!,
    networkConfigItem.entranceFee,
    networkConfigItem.keyHash,
    subscriptionId!,
    networkConfigItem.callbackGasLimit,
    networkConfigItem.enableNativePayment,
    networkConfigItem.interval,
  ]);

  return {
    contract,
    ...(VRFCoordinatorV2_5MockContract
      ? { VRFCoordinatorV2_5MockContract }
      : {}),
  };
});

export default Raffle;
