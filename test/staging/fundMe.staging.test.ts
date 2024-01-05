import { expect } from "chai";
import { ethers, network } from "hardhat";

network.config.chainId !== 11155111
  ? describe.skip
  : describe("FundMe Staging Tests", function () {
      it("Should allow people to fund and withdraw", async function () {
        const fundMeAddress = "0xfCa707c19D575Df84d64D64baF89083812732c2F";
        const fundMe = await ethers.getContractAt("FundMe", fundMeAddress);

        console.log(`Sending ${ethers.parseEther("0.05")} ETH to FundMe contract`);
        await fundMe.fund({ value: ethers.parseEther("0.05") });
        const FundMeBalance = await ethers.provider.getBalance(fundMe);
        console.log(`FundMe Balance ${FundMeBalance}`);

        await fundMe.withdraw();

        const endingFundMeBalance = await ethers.provider.getBalance(fundMe);
        console.log("Ending FundMe Balance should be 0, running expect equal...");

        expect(endingFundMeBalance).to.equal(0);
      });
    });
