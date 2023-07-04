import fs from 'fs';
import FormData from 'form-data';
import Axios from 'axios';
import { promisify } from 'util';
import * as stream from 'stream';

// function to set the parameters and do the connection to the HotPot API
export async function hotpotMakeArt(fullFileLocationPath, inputText) {
  // set the API key
  const apiKey = process.env.AI_IMAGE_API_KEY;

  if (!apiKey) {
    return console.error('API Key not valid.');
  }

  // start write stream function to work with the time to get the image from the API
  const writer = fs.createWriteStream(fullFileLocationPath);

  // set closing of the stream
  const finished = promisify(stream.finished);

  // set the endpoint of the API
  const endpoint = `${process.env.AI_IMAGE_URL}make-art`;

  //generate the form to the parameters of the API
  const form = new FormData();
  form.append('inputText', inputText);

  //call the API
  Axios.post(endpoint, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: apiKey,
    },
    responseType: 'stream',
  })
    // .then(({ data }) => {
    //   data.pipe(writer);
    //   return finished(writer);
    // })
    .then((response) => {
      response.data.pipe(writer);
      return finished(writer); //this is a Promise
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
      console.log(error.config);
    });
}

// below line run the above function and call the API to generate an image
// hotpotMakeArt('test');
