import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethUsdPriceFeedAddress } from "../../helper-hardhat-config";
import { expect } from "chai";
import { ethers, network } from "hardhat";

network.config.chainId === 11155111
  ? describe.skip
  : describe("FundMe", function () {
      async function deployFundMeFixture() {
        const [deployer, addr1] = await ethers.getSigners();
        const deployerAddress = await deployer.getAddress();

        const fundMe = await ethers.deployContract("FundMe", [ethUsdPriceFeedAddress]);
        await fundMe.waitForDeployment();
        const aggregatorV3 = await ethers.getContractAt(
          "AggregatorV3Interface",
          ethUsdPriceFeedAddress
        );

        return { deployer, addr1, deployerAddress, fundMe, aggregatorV3 };
      }

      describe("Deployment", function () {
        it("Should set the right aggregator address", async function () {
          const { fundMe, aggregatorV3 } = await loadFixture(deployFundMeFixture);
          expect(await fundMe.getPriceFeed()).to.equal(await aggregatorV3.getAddress());
        });

        it("Should set the right owner", async function () {
          const { fundMe, deployerAddress } = await loadFixture(deployFundMeFixture);
          expect(await fundMe.getOwner()).to.equal(deployerAddress);
        });
      });

      describe("fund", function () {
        it("Should fail if we don't send enough ETH", async function () {
          const { fundMe } = await loadFixture(deployFundMeFixture);

          await expect(fundMe.fund({ value: ethers.parseEther("0.01") }))
            .to.be.revertedWithCustomError(fundMe, "FundMe__NeedMoreETH")
            .withArgs(anyValue, ethers.parseEther("50"));
        });

        it("Shouldn't fail if the amount sent is $50 USD", async function () {
          const { fundMe } = await loadFixture(deployFundMeFixture);

          await expect(fundMe.fund({ value: ethers.parseEther("0.04") })).not.to.be.reverted;
        });

        it("Should add the amount funded to mapping", async function () {
          const { fundMe, deployerAddress } = await loadFixture(deployFundMeFixture);

          await fundMe.fund({ value: ethers.parseEther("1") });
          const response = await fundMe.getAddressToAmountFunded(deployerAddress);

          expect(response).to.equal(ethers.parseEther("1"));
        });

        it("Should add funder to funders array", async function () {
          const { fundMe, deployerAddress } = await loadFixture(deployFundMeFixture);

          await fundMe.fund({ value: ethers.parseEther("1") });
          const response = await fundMe.getFunder("0");

          expect(response).to.equal(deployerAddress);
        });

        it("Should call receive() and then fund() if we send ETH directly to contract address", async function () {
          const { fundMe, deployer, deployerAddress } = await loadFixture(deployFundMeFixture);

          const fundMeAddress = await fundMe.getAddress();

          const startingFundMeBalance = await ethers.provider.getBalance(fundMeAddress);

          const tx = {
            to: fundMeAddress,
            value: ethers.parseEther("16"),
          };
          await deployer.sendTransaction(tx);
          const endingFundMeBalance = await ethers.provider.getBalance(fundMeAddress);

          expect(startingFundMeBalance).to.equal(0);
          expect(endingFundMeBalance).to.equal(ethers.parseEther("16"));
          expect(await fundMe.getAddressToAmountFunded(deployerAddress)).to.equal(
            ethers.parseEther("16")
          );
        });
      });

      describe("withdraw", function () {
        it("Should allow single funder to withdraw all their ETH", async function () {
          const { fundMe, deployerAddress } = await loadFixture(deployFundMeFixture);

          const fundMeAddress = await fundMe.getAddress();

          await fundMe.fund({ value: ethers.parseEther("5") });

          const startingDeployerBalance = await ethers.provider.getBalance(deployerAddress);
          const startingFundMeBalance = await ethers.provider.getBalance(fundMeAddress);

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasPrice, gasUsed } = transactionReceipt!;
          const gasCost = gasPrice * gasUsed;

          const endingDeployerBalance = await ethers.provider.getBalance(deployerAddress);
          const endingFundMeBalance = await ethers.provider.getBalance(fundMeAddress);

          expect(endingFundMeBalance).to.equal("0");
          expect(startingFundMeBalance + startingDeployerBalance).to.equal(
            endingDeployerBalance + gasCost
          );
        });

        it("Should allow us to withdraw with multiple funders", async function () {
          const { fundMe, deployerAddress } = await loadFixture(deployFundMeFixture);
          const accounts = await ethers.getSigners();

          await fundMe.fund({ value: ethers.parseEther("1") });
          await fundMe.connect(accounts[1]).fund({ value: ethers.parseEther("1") });
          await fundMe.connect(accounts[2]).fund({ value: ethers.parseEther("1") });
          await fundMe.connect(accounts[3]).fund({ value: ethers.parseEther("1") });
          await fundMe.connect(accounts[4]).fund({ value: ethers.parseEther("1") });

          const startingDeployerBalance = await ethers.provider.getBalance(deployerAddress);
          const startingFundMeBalance = await ethers.provider.getBalance(await fundMe.getAddress());
          // console.log("startingDeployerBalance", ethers.formatEther(startingDeployerBalance));
          // console.log("startingFundMeBalance", ethers.formatEther(startingFundMeBalance));

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasPrice, gasUsed } = transactionReceipt!;
          const gasCost = gasPrice * gasUsed;

          const endingDeployerBalance = await ethers.provider.getBalance(deployerAddress);
          const endingFundMeBalance = await ethers.provider.getBalance(await fundMe.getAddress());
          // console.log("endingDeployerBalance", ethers.formatEther(endingDeployerBalance));
          // console.log("endingFundMeBalance", ethers.formatEther(endingFundMeBalance));

          expect(startingFundMeBalance + startingDeployerBalance).to.equal(
            endingDeployerBalance + gasCost
          );

          await expect(fundMe.getFunder(0)).to.be.reverted;
        });

        it("Should fail if non-owner tries to withdraw ETH", async function () {
          const { fundMe, addr1 } = await loadFixture(deployFundMeFixture);
          await fundMe.fund({ value: ethers.parseEther("12") });

          await expect(fundMe.connect(addr1).withdraw()).to.be.revertedWithCustomError(
            fundMe,
            "FundMe__NotOwner"
          );
        });

        it("reverts when withdraw fails", async () => {
          const failingRecipient = await ethers.deployContract(
            "FailingRecipient",
            [ethUsdPriceFeedAddress],
            {
              value: ethers.parseEther("30"),
            }
          );
          await failingRecipient.waitForDeployment();

          // const failingRecipientAddress = await failingRecipient.getAddress();
          // console.log("failingRecipientAddress:", failingRecipientAddress);

          // const startingFailingRecipientBalance = await ethers.provider.getBalance(failingRecipient);
          // console.log("Starting FailingRecipientBalance Balance:", startingFailingRecipientBalance);

          // const startingFundMeBalance = await failingRecipient.getFundMeBalance();
          // console.log("Starting FundMe Balance:", startingFundMeBalance);

          const fundMeAddress = await failingRecipient.getFundMeAddress();
          const fundMeContract = await ethers.getContractAt("FundMe", fundMeAddress);
          // console.log("FundMe Address:", fundMeAddress);

          await failingRecipient.fundEth();

          // const endingFundMeBalance = await failingRecipient.getFundMeBalance();
          // console.log("Ending FundMe Balance:", endingFundMeBalance);

          // const endingFailingRecipientBalance = await ethers.provider.getBalance(failingRecipient);
          // console.log("Ending FailingRecipientBalance Balance:", endingFailingRecipientBalance);

          await expect(failingRecipient.withdrawEth()).to.be.revertedWithCustomError(
            fundMeContract,
            "FundMe__CallFailed"
          );
        });
      });
    });
