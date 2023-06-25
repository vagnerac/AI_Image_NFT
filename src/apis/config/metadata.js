import { promises as fs } from 'fs';

export default async function metadata(
  NftFilename,
  NftDescription,
  NftURL,
  fullMetadataLocationPath,
) {
  const metadata = new Object();
  metadata.description = NftDescription;
  metadata.image = NftURL;
  metadata.name = NftFilename;
  const metadataJSON = JSON.stringify(metadata);

  await fs.writeFile(
    fullMetadataLocationPath,
    metadataJSON,
    async function (err, result) {
      if (err) console.log('error', err);
      else {
        console.log('File written successfully\n');
        console.log('The written has the following contents:');
        console.log(
          'file content:',
          await fs.readFileSync(fullMetadataLocationPath, 'utf8'),
        );
        return true;
      }
    },
  );
}
