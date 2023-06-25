import path from 'path';
import { fileURLToPath } from 'url';

export function processFilePath(relativePath, fileExtension, fileName) {
  console.log('fileName into processLocationFile', fileName);
  console.log('fileExtension into processLocationFile', fileExtension);
  console.log('relativePath into processLocationFile', relativePath);
  if (!fileExtension) return console.error('file extension not provided.');
  let filename = fileName;
  if (!fileName) filename = setFileName();
  const fullFileName = setFileExtension(filename, fileExtension);
  const absoluteFilePath = setFileAbsolutePath(fullFileName, relativePath);
  const filePathData = {
    filename: filename,
    fullFileName: fullFileName,
    absoluteFilePath: absoluteFilePath,
  };
  console.log('filePathData', filePathData);
  return filePathData;
}

function setFileAbsolutePath(fileName, filePath) {
  const filename = fileName;
  if (!filename) {
    console.error('Invalid file name provided.');
    return;
  }

  const __filePath = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filePath);
  const absoluteLocationPath = path.join(__dirname, filePath, filename);

  if (!absoluteLocationPath) {
    return console.error('Please supply the path to a file.');
  }

  return absoluteLocationPath;
}

function setFileName() {
  const dateTimeNow = Date.now();
  const fileName = `${dateTimeNow}`;
  return fileName;
}

export function setFileExtension(fileName, fileExtension) {
  if (!fileExtension.includes('.')) fileExtension = `.${fileExtension}`;

  const fullFileName = `${fileName}${fileExtension}`;

  return fullFileName;
}
