import { HardhatNetworkForkingUserConfig } from 'hardhat/types';
import { IS_NETWORK_FORKING_ENABLED } from './config-key.constants';
import { Config } from './env-config-reader';
import { getBlockchainNodeRpcUri } from './rpc-config-params';
import { NetworkName } from './types';

export const DEFAULT_LOCAL_NETWORK_ID = '31337';

type ForkingConfig = {
  networkName: NetworkName;
  blockNumber?: number;
  chainId: number;
};

const defaultBaseSepoliaForkingParams = (): ForkingConfig => {
  return {
    networkName: NetworkName.amoy,
    blockNumber: 20_826_332,
    chainId: 84532,
  };
};

const defaultBaseForkingParams = (): ForkingConfig => {
  return {
    networkName: NetworkName.polygon,
    blockNumber: 25_315_793,
    chainId: 8453,
  };
};

export const shouldFork = (): boolean => {
  const result = Config.getSafe(IS_NETWORK_FORKING_ENABLED, 'false');
  return result === 'true';
};

export const forkingParamsForNetwork = (networkName: NetworkName) => {
  let config: {
    forkingConfig: HardhatNetworkForkingUserConfig | undefined;
    chainId: number;
  };

  if (networkName === NetworkName.amoy) {
    const { blockNumber, chainId } = defaultBaseSepoliaForkingParams();
    const forkingConfig: HardhatNetworkForkingUserConfig = {
      blockNumber,
      url: getBlockchainNodeRpcUri(networkName),
    };

    config = { forkingConfig, chainId };
  } else if (networkName === NetworkName.polygon) {
    const { blockNumber, chainId } = defaultBaseForkingParams();
    const forkingConfig: HardhatNetworkForkingUserConfig = {
      blockNumber,
      url: getBlockchainNodeRpcUri(networkName),
    };

    config = { forkingConfig, chainId };
  } else {
    throw new Error(`Network ${networkName} does not provide forking config`);
  }

  return config;
};
