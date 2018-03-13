/* global artifacts */

const MainframeToken = artifacts.require('MainframeToken')
const MainframeStake = artifacts.require('MainframeStake')
const MainframeTokenDistribution = artifacts.require('MainframeTokenDistribution')

module.exports = (deployer, network) => {
  deployer.deploy(MainframeToken).then(() => {
    deployer.deploy(MainframeStake, MainframeToken.address).then(() => {
      console.log(MainframeToken)
      return deployer.deploy(MainframeTokenDistribution, MainframeToken.address)
    })
  })
}
