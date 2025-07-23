import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { IgnitionModuleType } from '../types';

const MODULE_ID = 'Erc20Instance';

const erc20Module: IgnitionModuleType = buildModule(MODULE_ID, (m) => {
  const erc20EnforcedTokenMock = m.contract('EnforcedGRDToken');

  return {
    erc20EnforcedTokenMock,
  };
});

export default erc20Module;
