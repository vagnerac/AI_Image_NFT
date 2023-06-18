//const ethers = require('ethers');
import { ethers } from 'ethers';

export default class Provider {
  constructor() {}

  async blockchainConnection() {
    try {
      let provider;
      // check if Metamask is installed.
      if (window.ethereum === null) {
        console.log('MetaMask not installed; using read-only defaults');
        provider = ethers.getDefaultProvider();
      } else {
        // connect to Metamask wallet
        provider = new ethers.BrowserProvider(window.ethereum);
      }
      return provider;
    } catch (err) {
      console.log('Error in the network connection.');
      return;
    }
  }
}
