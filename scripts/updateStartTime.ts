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

  let startTime = 1645336500;

  await token.updateSaleStartsAt(startTime);
  logDeployInfo(startTime);
}

function logDeployInfo(saleStartsAt: number) {
  console.log("Updating contract startime...");
  console.log(" . Sale starts at: %s", new Date(saleStartsAt * 1000));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
