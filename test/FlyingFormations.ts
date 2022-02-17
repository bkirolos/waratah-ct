import { ethers } from "hardhat";
import chai from "chai";
import { FlyingFormations } from "../typechain-types/FlyingFormations";
import FlyingFormationsArtifact from "../artifacts/contracts/FlyingFormations.sol/FlyingFormations.json";
import { deployContract } from "ethereum-waffle";
import { utils } from "ethers";

const { parseUnits } = ethers.utils;

const { expect } = chai;

describe("WaratahToken", function () {
  this.timeout(30000);
  describe("basic minting", async () => {
    let token: FlyingFormations;

    beforeEach(async () => {
      const [deployer, addr1, addr2] = await ethers.getSigners();
      let saleStartsAt = Math.floor(Date.now() / 1000);
      let redeemStartsAt = Math.floor(Date.now() / 1000);

      token = (await deployContract(deployer, FlyingFormationsArtifact, [
        saleStartsAt,
        redeemStartsAt,
        "ipfs://SNEAKER_HASH",
        "ipfs://STANDARD_HASH",
        [],
        deployer.address,
        deployer.address,
        deployer.address,
      ])) as FlyingFormations;
    });
    it("should have minted 0 team tokens to the deployer", async () => {
      const [deployer, addr1, addr2] = await ethers.getSigners();

      expect(await token.balanceOf(deployer.address)).to.eq(0);
    });
    it("should decrease in price as time goes on", async () => {
      await blockSleep(10);
      let latestPrice = await token.getPrice();
      console.log("Latest price: %s", latestPrice);

      expect(latestPrice.gte(ethers.BigNumber.from(0))).to.be.true;

      await blockSleep(1);
      let prevPrice = latestPrice;
      latestPrice = await token.getPrice();
      console.log("Latest price: %s", latestPrice);
      let latestDeductionRate = latestPrice.sub(prevPrice);

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

      // stops decreasing when it hits the floor
      await blockSleep(1000);
      let floorPrice = await token.getPrice();
      console.log("Floor price: %s", floorPrice);

      await blockSleep(2000);
      latestPrice = await token.getPrice();
      expect(latestPrice).to.equal(floorPrice);

      await blockSleep(3000);
      latestPrice = await token.getPrice();
      expect(latestPrice).to.equal(floorPrice);
    });
    it("will not mint to the same wallet more than once", async () => {
      const [deployer, addr1, addr2] = await ethers.getSigners();
      await blockSleep(5);
      let latestPrice = await token.getPrice();

      await token.buy(addr2.address, 22, { value: latestPrice });

      expect(await token.balanceOf(addr2.address)).to.eq(1);

      latestPrice = await token.getPrice();
      await token.buy(addr2.address, 23, { value: latestPrice });

      // TODO: update when cory pushes this code
      // expect(await token.balanceOf(addr2.address)).to.eq(1);
    });
    it("will not mint token ids out of bounds", async () => {
      const [deployer, addr1, addr2] = await ethers.getSigners();
      await blockSleep(5);
      let latestPrice = await token.getPrice();

      await expect(
        token.buy(addr2.address, 222, { value: latestPrice })
      ).to.be.revertedWith("invalid tokenId");

      // TODO: update when cory pushes this code
      // await expect(
      //   token.buy(addr2.address, 0, { value: latestPrice })
      // ).to.be.revertedWith("invalid tokenId");

      await expect(
        token.buy(addr2.address, 121, { value: latestPrice })
      ).to.be.revertedWith("invalid tokenId");
    });
    it("will not let users redeem until redeem is turned on", async () => {
      const [deployer, addr1, addr2] = await ethers.getSigners();
      await blockSleep(5);
      let latestPrice = await token.getPrice();
      await token.buy(addr1.address, 5, { value: latestPrice });

      const contract = await token.connect(addr1);

      // TODO: update when cory pushes code
      // await contract.redeem(5);
    });
    // it("will not allow users to call owner-only functions", () =>)
    // it("will not allow user to buy at lower price")
    // it("stores successful redeems and updates metadata")
    // it("does not allow token to be redeemed more than once, even if transferred")
    // it ("only allows redeem to be called by owner of token")
    it("should allow for purchasing at a recently received price", async () => {
      const [deployer, addr1, addr2] = await ethers.getSigners();
      await blockSleep(5);
      let latestPrice = await token.getPrice();

      await token.buy(deployer.address, 112, { value: latestPrice });

      expect(await token.balanceOf(deployer.address)).to.eq(1);
      let allTokens = await token.getAllTokens();
      expect(allTokens.length).to.eq(1);
      expect(allTokens[0].toNumber()).to.eq(112);
    });
  });
});

async function blockSleep(ms: number) {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  await ethers.provider.send("evm_mine", [blockBefore.timestamp + ms]);
}
