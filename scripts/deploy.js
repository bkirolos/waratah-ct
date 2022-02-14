async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Token = await ethers.getContractFactory("Knots");

  let launchTime = Math.floor(Date.now() / 1000);
  console.log("Launchtime: " + launchTime);
  let tokenMetadata = "ipfs://QmTZYzc5nKKEvrVkZBNKJnGYDeb2bGGmNQw44cMT6wjpnt/";

  const token = await Token.deploy(tokenMetadata, launchTime, [
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address,
  ]);

  console.log("Token address:", token.address);

  await token.redeem(deployer.address, 12345);
  await token.redeem(deployer.address, 12345);
  await token.redeem(deployer.address, 12345);
  await token.redeem(deployer.address, 12345);
  await token.redeem(deployer.address, 12345);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
