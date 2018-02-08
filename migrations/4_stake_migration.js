let MainframeStake = artifacts.require("./ACMainframeStake.sol")
let MainframeToken = artifacts.require("./ACMainframeToken.sol")

module.exports = async (deployer) => {
  await deployer.deploy(MainframeStake, MainframeToken.address)
}
