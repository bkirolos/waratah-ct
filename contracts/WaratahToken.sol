// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

contract WaratahToken is ERC721Enumerable, Ownable, Pausable {
    using SafeMath for uint;
    using Strings for uint256;

    event TokenBought(
      uint tokenId,
      address recipient,
      uint paid,
      uint teamParticipantsReceives,
      uint ducksReceives,
      uint divisionStreetReceives
    );

    event SneakerRedeemed(
      uint tokenId,
      address recipient
    );

    // uint eth = 1e18 // WETH
    uint eth = 1e16; // WETH (FOR TESTING)
    // uint hrs = 1 hours; // HOURS (in seconds)
    uint hrs = 1 minutes; // HOURS (in seconds)

    uint price1 = 125*eth/10; // 12.5 ETH
    uint stage1 = 2*hrs; // 2 hours

    uint price2 = 5*eth; // 5 ETH
    uint stage2 = 10*hrs; // 10 hours

    uint floorPrice = 1*eth; // 1 ETH

    uint priceDeductionRate1 = (price1 - price2).div(stage1); // drop to 5.0 ETH at 2 hours
    uint priceDeductionRate2 = (price2 - floorPrice).div(stage2); // drop to 1.0 ETH at 12 hours

    uint saleStartsAt;
    uint redeemStartsAt;

    string sneakerBaseURI;
    string standardBaseURI;

    mapping (uint => address) public sneakerRedeemedBy;

    address payable teamParticipantsWallet;
    address payable ducksWallet;
    address payable divisionStreetWallet;

    uint constant TEAM_SPLIT = 6750;
    uint constant DUCKS_SPLIT = 1000;

    uint constant MAX_TOKENS = 120;

    constructor(
      uint _saleStartsAt,
      uint _redeemStartsAt,
      string memory _sneakerBaseURI,
      string memory _standardBaseURI,
      address payable _teamParticipantsWallet,
      address payable _ducksWallet,
      address payable _divisionStreetWallet
    ) ERC721("Waratah", "WRT") {
      saleStartsAt = _saleStartsAt;
      redeemStartsAt = _redeemStartsAt;

      sneakerBaseURI = _sneakerBaseURI;
      standardBaseURI = _standardBaseURI;

      teamParticipantsWallet = _teamParticipantsWallet;
      ducksWallet = _ducksWallet;
      divisionStreetWallet = _divisionStreetWallet;
    }

    function getPrice() public view returns (uint) {
      console.log("Getting price...");
        require(block.timestamp >= saleStartsAt, "auction has not started");

        uint elapsedTime = block.timestamp - saleStartsAt;

        console.log("elapsed time is: %s", elapsedTime);

        if (elapsedTime < stage1) {
          return price1.sub(elapsedTime.mul(priceDeductionRate1));
        } else if (elapsedTime < stage2) {
          return price2.sub(elapsedTime.mul(priceDeductionRate2));
        } else {
          return floorPrice;
        }
    }

    function buy(address recipient, uint tokenId) public payable {
      require(block.timestamp >= saleStartsAt, "FlyingFormations: auction has not started");
      require(tokenId < MAX_TOKENS, "FlyingFormations: invalid tokenId");

      uint price = getPrice();

      require(msg.value >= price, "FlyingFormations: nsufficient funds sent, please check current price");

      _mint(recipient, tokenId);

      uint teamParticipantsReceives = msg.value.mul(TEAM_SPLIT).div(10000);
      uint ducksReceives = msg.value.mul(DUCKS_SPLIT).div(10000);
      uint divisionStreetReceives = msg.value
        .sub(teamParticipantsReceives)
        .sub(ducksReceives);

      teamParticipantsWallet.transfer(teamParticipantsReceives);
      ducksWallet.transfer(ducksReceives);
      divisionStreetWallet.transfer(divisionStreetReceives);

      emit TokenBought(tokenId, recipient, price, teamParticipantsReceives, ducksReceives, divisionStreetReceives);
    }

    function redeem(uint tokenId) public {
      require(
        block.timestamp >= redeemStartsAt,
        "FlyingFormations: redeem window has not opened");
      require(
        msg.sender == ownerOf(tokenId),
        "ERC721Burnable: caller is not owner nor approved"
      );

        sneakerRedeemedBy[tokenId] = ownerOf(tokenId);
      emit SneakerRedeemed(tokenId, msg.sender);
    }

    function getAllTokens() public view returns (uint[] memory allTokens) {
      for(uint i; i < totalSupply(); i++){
        allTokens[i] = tokenByIndex(i);
      }
    }

    function updateTeamParticipantsWallet(address payable _primaryWallet) public onlyOwner {
        teamParticipantsWallet = _primaryWallet;
    }

    function updateDucksWallet(address payable _ducksWallet) public onlyOwner {
        ducksWallet = _ducksWallet;
    }

    function updateDivisionStreetWallet(address payable _divisionStreetWallet) public onlyOwner {
        divisionStreetWallet = _divisionStreetWallet;
    }

    function updateBaseURI(string calldata __baseURI) public onlyOwner {
      standardBaseURI = __baseURI;
    }
    function updateSneakerBaseURI(string calldata __baseURI) public onlyOwner {
      sneakerBaseURI = __baseURI;
    }

     /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory baseURI;

        if (sneakerRedeemedBy[tokenId] == address(0x0)){
          baseURI = standardBaseURI;
        } else {
          baseURI = sneakerBaseURI;
        }

        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    function _baseURI() internal view override returns (string memory) {
      return sneakerBaseURI;
    }
}
