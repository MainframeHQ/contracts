/* global artifacts */

const MainframeToken = artifacts.require('MainframeToken')
const MainframeStake = artifacts.require('MainframeStake')

module.exports = (deployer, network) => {
  deployer.deploy(MainframeStake, MainframeToken.address)
}
