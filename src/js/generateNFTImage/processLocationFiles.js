// import { fileURLToPath } from 'url';
export function processFilePath(fileExtension, fileName) {
  if (!fileExtension) return console.error('file extension not provided.');

  let filename = fileName;
  if (!fileName) {
    filename = generateFileName();
  }

  const fullFileName = setFullFileName(filename, fileExtension);

  const locationPath = new URL(
    `../../../public/assets/media/file/${fullFileName}`,
    import.meta.url,
  );

  // const __filename = new URL(
  //   `../../../public/assets/media/file/${fullFileName}`,
  //   import.meta.url,
  // );

  // fileURLToPath(import.meta.url);
  // const __dirname = path.dirname(__filename);
  // const locationPath = path.resolve(
  //   __dirname,
  //   '..',
  //   '..',
  //   '..',
  //   'public',
  //   'assets',
  //   'media',
  //   'file',
  //   fullFileName,
  // );
  const filePathData = {
    filename: filename,
    fullFileName: fullFileName,
    locationPath: locationPath.pathname.slice(1),
  };

  return filePathData;
}

function generateFileName() {
  const dateTimeNow = Date.now();
  const fileName = `${dateTimeNow}`;
  return fileName;
}

export function setFullFileName(fileName, fileExtension) {
  if (!fileExtension.includes('.')) fileExtension = `.${fileExtension}`;

  const fullFileName = `${fileName}${fileExtension}`;

  return fullFileName;
}
