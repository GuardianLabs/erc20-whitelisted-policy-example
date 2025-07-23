import { ContractVerifyData } from './verify/types';
import { verify as verifyContract } from './verify/verify-claims-manager';

const main = async () => {
  // PUT YOUR PARAMS AT THIS POINT
  const whitelist: ContractVerifyData = {
    address: '0x9F539AAF3588f49c2b5d02399b053382C33771D6',
    constructorArguments: [],
  };

  await verifyContract(whitelist);

  // PUT YOUR PARAMS AT THIS POINT
  const erc20Token: ContractVerifyData = {
    address: '0x288820ee74caB3Cd22E3f3793949b7aD4e3b76A2',
    constructorArguments: [],
    contract: 'contracts/mocks/EnforcedTokenMock.sol:EnforcedGRDToken',
  };

  await verifyContract(erc20Token);
};

main().catch(console.error);
