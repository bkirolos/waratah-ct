const ethers = require('ethers');


if (process.argv[2] == null) {
  console.log("Missing mnemonic! Please provide as string encapsulated command line argument")
  process.exit(1)
}

let mnemonic = process.argv[2];
let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);

console.log(mnemonicWallet.privateKey);
