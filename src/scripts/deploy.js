async function main() {
  // Grab the contract factory
  const AIImgNFT = await ethers.getContractFactory('AIImgNFT');

  // Start deployment, returning a promise that resolves to a contract object
  const aiImgNFT = await AIImgNFT.deploy(); // Instance of the contract
  console.log('Contract deployed to address:', aiImgNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
