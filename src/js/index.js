// import dotenv from 'dotenv';
// dotenv.config();
import fs from 'fs';
import { ethers } from 'ethers';
import Provider from './provider.js';
import Signer from './signer.js';
import { imgStorageProcessing } from './generateNFTImage/imgFileProcess.js';

// app class to process main functions from the system
export class App {
  constructor() {
    // get elements from html
    this.form = document.getElementById('form');
    this.nftTextDescription = document.getElementById('nftTextDescription');
    this.connectBtn = document.getElementById('connect-btn');
    this.walletAddressSpan = document.getElementById('walletAddressSpan');
    //declare signer variable to be used under "this" context.
    this.signer;
    this.providerConnected;
  }

  async runApp() {
    try {
      // await this.signerConnection();
      await this.isConnected();

      this.connectBtn.onclick = async () => {
        await this.signerConnection();
        await this.isConnected();
      };

      this.form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!this.nftTextDescription.value)
          return window.alert(
            'Blank is not allowed in the text field to generate NFT.',
          );

        console.log(
          'passou do formulário e vai entrar no imgStorageProcessing',
        );
        const IPFSMetadataAddress = await imgStorageProcessing(
          this.nftTextDescription.value,
        );

        let contractInstance = {};
        if (this.isConnected && IPFSMetadataAddress) {
          const contractAddress = process.env.CONTRACT_ADDRESS;
          const contractABI = fs
            .readFileSync('../src/contracts/AIImgNFT.sol/AIImgNFT.json')
            .toString();

          contractInstance = new ethers.Contract(
            contractAddress,
            contractABI,
            this.providerConnected,
          );
        }

        const accounts = await ethereum.request({ method: 'eth_accounts' });

        this.mintNFT(
          this.signer.address,
          IPFSMetadataAddress,
          contractInstance,
        );
      });
    } catch (e) {
      console.log(e.message);
    }
  }

  async mintNFT(address, URI, contractInstance) {
    try {
      const nonce = await this.getNonce(this.signer.address);
      const gasFee = await this.getGasPrice(provider);
      let rawTxn = await contractInstance.populateTransaction.safeMint(
        address,
        URI,
        {
          gasPrice: gasFee,
          nonce: nonce,
        },
      );
      console.log(
        '...Submitting transaction with gas price of:',
        ethers.formatUnits(gasFee, 'gwei'),
        ' - & nonce:',
        nonce,
      );

      let signedTxn = await this.signer.sendTransaction(rawTxn);
      let reciept = (await signedTxn).wait();
      if (reciept) {
        console.log(
          'Transaction is successful!!!' + '\n' + 'Transaction Hash:',
          (await signedTxn).hash +
            '\n' +
            'Block Number: ' +
            (await reciept).blockNumber +
            '\n' +
            'Navigate to https://polygonscan.com/tx/' +
            (await signedTxn).hash,
          'to see your transaction',
        );
      } else {
        console.log('Error submitting transaction');
      }
    } catch (e) {
      console.log('Error Caught in Catch Statement: ', e);
    }
  }

  async isConnected() {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length) {
      const cutWallet = accounts[0].slice(35);
      const spanConnectedWallet = document.createElement('span');
      this.connectBtn.parentElement.appendChild(spanConnectedWallet);
      spanConnectedWallet.innerText = `Connected with ...${cutWallet}`;
      this.connectBtn.style.visibility = 'hidden';
      this.walletAddressSpan.innerText = accounts[0];

      await this.signerConnection();
    }
  }

  async providerConnection() {
    // Connection to the provider
    const provider = new Provider();
    this.providerConnected = await provider.blockchainConnection();
  }

  // method to connect signer
  async signerConnection() {
    await this.providerConnection();
    if (this.providerConnected) {
      // connection to signer
      const signerInstance = new Signer();
      this.signer = await signerInstance.setSigner(this.providerConnected);
    }
  }

  async getGasPrice(provider) {
    let feeData = (await provider.getGasPrice()).toNumber();
    return feeData;
  }

  async getNonce(address) {
    let nonce = await this.signer.getTransactionCount(address);
    return nonce;
  }
}

const app = new App();
app.runApp();
