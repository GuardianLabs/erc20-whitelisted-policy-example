import { randomEthAddress } from '../../test/test-helpers';

export const SN = '0x3A672768DcBe29D125D64a1166c807644bc9CC7e';
export const S2 = '0xdeb1c44C1888477f9fe08e82487FEf3CB469BDA0';

export const whitelistedAddresses = (): string[] => {
  // put your address here
  return [randomEthAddress(), SN, S2];
};

export const getWhitelistEditor = () => {
  // put your address here
  const editorUser = '';

  return editorUser;
};
