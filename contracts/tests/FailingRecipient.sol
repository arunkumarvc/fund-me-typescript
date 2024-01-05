// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {FundMe} from "../FundMe.sol";

error FailingRecipient__CallFailed();

contract FailingRecipient {
    FundMe private _fundMe;

    constructor(address target) payable {
        _fundMe = new FundMe(target);
    }

    function fundEth() public {
        (bool success, ) = address(_fundMe).call{value: 16 ether}("");
        if (!success) {
            revert FailingRecipient__CallFailed();
        }
    }

    function withdrawEth() public {
        _fundMe.withdraw();
    }

    function getFundMeBalance() public view returns (uint256) {
        return address(_fundMe).balance;
    }

    function getFundMeAddress() public view returns (FundMe) {
        return _fundMe;
    }
}
