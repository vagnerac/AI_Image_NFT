// import dotenv from 'dotenv';
// dotenv.config();
import fs from 'fs';
import { ethers } from 'ethers';
import Provider from './provider.js';
import Signer from './signer.js';

// app class to process main functions from the system
export class App {
  constructor() {
    // get elements from html
    this.form = document.getElementById('form');
    this.toWalletAddress = document.getElementById('toWalletAddress');
    this.amount = document.getElementById('amount');
    this.connectBtn = document.getElementById('connect-btn');
    this.fromWalletAddressSpan = document.getElementById(
      'fromWalletAddressSpan',
    );
    //declare signer variable to be used under "this" context.
    this.signer;
  }

  async runApp() {
    try {
      // await this.signerConnection();
      await this.isConnected();

      this.connectBtn.onclick = async () => {
        await this.signerConnection();
        await this.isConnected();
      };

      if (this.isConnected) {
        // const privateKey = process.env.PTIVATE_KEY;
        const contractAddress = process.env.CONTRACT_ADDRESS;
        const contractABI = fs
          .readFileSync('../src/contracts/AIImgNFT.sol/AIImgNFT.json')
          .toString();

        const provider = await this.providerConnection();

        const contractInstance = new ethers.Contract(
          contractAddress,
          contractABI,
          provider,
        );
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      this.mintNFT(
        this.signer.address,
        'ipfs://bafybeifi4yeo4zt56u5uya3u3ktgm6yb77yfl7lqelaimb3szovblq2qo4/1687703139655.json',
        contractInstance,
      );
    } catch (e) {}
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
        ethers.utils.formatUnits(gasFee, 'gwei'),
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
      this.fromWalletAddressSpan.innerText = accounts[0];

      await this.signerConnection();
    }
  }

  async providerConnection() {
    // Connection to the provider
    const provider = new Provider();
    console.log(`Provider: ${provider}`);
    const providerConnected = await provider.blockchainConnection();
    return providerConnected;
  }

  // method to connect signer
  async signerConnection() {
    const providerConnected = await this.providerConnection();
    // connection to signer
    const signerInstance = new Signer();
    this.signer = await signerInstance.setSigner(providerConnected);
  }

  async getGasPrice(provider) {
    let feeData = (await provider.getGasPrice()).toNumber();
    return feeData;
  }

  async getNonce(address) {
    let nonce = await this.signer.getTransactionCount(address);
    return nonce;
  }

  // method to call internal methods in the correct order to process the app.
  // it checks if wallet is connected, listen submit button and process all
  // methods to connect wallet and process transaction
  //   async runApp() {
  //     try {
  //       await this.isConnected();

  //       this.connectBtn.onclick = async () => {
  //         await this.signerConnection();
  //         await this.isConnected();
  //       };

  //       this.form.addEventListener('submit', async (event) => {
  //         event.preventDefault();
  //         await this.transactionProcessing(this.signer);
  //       });
  //     } catch (err) {
  //       console.log(err.message);
  //     }
  //   }

  //   // method to check the connection of Metamask with the site
  //   async isConnected() {
  //     const accounts = await ethereum.request({ method: 'eth_accounts' });
  //     if (accounts.length) {
  //       const cutWallet = accounts[0].slice(35);
  //       const spanConnectedWallet = document.createElement('span');
  //       this.connectBtn.parentElement.appendChild(spanConnectedWallet);
  //       spanConnectedWallet.innerText = `Connected with ...${cutWallet}`;
  //       this.connectBtn.style.visibility = 'hidden';
  //       this.fromWalletAddressSpan.innerText = accounts[0];

  //       await this.signerConnection();
  //     }
  //   }

  //   // method to connect signer
  //   async signerConnection() {
  //     // Connection to the provider
  //     const provider = new Provider();
  //     console.log(`Provider: ${provider}`);
  //     const providerConnected = await provider.blockchainConnection();

  //     // connection to signer
  //     const signerInstance = new Signer();
  //     this.signer = await signerInstance.setSigner(providerConnected);
  //   }

  //   // this method is responsible to process the transaction and teturn the
  //   // response from blockchain
  //   async transactionProcessing(signer) {
  //     const toWalletAddress = this.toWalletAddress.value;
  //     const transactionAmount = this.amount.value;

  //     try {
  //       if (toWalletAddress && transactionAmount) {
  //         const validateFormData = new ValidateFormData(
  //           toWalletAddress,
  //           transactionAmount,
  //         );
  //         const isFormDataValid = validateFormData.validateData();

  //         if (!signer) {
  //           window.alert('Metamask is not connected');
  //           return;
  //         }
  //         if (isFormDataValid) {
  //           const tx = new Transaction(
  //             signer,
  //             toWalletAddress,
  //             transactionAmount,
  //           );

  //           const transaction = await tx.createTransaction();
  //           console.log(transaction);

  //           // Wait for the transaction to be written in the blockchain
  //           const receipt = await transaction.wait();
  //           console.log(receipt);
  //         }
  //       } else {
  //         window.alert('Dados inválidos.');
  //       }
  //     } catch (err) {
  //       console.log(err.message);
  //     }
  //   }
}

const app = new App();
app.runApp();
