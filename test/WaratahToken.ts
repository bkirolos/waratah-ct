import { ethers } from "hardhat";
import chai from "chai";
import { WaratahToken } from "../typechain-types/WaratahToken";
import WaratahTokenArtifact from "../artifacts/contracts/WaratahToken.sol/WaratahToken.json";
import { deployContract } from "ethereum-waffle";
import { utils } from "ethers";

const { parseUnits } = ethers.utils;

const { expect } = chai;

describe("WaratahToken", function () {
  this.timeout(30000);
  describe("basic minting", async () => {
    let token: WaratahToken;

    beforeEach(async () => {
      const [deployer, addr1, addr2] = await ethers.getSigners();
      let saleStartsAt = Math.floor(Date.now() / 1000);
      let redeemStartsAt = Math.floor(Date.now() / 1000);

      token = (await deployContract(deployer, WaratahTokenArtifact, [
        saleStartsAt,
        redeemStartsAt,
        deployer.address,
        deployer.address,
        deployer.address,
      ])) as WaratahToken;
    });
    it("should have minted 0 team tokens to the deployer", async () => {
      const [deployer, addr1, addr2] = await ethers.getSigners();

      expect(await token.balanceOf(deployer.address)).to.eq(0);
    });
    it("should decrease in price as time goes on", async () => {
      await blockSleep(5);
      let latestPrice = await token.getPrice();
      console.log("Latest price: %s", latestPrice);

      expect(latestPrice.gte(ethers.BigNumber.from(0))).to.be.true;

      await blockSleep(1);
      let prevPrice = latestPrice;
      latestPrice = await token.getPrice();
      console.log("Latest price: %s", latestPrice);
      let latestDeductionRate = latestPrice.sub(prevPrice);

      expect(latestDeductionRate).to.equal(-625000000000000);

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
      const [deployer, addr1, addr2] = await ethers.getSigners();
      await blockSleep(5);
      let latestPrice = await token.getPrice();

      await token.buy(deployer.address, 112, { value: latestPrice });

      expect(await token.balanceOf(deployer.address)).to.eq(1);
    });
  });
});

async function blockSleep(ms: number) {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  await ethers.provider.send("evm_mine", [blockBefore.timestamp + ms]);
}
