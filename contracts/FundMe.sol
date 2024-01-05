// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {PriceConverter, AggregatorV3Interface} from "./PriceConverter.sol";

error FundMe__NotOwner();
error FundMe__NeedMoreETH(uint256 amount, uint256 required);
error FundMe__CallFailed();

contract FundMe {
    using PriceConverter for uint256;

    AggregatorV3Interface private _priceFeed;
    address private immutable _OWNER;
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;
    address[] private _funders;
    mapping(address => uint256) private _addressToAmountFunded;

    modifier onlyOwner() {
        if (_OWNER != msg.sender) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeed) {
        _priceFeed = AggregatorV3Interface(priceFeed);
        _OWNER = msg.sender;
    }

    receive() external payable {
        fund();
    }

    function fund() public payable {
        if (msg.value.getConversionRate(_priceFeed) < MINIMUM_USD) {
            revert FundMe__NeedMoreETH({
                amount: msg.value.getConversionRate(_priceFeed),
                required: MINIMUM_USD
            });
        }
        _addressToAmountFunded[msg.sender] += msg.value;
        _funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        address[] memory funders_ = _funders;
        for (uint256 funderIndex = 0; funderIndex < funders_.length; funderIndex++) {
            address funder = funders_[funderIndex];
            _addressToAmountFunded[funder] = 0;
        }
        _funders = new address[](0);
        (bool success, ) = _OWNER.call{value: address(this).balance}("");
        if (!success) {
            revert FundMe__CallFailed();
        }
    }

    function getAddressToAmountFunded(address fundingAddress) public view returns (uint256) {
        return _addressToAmountFunded[fundingAddress];
    }

    function getFunder(uint256 index) public view returns (address) {
        return _funders[index];
    }

    function getOwner() public view returns (address) {
        return _OWNER;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return _priceFeed;
    }
}
