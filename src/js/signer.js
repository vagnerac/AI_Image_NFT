export default class Signer {
  constructor() {}

  // process signer connection to ethers.js
  async setSigner(provider) {
    try {
      let signer = null;
      if (window.ethereum !== null && provider) {
        signer = await provider.getSigner();
        return signer;
      }
    } catch (err) {
      console.log('Connection with signer failed');
      return;
    }
  }
}
