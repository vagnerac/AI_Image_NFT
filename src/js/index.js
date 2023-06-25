import dotenv from 'dotenv';
dotenv.config();
import sendFileToIPFS from '../apis/IpfsAPI.js';
import { processFilePath, setFileExtension } from './processLocationFiles.js';
import metadata from '../apis/config/metadata.js';
import { generateAiImage } from '../apis/stabilityAPI.js';

async function runApp() {
  const fullImgLocationPath = processFilePath(
    process.env.NFT_FILE_PATH,
    'png',
    null,
  );
  console.log('fullImgLocationPath', fullImgLocationPath);

  const inputText =
    'A soccer grass with a ball on it and goalkeeper in the background.';

  const iaResponseData = await processNftImg(
    fullImgLocationPath.absoluteFilePath,
    inputText,
  );
  console.log('iaResponseData', iaResponseData);
  let IPFSImgResponse = '';
  if (iaResponseData) {
    IPFSImgResponse = await processIPFSImgFile(
      fullImgLocationPath.absoluteFilePath,
      fullImgLocationPath.fullFileName,
    );
    console.log('IPFSImgResponse', IPFSImgResponse);
  } else {
    console.error('error in the IA processing to generate the image.');
    return;
  }
  let IPFSMetadataResponse = '';
  if (IPFSImgResponse) {
    const metadataFileExtension = 'json';
    const fullMetadataLocationPath = processFilePath(
      process.env.NFT_FILE_PATH,
      metadataFileExtension,
      fullImgLocationPath.filename,
    );

    console.log('fullMetadataLocationPath', fullMetadataLocationPath);

    console.log('fullImgLocationPath.fileName', fullImgLocationPath.filename);
    console.log('inputText', inputText);
    console.log('IPFSImgResponse', IPFSImgResponse);
    console.log(
      'fullMetadataLocationPath.absoluteFilePath',
      fullMetadataLocationPath.absoluteFilePath,
    );
    IPFSMetadataResponse = await processIPFSMetadataFile(
      fullImgLocationPath.filename,
      metadataFileExtension,
      inputText,
      IPFSImgResponse,
      fullMetadataLocationPath.absoluteFilePath,
    );
    console.log('IPFSMetadataResponse', IPFSMetadataResponse);
  } else {
    console.error('error in the IPFS to store files.');
    return;
  }
}

async function processNftImg(nftImgLocationPath, inputText) {
  const iaResponseData = await generateAiImage(nftImgLocationPath, inputText);

  return iaResponseData;
}

async function processIPFSImgFile(fullNftImgLocationPath, fileName) {
  const IPFSImgResponse = await sendFileToIPFS(
    fullNftImgLocationPath,
    fileName,
  );
  console.log(IPFSImgResponse);
  return IPFSImgResponse;
}

async function processIPFSMetadataFile(
  nftName,
  metadataFileExtension,
  nftDescription,
  nftIPFSURL,
  fullMetadataLocationPath,
) {
  const metadataFile = await metadata(
    nftName,
    nftDescription,
    nftIPFSURL,
    fullMetadataLocationPath,
  );

  const metadataFullFileName = setFileExtension(nftName, metadataFileExtension);

  const IPFSMetadataResponse = await sendFileToIPFS(
    fullMetadataLocationPath,
    metadataFullFileName,
  );
  return IPFSMetadataResponse;
}

await runApp();
