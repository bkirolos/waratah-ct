// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//    ___   __          _                   
//   / _/  / /  __ __  (_)  ___   ___ _    
//  / _/  / /  / // / / /  / _ \ / _ `/    
// /_/   /_/   \_, / /_/  /_//_/ \_, /     
//            /___/             /___/                                                               
//    ___                          __    _                 
//   / _/ ___   ____  __ _  ___ _ / /_  (_) ___   ___   ___
//  / _/ / _ \ / __/ /  ' \/ _ `// __/ / / / _ \ / _ \ (_-<
// /_/   \___//_/   /_/_/_/\_,_/ \__/ /_/  \___//_//_//___/
//
//

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

contract FlyingFormations is ERC721Enumerable, Ownable, Pausable {
    using SafeMath for uint;
    using Strings for uint256;

    event TokenBought(
      uint tokenId,
      address recipient,
      uint paid,
      uint footballTeamReceives,
      uint ducksReceives,
      uint divisionStreetReceives
    );

    event SneakerRedeemed(
      uint tokenId,
      address recipient
    );

    // uint eth = 1e18 // WETH
    // uint hrs = 1 hours; // HOURS (in seconds)

    // SMALLER AMOUNT & SHORTER DURATION FOR TESTING
    uint eth = 1e16; // WETH
    uint hrs = 1 minutes; // HOURS (in seconds)

    uint price1 = 125*eth/10; // 12.5 ETH
    uint stage1 = 3*hrs; // 3 hours

    uint price2 = 5*eth; // 5 ETH
    uint stage2 = 9*hrs; // 9 hours

    uint floorPrice = 1*eth; // 1 ETH

    uint priceDeductionRate1 = (price1 - price2).div(stage1); // drop to 5.0 ETH at 2 hours
    uint priceDeductionRate2 = (price2 - floorPrice).div(stage2); // drop to 1.0 ETH at 12 hours

    mapping (address => bool) hasPurchased;

    uint saleStartsAt;
    bool redeemEnabled;
    bool redeemExpired;

    string sneakerBaseURI;
    string standardBaseURI;

    struct PremintEntry {
      address addr;
      uint tokenId;
    }

    mapping (uint => address) public sneakerRedeemedBy;

    address payable footballTeamWallet;
    address payable ducksWallet;
    address payable divisionStreetWallet;

    uint constant TEAM_SPLIT = 6750;
    uint constant DUCKS_SPLIT = 1000;

    uint constant MAX_TOKENS = 120;

    constructor(
      uint _saleStartsAt,
      string memory _sneakerBaseURI,
      string memory _standardBaseURI,
      PremintEntry[] memory premintEntries,
      address payable _footballTeamWallet,
      address payable _ducksWallet,
      address payable _divisionStreetWallet
    ) ERC721("Flying Formations", "FFT") {
      saleStartsAt = _saleStartsAt;

      // Set baseURIs for pre-redeem, and
      // post-redeem NFTs
      sneakerBaseURI = _sneakerBaseURI;
      standardBaseURI = _standardBaseURI;

      // Premint tokens for whitelist token recipients
      for(uint i; i < premintEntries.length; i++){
        _mint(premintEntries[i].addr, premintEntries[i].tokenId);
        sneakerRedeemedBy[premintEntries[i].tokenId] = premintEntries[i].addr;
      }

      // Set team wallets
      footballTeamWallet = _footballTeamWallet;
      ducksWallet = _ducksWallet;
      divisionStreetWallet = _divisionStreetWallet;
    }

    function getPrice() public view returns (uint) {
      require(block.timestamp >= saleStartsAt, "FlyingFormations: auction has not started");

      uint elapsedTime = block.timestamp - saleStartsAt;

      if (elapsedTime < stage1) {
        return price1.sub(elapsedTime.mul(priceDeductionRate1));
      } else if (elapsedTime < stage2) {
        return price2.sub(elapsedTime.mul(priceDeductionRate2));
      } else {
        return floorPrice;
      }
    }

    function buy(address recipient, uint tokenId) public payable {
      require(!hasPurchased[msg.sender], "FlyingFormations: User has already bought one NFT");
      require(msg.sender == tx.origin, "FlyingFormations: Account is not an EOA");
      require(block.timestamp >= saleStartsAt, "FlyingFormations: auction has not started");
      require(tokenId <= MAX_TOKENS && tokenId > 0, "FlyingFormations: invalid tokenId");

      uint price = getPrice();

      require(msg.value >= price, "FlyingFormations: insufficient funds sent, please check current price");

      _mint(recipient, tokenId);

      uint footballTeamReceives = msg.value.mul(TEAM_SPLIT).div(10000);
      uint ducksReceives = msg.value.mul(DUCKS_SPLIT).div(10000);
      uint divisionStreetReceives = msg.value
        .sub(footballTeamReceives)
        .sub(ducksReceives);

      footballTeamWallet.transfer(footballTeamReceives);
      ducksWallet.transfer(ducksReceives);
      divisionStreetWallet.transfer(divisionStreetReceives);

      emit TokenBought(tokenId, recipient, price, footballTeamReceives, ducksReceives, divisionStreetReceives);
    }

    // Redeem functionality for claiming Nike Air Max 1 OU Edition
    function redeem(uint tokenId) public {
      require(redeemEnabled, "FlyingFormations: redeem is currently not enabled");
      require(
        sneakerRedeemedBy[tokenId] == address(0x0),
        "FlyingFormations: token has already beened redeemed"
      );
      require(
        msg.sender == ownerOf(tokenId),
        "FlyingFormations: caller is not owner"
      );

      sneakerRedeemedBy[tokenId] = ownerOf(tokenId);
      emit SneakerRedeemed(tokenId, msg.sender);
    }

    function getAllTokens() public view returns (uint[] memory) {
      uint n = totalSupply();
      uint[] memory tokenIds = new uint[](n);

      for(uint i = 0; i < n; i++){
        tokenIds[i] = tokenByIndex(i);
      }
      return tokenIds;
    }

    function updateFootballTeamWallet(address payable _wallet) public onlyOwner {
      footballTeamWallet = _wallet;
    }

    function updateDucksWallet(address payable _wallet) public onlyOwner {
      ducksWallet = _wallet;
    }

    function updateDivisionStreetWallet(address payable _wallet) public onlyOwner {
      divisionStreetWallet = _wallet;
    }

    function updateBaseURI(string calldata __baseURI) public onlyOwner {
      standardBaseURI = __baseURI;
    }

    function updateSneakerBaseURI(string calldata __baseURI) public onlyOwner {
      sneakerBaseURI = __baseURI;
    }

    function updateSaleStartsAt(uint _saleStartsAt) public onlyOwner {
      saleStartsAt = _saleStartsAt;
    }

    function updateRedeemEnabled(bool _redeemEnabled) public onlyOwner {
      redeemEnabled = _redeemEnabled;
    }

    function updateRedeemExpired(bool _redeemExpired) public onlyOwner {
      redeemExpired = _redeemExpired;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
      require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

      if (redeemExpired || sneakerRedeemedBy[tokenId] != address(0x0)){
        return string(abi.encodePacked(standardBaseURI, tokenId.toString(), ".json"));
      } else {
        return string(abi.encodePacked(sneakerBaseURI, tokenId.toString(), ".json"));
      }
    }
}