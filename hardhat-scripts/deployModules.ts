import { deployInstances } from './helpers';

// note: useful hardhat discussion (https://github.com/NomicFoundation/hardhat/issues/5158)
const main = async () => {
  await deployInstances();
};

main().catch(console.error);
