// import dotenv from 'dotenv';
// dotenv.config();
import { getFilesFromPath } from 'web3.storage';
import storeFiles from './config/configIPFS.js';

export default async function sendFileToIPFS(fileLocationPath, fileName) {
  const file = await getFiles(fileLocationPath);

  const cid = await storeFiles(file);

  const fileURL = `ipfs://${cid}/${fileName}`;

  console.log(fileURL);

  return fileURL;
}

async function getFiles(fileLocationPath) {
  const files = await getFilesFromPath(fileLocationPath);
  console.log(`read ${files.length} file(s) from ${fileLocationPath}`);
  return files;
}
