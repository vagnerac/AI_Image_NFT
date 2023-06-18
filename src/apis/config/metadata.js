import fs from 'fs';

export default function metadata(
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

  fs.writeFile(fullMetadataLocationPath, metadataJSON, function (err, result) {
    if (err) console.log('error', err);
    else {
      console.log('File written successfully\n');
      console.log(result.JSON);
      console.log('The written has the following contents:');
      console.log(
        'file content:',
        fs.readFileSync(fullMetadataLocationPath, 'utf8'),
      );
    }
  });
}
