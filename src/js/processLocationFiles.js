import path from 'path';
import { fileURLToPath } from 'url';

export default function processFilePath(relativePath, fileExtension, fileName) {
  if (!fileExtension) return console.error('file extension not provided.');
  let filename = '';
  if (!fileName) filename = setFileName();
  const fullFileName = setFileExtension(filename, fileExtension);
  const absoluteFilePath = setFileAbsolutePath(fullFileName, relativePath);
  const filePathData = {
    filename: filename,
    fullFileName: fullFileName,
    absoluteFilePath: absoluteFilePath,
  };
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

function setFileExtension(fileName, fileExtension) {
  if (!fileExtension.includes('.')) fileExtension = `.${fileExtension}`;

  const fullFileName = `${fileName}${fileExtension}`;

  return fullFileName;
}
