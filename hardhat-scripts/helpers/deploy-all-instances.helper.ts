import { faker } from '@faker-js/faker';
import { writeFile } from 'fs/promises';
import hre from 'hardhat';
import { join } from 'node:path';
import { erc20Deployer, whitelistDeployer } from '../../ignition';
import { EnforcedGRDToken, WhitelistStub } from '../../src';
// import { ReflectionParams } from '../types';
import {
  getWhitelistEditor,
  SN,
  whitelistedAddresses,
} from '../config/whitelist-config.helper';
import { deployErc20, deployWhitelist } from './deployments.helper';

const createUniqueId = (chainId: number | string) => {
  return `chain-${chainId}-${faker.string.uuid()}`;
};

const writeDeploymentId = async (
  chainId: string | number,
  deploymentId: string,
) => {
  await writeFile(
    join(__dirname, `../../scripts/deployments-id/${chainId}.json`),
    JSON.stringify({ lastDeploymentId: deploymentId }),
  );
};

const loggedModules = [erc20Deployer, whitelistDeployer];

export const deployInstances = async (isLogging: boolean = true) => {
  const [{ address: defaultSender }] = await hre.ethers.getSigners();

  const chainId = hre.network.config.chainId ?? 'chainIdNotProvided'; // note: chain id always has to be provided under regular circumstances
  const deploymentId = createUniqueId(chainId);

  // deploying mocks: a. erc-20-mock
  const { erc20Token } = await deployErc20(defaultSender, deploymentId);

  const { whitelist } = await deployWhitelist(
    defaultSender,
    getWhitelistEditor() || defaultSender,
    deploymentId,
  );

  const erc20Instance = erc20Token as any as EnforcedGRDToken;
  const whitelistInstance = whitelist as any as WhitelistStub;

  await erc20Instance.assignPolicyAddress(await whitelistInstance.getAddress());
  await whitelistInstance.addToWhitelist(whitelistedAddresses());
  await whitelistInstance.transferOwnership(SN);

  // results
  if (isLogging) {
    console.log(
      `The deploy of modules"${loggedModules.map(({ id }) => ' ' + id)}" is ready.
    The following contracts are deployed:
    "EnforcedGRDToken": ${await erc20Token.getAddress()}

    "Whitelist": ${await whitelist.getAddress()}

    (deployment-id: ${deploymentId})
    `,
    );
  }

  await writeDeploymentId(chainId, deploymentId);

  return {
    // erc20Token: erc20Token as any as Erc20Regular,
    erc20Instance,
    constwhitelistInstance: whitelist as any as WhitelistStub,
    deploymentId,
  };
};
