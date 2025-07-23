import hre from 'hardhat';
import { erc20Deployer, whitelistDeployer } from '../../ignition';

export const deployErc20 = async (
  defaultSender: string,
  deploymentId: string,
) => {
  const { erc20EnforcedTokenMock: erc20Token } = await hre.ignition.deploy(
    erc20Deployer,
    {
      defaultSender,
      deploymentId,
    },
  );

  return { erc20Token };
};

export const deployWhitelist = async (
  defaultSender: string,
  ownerAddress: string,
  deploymentId: string,
) => {
  // console.log(ownerAddress, 'ownerAddress');
  const { whitelistStub: whitelist } = await hre.ignition.deploy(
    whitelistDeployer,
    {
      defaultSender,
      // parameters: {
      //   [whitelistDeployer.id]: {
      //     ownerAddress,
      //   },
      // },
      deploymentId,
    },
  );

  return { whitelist };
};
