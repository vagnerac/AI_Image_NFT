/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
const { ALCHEMY_URL, PRIVATE_KEY } = process.env;
module.exports = {
  solidity: '0.8.10',
  defaultNetwork: 'goerli',
  networks: {
    hardhat: {},
    goerli: {
      url: ALCHEMY_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
  paths: {
    sources: './src/contracts',
    tests: './src/test',
    cache: './cache',
    artifacts: './src/artifacts',
  },
};
