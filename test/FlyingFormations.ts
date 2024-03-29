import {
  ethers,
  deployments,
  getNamedAccounts,
  getUnnamedAccounts,
} from "hardhat";
import chai from "chai";
import { FlyingFormations } from "../typechain-types/FlyingFormations";
import FlyingFormationsArtifact from "../artifacts/@contracts/FlyingFormations.sol/FlyingFormations.json";
import { deployContract } from "ethereum-waffle";
import { BigNumber, utils } from "ethers";
import { setupUser, setupUsers } from "./utils";

const { parseUnits } = ethers.utils;

const { expect } = chai;

// variable multiplier for auction timing
// should correspond with "hrs" variable in smart contract
const MINUTES_MULTIPLIER = 60;

const setup = deployments.createFixture(async () => {
  await deployments.fixture("FlyingFormations");
  const { deployer, footballTeamWallet, ducksWallet, divisionStWallet } =
    await getNamedAccounts();
  const contracts = {
    token: <FlyingFormations>await ethers.getContract("FlyingFormations"),
  };
  const users = await setupUsers(await getUnnamedAccounts(), contracts);
  return {
    ...contracts,
    users,
    deployer: await setupUser(deployer, contracts),
    divisionStWallet: await setupUser(divisionStWallet, contracts),
    footballTeamWallet: await setupUser(footballTeamWallet, contracts),
    ducksWallet: await setupUser(ducksWallet, contracts),
  };
});

describe("FlyingFormations", function () {
  this.timeout(30000);
  describe("auction & basic minting", async () => {
    it("Should exactly match expected price points at points in time", async () => {
      const { deployer, token } = await setup();

      let blockTime = await latestBlocktime();
      let startTime = blockTime + 100 * MINUTES_MULTIPLIER;
      console.log("Setting start time: " + startTime);
      await token.updateSaleStartsAt(startTime);

      await expect(token.getPrice()).to.be.revertedWith(
        "FlyingFormations: auction has not started"
      );

      await blockSleep(100 * MINUTES_MULTIPLIER - 1);
      console.log(await latestBlocktime());
      expect(utils.formatEther(await token.getPrice())).to.eq("12.5");
      await blockSleep(180 * MINUTES_MULTIPLIER);
      expect(utils.formatEther(await token.getPrice())).to.eq("5.0");
      await blockSleep(540 * MINUTES_MULTIPLIER);
      expect(utils.formatEther(await token.getPrice())).to.eq("1.0");
      await blockSleep(1000 * MINUTES_MULTIPLIER);
      expect(utils.formatEther(await token.getPrice())).to.eq("1.0");
    });

    it("should have minted 0 team tokens to the deployer, 3 tokens in total", async () => {
      const { deployer, token } = await setup();

      expect(await token.balanceOf(deployer.address)).to.eq(0);
      let allTokens = await token.getAllTokens();

      let tokenIds = allTokens.map((i) => i.toNumber());
      expect(tokenIds).to.deep.equal([5, 50, 101]);
    });

    it("should decrease in price as time goes on", async () => {
      const { deployer, token } = await setup();

      await expect(token.getPrice()).to.be.revertedWith(
        "FlyingFormations: auction has not started"
      );

      // wait until auction starts
      await blockSleepMult(15);
      let latestPrice = await token.getPrice();
      console.log("       Latest price: %s", latestPrice);

      expect(latestPrice.gte(ethers.BigNumber.from(0))).to.be.true;

      await blockSleepMult(1);
      let prevPrice = latestPrice;
      latestPrice = await token.getPrice();
      console.log("       Latest price: %s", latestPrice);
      let latestDeductionRate = latestPrice.sub(prevPrice);

      await blockSleepMult(1);
      prevPrice = latestPrice;
      latestPrice = await token.getPrice();
      console.log("       Latest price: %s", latestPrice);

      let prevDeductionRate = latestDeductionRate;
      latestDeductionRate = latestPrice.sub(prevPrice);
      expect(latestDeductionRate).to.equal(prevDeductionRate);

      await blockSleepMult(120);
      prevPrice = await token.getPrice();
      await blockSleepMult(1);
      latestPrice = await token.getPrice();
      console.log("       Latest price: %s", latestPrice);
      latestDeductionRate = latestPrice.sub(prevPrice);
      expect(latestDeductionRate.gte(prevDeductionRate)).to.be.true;

      // stops decreasing when it hits the floor
      await blockSleepMult(1000);
      let floorPrice = await token.getPrice();
      console.log("       Floor price: %s", floorPrice);

      await blockSleepMult(2000);
      latestPrice = await token.getPrice();
      expect(latestPrice).to.equal(floorPrice);

      await blockSleepMult(3000);
      latestPrice = await token.getPrice();
      expect(latestPrice).to.equal(floorPrice);
    });

    it("should allow for purchasing at a recently received price", async () => {
      const { token, deployer } = await setup();

      // wait until auction starts
      await blockSleepMult(15);
      let latestPrice = await token.getPrice();

      await token.buy(deployer.address, 112, { value: latestPrice });

      expect(await token.balanceOf(deployer.address)).to.eq(1);
      let allTokens = await token.getAllTokens();
      // should have 4 tokens total:
      //  - 3 minted via whitelist
      //  - 1 minted via test
      expect(allTokens.length).to.eq(4);
      expect(await token.ownerOf(112)).to.eq(deployer.address);
    });

    it("will not mint to the same wallet more than once", async () => {
      const { deployer, token, users } = await setup();

      // wait until auction starts
      await blockSleepMult(15);
      let latestPrice = await token.getPrice();

      await users[0].token.buy(users[0].address, 22, { value: latestPrice });

      expect(await token.balanceOf(users[0].address)).to.eq(1);

      latestPrice = await token.getPrice();
      await expect(
        users[0].token.buy(users[0].address, 23, { value: latestPrice })
      ).to.be.revertedWith("FlyingFormations: User has already bought one NFT");
    });

    it("will distribute funds appropriately", async () => {
      const {
        deployer,
        token,
        footballTeamWallet,
        divisionStWallet,
        ducksWallet,
      } = await setup();
      let initFbBal = await ethers.provider.getBalance(
        footballTeamWallet.address
      );
      let initDsBal = await ethers.provider.getBalance(
        divisionStWallet.address
      );
      let initDucksBal = await ethers.provider.getBalance(ducksWallet.address);

      // wait until auction starts
      await blockSleepMult(15);
      let latestPrice = await token.getPrice();
      token.buy(deployer.address, 55, { value: latestPrice });

      let fbReceives = (
        await ethers.provider.getBalance(footballTeamWallet.address)
      ).sub(initFbBal);
      let dsReceives = (
        await ethers.provider.getBalance(divisionStWallet.address)
      ).sub(initDsBal);
      let ducksReceives = (
        await ethers.provider.getBalance(ducksWallet.address)
      ).sub(initDucksBal);

      // check ducks balance
      expect(ducksReceives.mul(10000).div(latestPrice)).to.gte(
        BigNumber.from(999)
      );
      expect(ducksReceives.mul(10000).div(latestPrice)).to.lte(
        BigNumber.from(1001)
      );

      // check fb balance
      expect(fbReceives.mul(10000).div(latestPrice)).to.gte(
        BigNumber.from(6749)
      );
      expect(fbReceives.mul(10000).div(latestPrice)).to.lte(
        BigNumber.from(6751)
      );

      // check ds balance
      expect(dsReceives.mul(10000).div(latestPrice)).to.gte(
        BigNumber.from(2249)
      );
      expect(dsReceives.mul(10000).div(latestPrice)).to.lte(
        BigNumber.from(2251)
      );

      expect(dsReceives.add(ducksReceives).add(fbReceives)).to.eq(latestPrice);
    });

    it("will not mint token ids out of bounds", async () => {
      const { token, users } = await setup();

      // wait until auction starts
      await blockSleepMult(15);
      let latestPrice = await token.getPrice();

      await expect(
        users[1].token.buy(users[1].address, 222, { value: latestPrice })
      ).to.be.revertedWith("invalid tokenId");

      await expect(
        users[1].token.buy(users[1].address, 0, { value: latestPrice })
      ).to.be.revertedWith("invalid tokenId");

      await expect(
        users[1].token.buy(users[1].address, 121, { value: latestPrice })
      ).to.be.revertedWith("invalid tokenId");
    });
  });

  describe("redeem functionality", async () => {
    it("will not let users redeem until redeem is turned on", async () => {
      const { token, users } = await setup();

      // wait until auction starts
      await blockSleepMult(15);
      let latestPrice = await token.getPrice();
      await users[1].token.buy(users[1].address, 6, { value: latestPrice });

      await expect(users[1].token.redeem(6)).to.be.revertedWith(
        "FlyingFormations: redeem is currently not enabled"
      );
    });

    it("only allows redeem to be called by owner of token, and not by others after", async () => {
      const { token, users } = await setup();

      // wait until auction starts
      await blockSleepMult(15);
      let latestPrice = await token.getPrice();
      await users[0].token.buy(users[0].address, 6, { value: latestPrice });
      await users[1].token.buy(users[0].address, 7, { value: latestPrice });

      token.updateRedeemEnabled(true);

      users[0].token.redeem(6);
      expect(await token.ownerOf(6)).to.eq(users[0].address);

      users[0].token.transferFrom(users[0].address, users[1].address, 6);

      await expect(users[1].token.redeem(6)).to.be.revertedWith(
        "FlyingFormations: token has already beened redeemed"
      );

      expect(await token.sneakerRedeemedBy(6)).to.eq(users[0].address);

      expect(await token.tokenURI(6)).to.eq("ipfs://standard_base_uri/6.json");
      expect(await token.tokenURI(7)).to.eq("ipfs://sneaker_base_uri/7.json");
      expect(await token.tokenURI(5)).to.eq("ipfs://standard_base_uri/5.json");
    });

    //it("does not allow redeem to be called again by a later owner", async () => {
    //  const { token, users } = await setup();

    //  // wait until auction starts
    //  await blockSleepMult(15);
    //  let latestPrice = await token.getPrice();
    //  await users[0].token.buy(users[0].address, 6, { value: latestPrice });

    //  token.updateRedeemEnabled(true);

    //  await expect(users[1].token.redeem(6)).to.be.revertedWith(
    //    "FlyingFormations: caller is not owner"
    //  );
    //});

    // it("will not allow users to call owner-only functions", () =>)
    // it("will not allow user to buy at lower price")
    // it("stores successful redeems and updates metadata")
    // it("does not allow token to be redeemed more than once, even if transferred")
    // it("transfers the corect amount of funds to the team wallets")
  });
});

async function blockSleep(s: number) {
  //s = s * MINUTES_MULTIPLIER - 1;
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  await ethers.provider.send("evm_mine", [blockBefore.timestamp + s]);
}

async function blockSleepMult(s: number) {
  s = s * MINUTES_MULTIPLIER - 1;
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  await ethers.provider.send("evm_mine", [blockBefore.timestamp + s]);
}

async function latestBlocktime() {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  return blockBefore.timestamp;
}
