import { ethers, deployments, getNamedAccounts } from "hardhat";
import chai from "chai";
import { FlyingFormations } from "../typechain-types/FlyingFormations";
import FlyingFormationsArtifact from "../artifacts/contracts/FlyingFormations.sol/FlyingFormations.json";
import { deployContract } from "ethereum-waffle";
import { utils } from "ethers";

const { parseUnits } = ethers.utils;

const { expect } = chai;

describe("FlyingFormations", function () {
  this.timeout(30000);
  describe("basic minting", async () => {
    let token: FlyingFormations;

    //beforeEach(async () => {
    //  const [deployer, addr1, addr2] = await ethers.getSigners();
    //  let saleStartsAt = Math.floor(Date.now() / 1000);
    //  let redeemStartsAt = Math.floor(Date.now() / 1000);

    //  token = (await deployContract(deployer, FlyingFormationsArtifact, [
    //    saleStartsAt,
    //    "ipfs://SNEAKER_HASH",
    //    "ipfs://STANDARD_HASH",
    //    [],
    //    deployer.address,
    //    deployer.address,
    //    deployer.address,
    //  ])) as FlyingFormations;
    //});
    it("should have minted 0 team tokens to the deployer", async () => {
      await deployments.fixture(["FlyingFormations"]);
      const { deployer } = await getNamedAccounts();
      token = await ethers.getContract("FlyingFormations", deployer);

      expect(await token.balanceOf(deployer)).to.eq(0);
    });
    it("should decrease in price as time goes on", async () => {
      await deployments.fixture(["FlyingFormations"]);
      const { deployer } = await getNamedAccounts();
      token = await ethers.getContract("FlyingFormations", deployer);

      await expect(token.getPrice()).to.be.revertedWith(
        "FlyingFormations: auction has not started"
      );

      await blockSleep(20);
      let latestPrice = await token.getPrice();
      console.log("Latest price: %s", latestPrice);

      expect(latestPrice.gte(ethers.BigNumber.from(0))).to.be.true;

      await blockSleep(1);
      let prevPrice = latestPrice;
      latestPrice = await token.getPrice();
      console.log("Latest price: %s", latestPrice);
      let latestDeductionRate = latestPrice.sub(prevPrice);

      expect(latestDeductionRate).to.equal(-416666666666666);

      await blockSleep(1);
      prevPrice = latestPrice;
      latestPrice = await token.getPrice();
      console.log("Latest price: %s", latestPrice);

      let prevDeductionRate = latestDeductionRate;
      latestDeductionRate = latestPrice.sub(prevPrice);
      expect(latestDeductionRate).to.equal(prevDeductionRate);

      await blockSleep(120);
      prevPrice = await token.getPrice();
      await blockSleep(1);
      latestPrice = await token.getPrice();
      console.log("Latest price: %s", latestPrice);
      latestDeductionRate = latestPrice.sub(prevPrice);
      expect(latestDeductionRate.gte(prevDeductionRate)).to.be.true;
    });
    it("should allow for purchasing at a recently received price", async () => {
      await deployments.fixture(["FlyingFormations"]);
      const { deployer } = await getNamedAccounts();
      token = await ethers.getContract("FlyingFormations", deployer);

      await blockSleep(20);
      let latestPrice = await token.getPrice();

      await token.buy(deployer, 112, { value: latestPrice });

      expect(await token.balanceOf(deployer)).to.eq(1);
      let allTokens = await token.getAllTokens();
      // should have 4 tokens total:
      //  - 3 minted via whitelist
      //  - 1 minted via test
      expect(allTokens.length).to.eq(4);
      expect(await token.ownerOf(112)).to.eq(deployer);
    });
  });
});

async function blockSleep(ms: number) {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  await ethers.provider.send("evm_mine", [blockBefore.timestamp + ms]);
}
