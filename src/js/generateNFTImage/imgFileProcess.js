// import dotenv from 'dotenv';
// dotenv.config();
import sendFileToIPFS from '../../apis/IpfsAPI.js';
import { processFilePath } from './processLocationFiles.js';
import metadataCreateFile from '../../apis/config/metadata.js';
import { generateAIFile } from '../../apis/aiAPI.js';

export async function imgStorageProcessing(nftDescription) {
  const imgLocationData = processFilePath('png', null);

  console.log('imgLocationData', imgLocationData);

  const inputText = nftDescription;

  const iaResponseData = await generateAIFile(
    imgLocationData.locationPath,
    inputText,
  );

  console.log('iaResponseData', iaResponseData);

  let IPFSImgResponse = '';
  if (iaResponseData) {
    IPFSImgResponse = await sendFileToIPFS(
      imgLocationData.locationPath,
      imgLocationData.fullFileName,
    );
  } else {
    console.error('error in the AI processing to generate the image.');
    return;
  }
  let metadataFileResponse = '';
  let metadataLocationData = {};

  if (IPFSImgResponse) {
    try {
      metadataLocationData = processFilePath('json', imgLocationData.filename);
      metadataFileResponse = await metadataCreateFile(
        imgLocationData.fullFileName,
        inputText,
        IPFSImgResponse,
        metadataLocationData.locationPath,
      );
    } catch (err) {
      console.log('error in the metadata processing', err);
    }
  } else {
    return console.error('error in the IPFS to store files.');
  }

  if (metadataFileResponse) {
    const ipfsMetadataResponse = await sendFileToIPFS(
      metadataLocationData.locationPath,
      metadataLocationData.fullFileName,
    );

    return ipfsMetadataResponse;
  } else {
    return console.log('Error in the metadata file generation.');
  }
}
// below line do a standalone test of the AI image generation and IPFS storage
// await imgStorageProcessing('a blue airplane');
