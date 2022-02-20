import { ethers } from "hardhat";
import fs from "fs";
import { FlyingFormations } from "../typechain-types/FlyingFormations";
import axios from "axios";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Running script with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const token = (await ethers.getContract(
    "FlyingFormations"
  )) as FlyingFormations;

  let buffer = fs.readFileSync("ipfs/metadata-placeholder.cid");
  let cid = buffer.toString().trim();

  let tokenMetadata = `ipfs://${cid}/`;

  console.log("FlyingFormations contract address:", token.address);

  //await token.updateBaseURI(tokenMetadata);
  //await token.updateSneakerBaseURI(tokenMetadata);
  console.log("Metadata updated to: " + tokenMetadata);

  let tokenIds = await token.getAllTokens();

  console.log("Waiting 30 seconds to update opensea metadata...");
  //await sleep(15000);

  for (const tokenId of tokenIds) {
    console.log(" . Refreshing OpenSea metadata for token #" + tokenId);
    let url = `https://testnets-api.opensea.io/api/v1/asset/${token.address}/${tokenId}/?force_update=true`;
    try {
      let res = await axios.get(url);

      console.log(" .   Found: " + res.data["token_metadata"]);
    } catch (err) {
      console.error(err);
    }

    await sleep(1000);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
