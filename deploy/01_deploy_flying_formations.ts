import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import fs from "fs";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = hre.deployments;
  const { deployer, primaryWallet, secondaryWallet, tertiaryWallet } =
    await hre.getNamedAccounts();

  let buffer = fs.readFileSync("ipfs/metadata.cid");
  let cid = buffer.toString().trim();
  let tokenMetadata = `ipfs://${cid}/`;

  if (hre.network.tags["local"] || hre.network.tags["rinkeby"]) {
    let saleStartsAt = Math.floor(Date.now() / 1000) + 10;
    let redeemStartsAt = Math.floor(Date.now() / 1000) + 100;

    logDeployInfo(saleStartsAt, redeemStartsAt);

    await deploy("FlyingFormations", {
      from: deployer,
      args: [
        saleStartsAt,
        redeemStartsAt,
        tokenMetadata,
        tokenMetadata,
        deployer,
        deployer,
        deployer,
      ],
      log: true,
    });
  }
};

function logDeployInfo(saleStartsAt: number, redeemStartsAt: number) {
  console.log("Launching token contract with fields...");
  console.log(" . Sale starts at: %s", new Date(saleStartsAt * 1000));
  console.log(" . Redeem starts at: %s", new Date(redeemStartsAt * 1000));
}

module.exports.tags = ["FlyingFormations"];

export default func;
