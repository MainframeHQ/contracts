/* global artifacts */

const MainframeToken = artifacts.require('MainframeToken')
const MainframeStake = artifacts.require('MainframeStake')
const MainframeTokenDistribution = artifacts.require('MainframeTokenDistribution')
const MainframeEscrow = artifacts.require('MainframeEscrow')

module.exports = (deployer, network) => {
  deployer.deploy(MainframeToken)
}
