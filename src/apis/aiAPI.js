import fs from 'fs';
import Axios from 'axios';
import AIAPIConfig from './config/configAIAPI.js';

export default async function aiAPIAuth() {
  const aiAPIConfigData = AIAPIConfig();

  if (!aiAPIConfigData.apiKey) throw new Error('Missing AI API key.');

  const user = await Axios.get(
    aiAPIConfigData.apiAuthURL,
    aiAPIConfigData.headers,
  )
    .then((response) => {
      const responseJSON = response.data;
      const responseData = JSON.stringify(responseJSON);
      const responseObject = JSON.parse(responseData);
      console.log(responseObject);
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
  return user.data;
}

export async function generateAIFile(fileLocationPath, inputText) {
  const aiAPIConfigData = AIAPIConfig(inputText);

  console.log('na aiAPI.js retornou os dados de configuração', aiAPIConfigData);

  if (!aiAPIConfigData.apiKey) throw new Error('Missing AI API key.');

  console.log('na aiAPI.js vai chamar o axios');
  return Axios.post(
    aiAPIConfigData.apiProcessURL,
    aiAPIConfigData.body,
    aiAPIConfigData.headers,
  )
    .then((response) => {
      console.log(
        'na aiAPI.js retornou do axios, mas ainda não gravou o arquivo',
      );
      const responseJSON = response.data;
      writeAIFile(responseJSON, fileLocationPath);
      const responseData = JSON.stringify(responseJSON);
      const responseObject = JSON.parse(responseData);
      return responseObject;
    })
    .catch(function (error) {
      console.log('na aiAPI.js deu erro no axios');
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

function writeAIFile(responseJSON, fileLocationPath) {
  console.log('na aiAPI.js está gravando o arquivo');
  responseJSON.artifacts.forEach((image) => {
    fs.writeFileSync(fileLocationPath, Buffer.from(image.base64, 'base64'));
  });
}

// below code run the generateImge function standalone
// await generateAIFile(
//   'J:/Projetos/Pessoal/NFT-mint-marketplace/public/assets/media/file/testimage1.png',
//   'A motorcycle',
// );
