/* global artifacts */

const MainframeToken = artifacts.require('MainframeToken')
const MainframeStake = artifacts.require('MainframeStake')

module.exports = (deployer, network) => {
  deployer.deploy(MainframeToken).then(() => {
    return deployer.deploy(MainframeStake, MainframeToken.address)
  })
}
