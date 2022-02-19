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

  buffer = fs.readFileSync("ipfs/metadata-placeholder.cid");
  cid = buffer.toString().trim();
  let placeholderBaseURI = `ipfs://${cid}/`;

  if (hre.network.tags["local"] || hre.network.tags["test"]) {
    let saleStartsAt = Math.floor(Date.now() / 1000) + 10;

    logDeployInfo(saleStartsAt);

    await deploy("FlyingFormations", {
      from: deployer,
      args: [
        saleStartsAt,
        "ipfs://sneaker_base_uri",
        "ipfs://standard_base_uri",
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
  } else if (hre.network.tags["mainnet"] || hre.network.tags["rinkeby"]) {
    let saleStartsAt = Math.floor(Date.now() / 1000) + 10;

    logDeployInfo(saleStartsAt);

    await deploy("FlyingFormations", {
      from: deployer,
      args: [
        saleStartsAt,
        sneakerBaseURI,
        placeholderBaseURI,
        // TEST ADDRESSES DO NOT USE IN PRODUCTION
        [
          { addr: "0xf4bBCbFf51e61D0D95FcC5016609aC8354B177C4", tokenId: 30 },
          { addr: "0xb0ac662f58d3507a6f4a37f8532df201d9010fe7", tokenId: 85 },
          { addr: "0xc0ac662f58d3507a6f4a37f8532df201d9010fe7", tokenId: 89 },
          { addr: "0x589717c0B1Ab0f188235CfA487CeD32fEEbF9698", tokenId: 23 },
          { addr: "0xbD40Ad5c8F59D140869504a55295Ae650078fc41", tokenId: 117 },
          { addr: "0x1b5aC9107e0FfADCB5fa9bc9AAf42C9094693d47", tokenId: 118 },
          { addr: "0x0d21d7CB36f0BD063C99B9Fc7565335Fa24029D5", tokenId: 119 },
          { addr: "0xb8BAd4743Bbdd8817D0042f82e350C29B728ec72", tokenId: 11 },
          { addr: "0x7094b9De66790E0a5aB0e3299D38AFB037be458B", tokenId: 84 },
          { addr: "0x24C1316c11Ee8086BDCF051680025f61c276e58a", tokenId: 111 },
        ],
        "0x1a003aE61B44A3eD1fAfBf8549856a4Da9c7312E",
        "0x7afa12A8708C7069Cde17d4D3c90f01AA6653797",
        "0x15b7f743e2bcBA33320e26d145D7628149D73337",
      ],
      log: true,
    });
  } else if (hre.network.tags["mainnet"] || hre.network.tags["rinkeby"]) {
    // ENSURE SALE STARTE IS CORRECT
    // ENSURE URIS ARE CORRECT
    // ENSURE PAYMENT ADDRESSES ARE CORRECT
    // ENSURE WHITELIST ADDRESSES ARE CORRECT
    let saleStartsAt = Math.floor(Date.now() / 1000) + 10;

    logDeployInfo(saleStartsAt);

    await deploy("FlyingFormations", {
      from: deployer,
      args: [
        saleStartsAt,
        sneakerBaseURI,
        placeholderBaseURI,
        [
          { addr: "", tokenId: 30 },
          { addr: "", tokenId: 85 },
          { addr: "", tokenId: 89 },
          { addr: "", tokenId: 23 },
          { addr: "", tokenId: 117 },
          { addr: "", tokenId: 118 },
          { addr: "", tokenId: 119 },
          { addr: "", tokenId: 11 },
          { addr: "", tokenId: 84 },
          { addr: "", tokenId: 111 },
        ],
        "0x1a003aE61B44A3eD1fAfBf8549856a4Da9c7312E",
        "0x7afa12A8708C7069Cde17d4D3c90f01AA6653797",
        "0x15b7f743e2bcBA33320e26d145D7628149D73337",
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
