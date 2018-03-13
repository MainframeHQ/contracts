const MainframeDistribution = artifacts.require('./MainframeTokenDistribution.sol')
const MainframeToken = artifacts.require('./MainframeToken.sol')
const utils = require('./utils.js')

contract('MainframeAirDrop', (accounts) => {

  let tokenContract
  let distributionContract

  beforeEach('setup contracts for each test', async() => {
    tokenContract = await MainframeToken.new();
    distributionContract = await MainframeDistribution.new();
  })

  it('should distribute tokens to correct recipients', async () => {
    const recipients = [
      accounts[1],
      accounts[2],
      accounts[3],
    ]
    const amounts = [
      10000,
      5000,
      2500000,
    ]
    const total = amounts.reduce((a, b) => a + b, 0)
    tokenContract.approve(distributionContract.address, total, { from: accounts[0], value: 0, gas: 3000000 })
    distributionContract.distributeTokens(accounts[0], recipients, amounts, { from: accounts[0], value: 0, gas: 3000000 })
		const balance1 = tokenContract.balanceOf(accounts[1])
    assert.equal(balance1.toString(), amounts[0])
  })
})
