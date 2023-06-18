import dotenv from 'dotenv';
dotenv.config();
import sendFileToIPFS from '../apis/IpfsAPI.js';
import processFilePath from './processLocationFiles.js';
import metadata from '../apis/config/metadata.js';
import { hotpotMakeArt } from '../apis/makeArtAPI.js';

async function runApp() {
  const fullImgLocationPath = processFilePath(
    process.env.NFT_FILE_PATH,
    'png',
    null,
  );

  const inputText = 'Cardano symbol';

  const iaResponseData = await processNftImg(
    fullImgLocationPath.absoluteFilePath,
    inputText,
  );
  console.log('iaResponseData', iaResponseData);
  let IPFSImgResponse = '';
  if (iaResponseData) {
    IPFSImgResponse = processIPFSImgFile(
      fullImgLocationPath.absoluteFilePath,
      fullImgLocationPath.fullFileName,
    );
  } else {
    console.error('error in the IA processing to generate the image.');
    return;
  }
  if (IPFSImgResponse) {
    const fullMetadataLocationPath = processFilePath(
      process.env.NFT_FILE_PATH,
      'json',
      fullImgLocationPath.fileName,
    );

    processIPFSMetadataFile(
      fullImgLocationPath.fileName,
      inputText,
      IPFSImgResponse,
      fullMetadataLocationPath.absoluteFilePath,
    );
  } else {
    console.error('error in the IPFS to store files.');
    return;
  }
}

async function processNftImg(nftImgLocationPath, inputText) {
  const iaResponseData = await hotpotMakeArt(nftImgLocationPath, inputText);

  return iaResponseData;
}

function processIPFSImgFile(fullNftImgLocationPath, fileName) {
  const IPFSImgResponse = sendFileToIPFS(fullNftImgLocationPath, fileName);
  return IPFSImgResponse;
}

function processIPFSMetadataFile(
  nftName,
  nftDescription,
  nftIPFSURL,
  fullMetadataLocationPath,
) {
  const metadataFile = metadata(
    nftName,
    nftDescription,
    nftIPFSURL,
    fullMetadataLocationPath,
  );

  const IPFSMetadataResponse = sendFileToIPFS(
    fullMetadataLocationPath,
    nftName,
  );
  return IPFSMetadataResponse;
}

await runApp();
