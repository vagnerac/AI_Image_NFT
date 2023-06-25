import dotenv from 'dotenv';
dotenv.config();
import { getFilesFromPath } from 'web3.storage';
import storeFiles from './config/configIPFS.js';

export default async function sendFileToIPFS(fileLocationPath, fileName) {
  let cid = '';
  let fileURL = '';
  return getFiles(fileLocationPath).then(async (response) => {
    cid = await storeFiles(response);
    fileURL = `ipfs://${cid}/${fileName}`;
    return fileURL;
  });
}

async function getFiles(fileLocationPath) {
  const files = await getFilesFromPath(fileLocationPath);
  console.log(`read ${files.length} file(s) from ${fileLocationPath}`);
  return files;
}

// uncomment below code to run above logic santandalone
// console.log(
//   await sendFileToIPFS(
//     'J:/Projetos/Pessoal/NFT-mint-marketplace/public/assets/media/nftFiles/1687203896188.png',
//     '1687203896188.png',
//   ),
// );
