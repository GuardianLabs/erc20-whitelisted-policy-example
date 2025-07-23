import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { IgnitionModuleType } from '../types';

const MODULE_ID = 'WhitelistInstance';

const whitelistModule: IgnitionModuleType = buildModule(MODULE_ID, (m) => {
  // const ownerAddress = m.getParameter<string>('ownerAddress');

  const whitelistStub = m.contract('WhitelistStub');

  return {
    whitelistStub,
  };
});

export default whitelistModule;
