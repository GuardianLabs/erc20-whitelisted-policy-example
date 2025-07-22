import '@nomicfoundation/hardhat-ethers';
import hre from 'hardhat';
import { ContractVerifyData } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const verify = async (params: ContractVerifyData) => {
  await hre.run('verify:verify', {
    ...params,
  });

  await sleep(5000);

  console.log(`The contract ${params.address} verification is finished...`);
};
