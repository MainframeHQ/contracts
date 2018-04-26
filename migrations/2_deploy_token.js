/* global artifacts */

const MainframeToken = artifacts.require('MainframeToken')

module.exports = (deployer, network) => {
  deployer.deploy(MainframeToken)
}
