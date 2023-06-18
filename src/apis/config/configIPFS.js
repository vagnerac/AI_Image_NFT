// import dotenv from 'dotenv';
// dotenv.config();
import { Web3Storage } from 'web3.storage';

export default async function storeFiles(files) {
  const client = makeStorageClient();
  const cid = await client.put(files);
  console.log('stored files with cid:', cid);
  return cid;
}

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
