import dotenv from 'dotenv';
dotenv.config();
import contract from '../artifacts/src/contracts/AIImgNFT.sol/AIImgNFT.json' assert { type: 'json' };
import { createAlchemyWeb3 } from '@alch/alchemy-web3';

const ALCHEMY_URL = process.env.ALCHEMY_URL;

const web3 = createAlchemyWeb3(ALCHEMY_URL);

console.log(JSON.stringify(contract.abi));
