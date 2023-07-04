export default function AIAPIConfig(inputText) {
  const engineId = 'stable-diffusion-v1-5';
  const apiHost = process.env.AI_HOST ?? 'https://api.stability.ai';
  const apiProcessURL = `${apiHost}/v1/generation/${engineId}/text-to-image`;
  const apiAuthURL = `${apiHost}/v1/user/account`;
  const apiKey = process.env.AI_IMAGE_API_KEY;

  const headers = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  };

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

  const aiAPIConfigData = {
    engineID: engineId,
    apiHost: apiHost,
    apiAuthURL: apiAuthURL,
    apiProcessURL: apiProcessURL,
    apiKey: apiKey,
    headers: headers,
    body: body,
  };

  return aiAPIConfigData;
}
