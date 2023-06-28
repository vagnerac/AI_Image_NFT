import fs from 'fs';
import Axios from 'axios';

export default async function stabilityAuth() {
  const apiHost = process.env.AI_HOST ?? 'https://api.stability.ai';
  const apiURL = `${apiHost}/v1/user/account`;
  const apiKey = process.env.AI_IMAGE_API_KEY;

  if (!apiKey) throw new Error('Missing Stability API key.');

  const user = await Axios.get(apiURL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }).catch(function (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
  });
  return user.data;
}

export async function generateAiImage(fullFileLocationPath, inputText) {
  const engineId = 'stable-diffusion-v1-5';
  const apiHost = process.env.AI_HOST ?? 'https://api.stability.ai';
  const url = `${apiHost}/v1/generation/${engineId}/text-to-image`;
  const apiKey = process.env.AI_IMAGE_API_KEY;

  if (!apiKey) throw new Error('Missing Stability API key.');

  const body = {
    text_prompts: [
      {
        text: inputText,
      },
    ],
    // cfg_scale: 7,
    // clip_guidance_preset: 'FAST_BLUE',
    // height: 512,
    // width: 512,
    // samples: 1,
    // steps: 30,
  };

  const headers = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  };

  return Axios.post(url, body, headers)
    .then((response) => {
      const responseJSON = response.data;
      processImageResponse(responseJSON, fullFileLocationPath);
      const responseData = JSON.stringify(responseJSON);
      const responseObject = JSON.parse(responseData);
      return responseObject;
    })
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
    });
}

function processImageResponse(responseJSON, fullFileLocationPath) {
  responseJSON.artifacts.forEach((image) => {
    fs.writeFileSync(fullFileLocationPath, Buffer.from(image.base64, 'base64'));
  });
}

// uncomment below code to run the generateImge function standalone
// await generateImage(
//   'J:/Projetos/Pessoal/NFT-mint-marketplace/public/assets/media/file/testimage1.png',
//   'Symbol of Bitcoin with silver color and dark background',
// );
