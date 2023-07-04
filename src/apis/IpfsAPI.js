import { getFilesFromPath } from 'web3.storage';
import storeFiles from './config/configIPFS.js';

export default async function sendFileToIPFS(fileLocationPath, fileName) {
  try {
    let cid = '';
    let fileURL = '';
    return await getFiles(fileLocationPath).then(async (response) => {
      cid = await storeFiles(response);
      fileURL = `ipfs://${cid}/${fileName}`;
      return fileURL;
    });
  } catch (err) {
    console.log('error in the sendFileIPFS', err);
  }
}

async function getFiles(fileLocationPath) {
  try {
    const files = await getFilesFromPath(fileLocationPath);
    console.log(`read ${files.length} file(s) from ${fileLocationPath}`);
    return files;
  } catch (err) {
    console.log('error in the getFiles', err);
  }
}

// below code run above logic santandalone
// console.log(
//   await sendFileToIPFS(
//     'J:/Projetos/Pessoal/NFT-mint-marketplace/public/assets/media/nftFiles/1687203896188.png',
//     '1687203896188.png',
//   ),
// );
