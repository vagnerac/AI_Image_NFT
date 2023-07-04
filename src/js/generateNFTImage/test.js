const dirUrl = new URL('.', import.meta.url);
console.log('dirurl', dirUrl);

const dirUrl2 = new URL('../', import.meta.url);
console.log('dirurl2', dirUrl2);

const fullFileName = 'teste.json';

const dirUrl3 = new URL(
  `../../../public/assets/media/file/${fullFileName}`,
  import.meta.url,
);
console.log('dirurl3', dirUrl3.pathname.slice(1));
