import { ethers } from 'ethers';

// process ethers.js functions to effectivate transaction
export default class Transaction {
  constructor(signer, walletAddressTo, value) {
    this.signer = signer;
    this.walletAddressTo = walletAddressTo;
    this.value = value;
  }

  // send a transaction
  async createTransaction() {
    const tx = await this.signer.sendTransaction({
      to: this.walletAddressTo,
      value: ethers.parseEther(this.value),
    });
    return tx;
  }
}
