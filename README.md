# Waratah Contracts

## Install

`yarn install`

## Compile

`npx hardhat compile`

## Deploy

`npx hardhat deploy --network <rinkeby|mainnet>`

## Use in front-end app

For basic use in a front-end app, plop this repo next to your
front-end repo and setup a Makefile in the front-end repo with
the following tasks:
```make
contracts:
	cp -r ../$CONTRACTS_REPO/deployments/* ./src/contracts/deployments/
	cp -r ../$CONTRACTS_REPO/typechain-types/* ./src/contracts/typechain-types/
	cp ../$CONTRACTS_REPO/index.ts ./src/contracts/index.ts
```

You can then run `make contracts` from the front-end app whenever
you want to pull in recent changes from the contracts.
