import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import fs from "fs";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = hre.deployments;
  const {
    deployer,
    footballTeamWallet,
    ducksWallet,
    divisionStWallet,
    wlWallet1,
    wlWallet2,
    wlWallet3,
  } = await hre.getNamedAccounts();

  let buffer = fs.readFileSync("ipfs/metadata-sneaker.cid");
  let cid = buffer.toString().trim();
  let sneakerBaseURI = `ipfs://${cid}/`;

  buffer = fs.readFileSync("ipfs/metadata-standard.cid");
  cid = buffer.toString().trim();
  let standardBaseURI = `ipfs://${cid}/`;

  if (
    hre.network.tags["local"] ||
    hre.network.tags["test"] ||
    hre.network.tags["rinkeby"]
  ) {
    let saleStartsAt = Math.floor(Date.now() / 1000) + 10;

    logDeployInfo(saleStartsAt);

    await deploy("FlyingFormations", {
      from: deployer,
      args: [
        saleStartsAt,
        sneakerBaseURI,
        standardBaseURI,
        [
          { addr: wlWallet1, tokenId: 5 },
          { addr: wlWallet2, tokenId: 50 },
          { addr: wlWallet3, tokenId: 101 },
        ],
        footballTeamWallet,
        ducksWallet,
        divisionStWallet,
      ],
      log: true,
    });
  } else if (hre.network.tags["mainnet"]) {
    let saleStartsAt = Math.floor(Date.now() / 1000) + 10;
    let redeemStartsAt = Math.floor(Date.now() / 1000) + 100;

    logDeployInfo(saleStartsAt);

    await deploy("FlyingFormations", {
      from: deployer,
      args: [
        saleStartsAt,
        sneakerBaseURI,
        standardBaseURI,
        [],
        deployer,
        deployer,
        deployer,
      ],
      log: true,
    });
  }
};

function logDeployInfo(saleStartsAt: number) {
  console.log("Launching token contract with fields...");
  console.log(" . Sale starts at: %s", new Date(saleStartsAt * 1000));
}

export default func;
func.tags = ["FlyingFormations"];
