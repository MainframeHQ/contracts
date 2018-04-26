/* global artifacts */

const MainframeToken = artifacts.require('MainframeToken')
const MainframeStake = artifacts.require('MainframeStake')
const MainframeEscrow = artifacts.require('MainframeEscrow')

module.exports = (deployer, network) => {
  deployer.deploy(MainframeEscrow, MainframeToken.address).then(() => {
    return deployer.deploy(MainframeStake, MainframeEscrow.address)
  })
}
