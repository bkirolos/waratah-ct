import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Running script with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const token = await ethers.getContract("Knots");

  let buffer = fs.readFileSync("ipfs/metadata.cid");
  let cid = buffer.toString().trim();

  let tokenMetadata = `ipfs://${cid}/`;

  console.log("Knots contract address:", token.address);

  await token.updateBaseURI(tokenMetadata);
  console.log("Metadata updated to: " + tokenMetadata);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
