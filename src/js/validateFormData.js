import { ethers } from 'ethers';

export default class ValidateFormData {
  constructor(toWalletAddress, amount) {
    this.toWalletAddress = toWalletAddress;
    this.amount = amount;
  }

  // validate data from form
  async validateData() {
    if (
      ethers.isAddress(this.toWalletAddress) &&
      Number(this.amount) &&
      Number(this.amount > 0)
    ) {
      return true;
    }
    return false;
  }
}
