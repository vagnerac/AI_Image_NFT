//Contract based on https://docs.openzeppelin.com/contracts/3.x/erc721
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


contract AIImgNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("AIImgNFT", "AIT") {}

    function mintToken(address addressTo, string memory tokenURI) public virtual payable {

        require(msg.value >= 10, "Not enough ETH sent; check price!");

        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();

        _mint(addressTo, newItemId);
        _setTokenURI(newItemId, tokenURI);
    }
}