let MFToken = artifacts.require("./ACMainframeToken.sol")

module.exports = async (deployer) => {
  await deployer.deploy(MFToken, 10000000000)
}
