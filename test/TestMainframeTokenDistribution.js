const MainframeDistribution = artifacts.require('./MainframeTokenDistribution.sol')
const MainframeToken = artifacts.require('./MainframeToken.sol')

contract('MainframeAirDrop', (accounts) => {

  let tokenContract
  let distributionContract

  beforeEach('setup contracts for each test', async() => {
    tokenContract = await MainframeToken.new();
    distributionContract = await MainframeDistribution.new(tokenContract.address);
  })

  it('should distribute tokens to correct recipients', async () => {
    const recipients = [
      accounts[1],
      accounts[2],
      accounts[3],
    ]
    const amounts = [10000, 5000, 2500000]
    const total = amounts.reduce((a, b) => a + b, 0)
    await tokenContract.turnOnTradeable({ from: accounts[0] })
    await tokenContract.approve(distributionContract.address, total, { from: accounts[0], value: 0, gas: 3000000 })
    await distributionContract.distributeTokens(accounts[0], recipients, amounts, { from: accounts[0], value: 0, gas: 3000000 })
    const balance1 = await tokenContract.balanceOf(accounts[1])
    const balance2 = await tokenContract.balanceOf(accounts[2])
    const balance3 = await tokenContract.balanceOf(accounts[3])
    assert.equal(balance1.toString(), amounts[0])
    assert.equal(balance2.toString(), amounts[1])
    assert.equal(balance3.toString(), amounts[2])
  })
})
