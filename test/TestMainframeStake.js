const MainframeStake = artifacts.require('./MainframeStake.sol')
const MainframeToken = artifacts.require('./MainframeToken.sol')
const utils = require('./utils.js')

contract('MainframeStake', (accounts) => {

  it('should deposit tokens', async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    const maxDeposit = await stakeContract.maxDeposit()
    await tokenContract.approve(stakeContract.address, maxDeposit, { from: accounts[0], value: 0, gas: 3000000 })
    await stakeContract.deposit(maxDeposit, { from: accounts[0], value: 0, gas: 3000000 })
    const totalStaked = await stakeContract.totalStaked()
    const stakersBalance = await stakeContract.balanceOf(accounts[0])
    assert.equal(stakersBalance.toNumber(), maxDeposit)
    assert.equal(totalStaked.toNumber(), maxDeposit)
    // reset
    await stakeContract.withdraw(maxDeposit, { from: accounts[0], value: 0, gas: 3000000 })
  })

  it('should fail to deposit tokens if balance too low', async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    const maxDeposit = await stakeContract.maxDeposit()
    await tokenContract.approve(stakeContract.address, maxDeposit, { from: accounts[1], value: 0, gas: 3000000 })
    const didFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.deposit(maxDeposit, { from: accounts[1], value: 0, gas: 3000000 })
    })
    assert(didFail)
  })

  it('should fail to deposit tokens if it pushes balance over deposit limit', async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    const maxDeposit = await stakeContract.maxDeposit()
    const deposit = maxDeposit + 5
    await tokenContract.approve(stakeContract.address, deposit, { from: accounts[0], value: 0, gas: 3000000 })
    const didFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.deposit(200, { from: accounts[0], value: 0, gas: 3000000 })
    })
    assert(didFail)
  })

  it('should allow withdraw if balance available', async () => {
    const stakeContract = await MainframeStake.deployed()
    const tokenContract = await MainframeToken.deployed()
    const maxDeposit = await stakeContract.maxDeposit()

    await tokenContract.approve(stakeContract.address, maxDeposit, { from: accounts[0], value: 0, gas: 3000000 })
    await stakeContract.deposit(maxDeposit, { from: accounts[0], value: 0, gas: 3000000 })
    const totalStaked = await stakeContract.totalStaked()
    const stakersBalance = await stakeContract.balanceOf(accounts[0])
    assert.equal(stakersBalance, maxDeposit.toNumber())
    assert.equal(totalStaked, maxDeposit.toNumber())

    await stakeContract.withdraw(maxDeposit, { from: accounts[0], value: 0, gas: 3000000 })
    const totalStakedAfter = await stakeContract.totalStaked()
    const stakersBalanceAfter = await stakeContract.balanceOf(accounts[0])
    assert.equal(totalStakedAfter, 0)
    assert.equal(0, stakersBalanceAfter)
  })

  it('should fail withdraw if balance too low', async () => {
    const stakeContract = await MainframeStake.deployed()
    const didFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.withdraw(1000, { from: accounts[0], value: 0, gas: 3000000 })
    })
    assert(didFail)
  })

  it('should check address has stake', async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    const maxDeposit = await stakeContract.maxDeposit()
    await tokenContract.approve(stakeContract.address, maxDeposit, { from: accounts[0], value: 0, gas: 3000000 })
    await stakeContract.deposit(maxDeposit, { from: accounts[0], value: 0, gas: 3000000 })
    const hasStake = await stakeContract.hasStake(accounts[0])
    assert(hasStake)
  })

  it('should allow owner to update max deposit', async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    const initialMaxDeposit = await stakeContract.maxDeposit()
    assert(initialMaxDeposit !== 10)
    await stakeContract.setMaxDeposit(10, { from: accounts[0], value: 0, gas: 3000000 })
    const updatedMaxDeposit = await stakeContract.maxDeposit()
    assert.equal(updatedMaxDeposit, 10)
  })

})
