import { ContractVerifyData } from './verify/types';
import { verify as verifyContract } from './verify/verify-claims-manager';

const main = async () => {
  // PUT YOUR PARAMS AT THIS POINT
  const claimsManagerVerifyData: ContractVerifyData = {
    address: '0xcA68beE1A2EF61344b2e6acBdCC718Ec92937Fd0',
    constructorArguments: [
      '0x2eF3d4487DF7151278dee0ccEcb9ad23bBfa38A4', // tresury
      '0xa6CfD61523d888A5930382B9af5cB84293623699', // reward
      '0xc319ca3699D057330Ee0Bf55A57B2064C523da12', // factory
      '0xC4F6cDd242Cf9f12c8696E3c3DA2fC2e217baaaD', // admin
    ],
  };

  await verifyContract(claimsManagerVerifyData);

  // PUT YOUR PARAMS AT THIS POINT
  const receivableCollectionVerifyData: ContractVerifyData = {
    address: '0x9b84A79D9a6a3C80F04dBeb36758eA2Ff3fD1e47',
    constructorArguments: [
      '0xcA68beE1A2EF61344b2e6acBdCC718Ec92937Fd0', // admin
    ],
  };

  await verifyContract(receivableCollectionVerifyData);
};

main().catch(console.error);
