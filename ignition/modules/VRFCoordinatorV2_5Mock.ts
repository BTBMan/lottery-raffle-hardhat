import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import {
  BASE_FEE,
  GAS_PRICE,
  WEI_PER_UNIT_LINK,
} from '../../helper-hardhat-config';

const VRFCoordinatorV2_5Mock = buildModule(
  'VRFCoordinatorV2_5Mock',
  (builder) => {
    const contract = builder.contract('VRFCoordinatorV2_5Mock', [
      BASE_FEE,
      GAS_PRICE,
      WEI_PER_UNIT_LINK,
    ]);

    return { contract };
  },
);
1;

export default VRFCoordinatorV2_5Mock;
