/* global artifacts */

const MainframeToken = artifacts.require('MainframeToken')
const MainframeDistribution = artifacts.require('MainframeTokenDistribution')

module.exports = (deployer, network) => {
  deployer.deploy(MainframeDistribution, MainframeToken.address)
}
