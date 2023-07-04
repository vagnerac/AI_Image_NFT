import { promises as fs } from 'fs';

export default async function metadataCreateFile(
  nftFullFilename,
  nftDescription,
  nftURL,
  metadataLocationPath,
) {
  const metadata = new Object();
  metadata.description = nftDescription;
  metadata.image = nftURL;
  metadata.name = nftFullFilename;
  const metadataJSON = JSON.stringify(metadata, null, 4);
  console.log(metadata);

  const fileLocationPath = await fs.writeFile(
    metadataLocationPath,
    metadataJSON,
  );

  const returnFileData = await readMetadataFile(metadataLocationPath);

  return returnFileData;
}

async function readMetadataFile(metadataLocationPath) {
  const fileData = await fs.readFile(metadataLocationPath, 'utf8');
  return fileData;
}
