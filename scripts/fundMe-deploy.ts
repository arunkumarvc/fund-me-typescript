import { ethers } from "hardhat";
import { ethUsdPriceFeedAddress } from "../helper-hardhat-config";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", await deployer.getAddress());

  const fundMe = await ethers.deployContract("FundMe", [ethUsdPriceFeedAddress]);
  await fundMe.waitForDeployment();
  console.log("FundMe address:", await fundMe.getAddress());
  console.log("Contract deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
