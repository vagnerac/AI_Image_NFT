import dotenv from 'dotenv';
dotenv.config();
import { Web3Storage, getFilesFromPath } from 'web3.storage';
import path from 'path';
import { fileURLToPath } from 'url';

function getAccessToken() {
  const token = process.env.IPFS_API_KEY;
  if (!token) {
    return console.error('An IPFS token is needed.');
  }
  return token;
}

function makeStorageClient() {
  return new Web3Storage({ token: getAccessToken() });
}

async function getFiles(path) {
  const files = await getFilesFromPath(path);
  console.log(`read ${files.length} file(s) from ${path}`);
  return files;
}

async function storeFiles(files) {
  const client = makeStorageClient();
  const cid = await client.put(files);
  console.log('stored files with cid:', cid);
  return cid;
}

async function sendFileToIPFS() {
  // set the local path from here to send image to IPFS
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // just a test value input below. Need to change the logic to get it from the generated image by AI.
  const filename = '1683469660294.png';
  const inputLocationPath = path.join(
    __dirname,
    process.env.IMG_PATH,
    filename,
  );
  if (!inputLocationPath) {
    return console.error('Please supply the path to a file.');
  }

  const files = await getFiles(inputLocationPath);

  const cid = await storeFiles(files);

  const url = `ipfs://${cid}/${filename}`;

  console.log(url);
}

await sendFileToIPFS();
