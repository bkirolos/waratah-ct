import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/types";

import * as dotenv from "dotenv";
import * as ethers from "ethers";

dotenv.config();

let mnemonic = process.env.RINKEBY_MNEMONIC as string;
let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    localhost: {
      live: false,
      saveDeployments: true,
      tags: ["local"],
    },
    hardhat: {
      live: false,
      tags: ["test", "local"],
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [mnemonicWallet.privateKey],
      tags: ["rinkeby"],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./@contracts",
  },

  namedAccounts: {
    deployer: 0,
    footballTeamWallet: 1,
    ducksWallet: 2,
    divisionStWallet: 3,
    wlWallet1: 4,
    wlWallet2: 5,
    wlWallet3: 6,
  },
};

export default config;
