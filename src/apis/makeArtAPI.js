import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';
import Axios from 'axios';

// function to set the parameters and do the connection to the HotPot API
export async function hotpotMakeArt(inputText) {
  // setting the API key
  const apiKey = process.env.AIIMAGE_API_KEY;

  if (!apiKey) {
    return console.error('API Key not valid.');
  }

  // set the local path to store the image returned by HotPot API
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fileName = `${Date.now()}.png`;
  const outputLocationPath = path.join(
    __dirname,
    `../../public/assets/media/${fileName}`,
  );

  if (!outputLocationPath) {
    return console.error('Path to save the file not found.');
  }

  // starting write stream function to work with the time to get the image from the API
  const writer = fs.createWriteStream(outputLocationPath);

  // stting the endpoint of the API
  const endpoint = `${process.env.AIIMAGE_URL}make-art`;

  //generating the form to the parameters of the API
  const form = new FormData();
  form.append('inputText', inputText);

  //calling the API
  Axios.post(endpoint, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: apiKey,
    },
    responseType: 'stream',
  })
    .then(({ data }) => data.pipe(writer))
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
      console.log(error.config);
    });

  return fileName;
}

// uncomment below line to run the above function and call the API to generate an image
// hotpotMakeArt('test');
