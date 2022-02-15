import { ethers } from "hardhat";
import fs from "fs";
import { FlyingFormations } from "../typechain-types/FlyingFormations";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Running script with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const token = (await ethers.getContract(
    "FlyingFormations"
  )) as FlyingFormations;

  let buffer = fs.readFileSync("ipfs/metadata.cid");
  let cid = buffer.toString().trim();

  let tokenMetadata = `ipfs://${cid}/`;

  console.log("FlyingFormations contract address:", token.address);

  await token.updateBaseURI(tokenMetadata);
  await token.updateSneakerBaseURI(tokenMetadata);
  console.log("Metadata updated to: " + tokenMetadata);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
