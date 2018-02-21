var MainframeToken = artifacts.require('./MainframeToken.sol');
var MainframeEscrow = artifacts.require('./MainframeEscrow.sol');
const utils = require('./utils.js')

contract('MainframeEscrow', (accounts) => {
  let tokenContract
  let escrowContract

  beforeEach('setup contracts for each test', async() => {
    tokenContract = await MainframeToken.new();
    escrowContract = await MainframeEscrow.new(tokenContract.address);
  })

  it('should should deposit successfully', async () => {
    await tokenContract.approve(escrowContract.address, 100, {from: accounts[0], value: 0, gas: 3000000})
    await escrowContract.deposit(accounts[0], 100, {from: accounts[0], value: 0, gas: 3000000})
    const depositorsBalance = await escrowContract.balanceOf(accounts[0])
    const totalBalance = await escrowContract.totalBalance()
    assert.equal(depositorsBalance, 100)
    assert.equal(totalBalance, 100)
  })

  it('should fail to deposit if balance is too low', async () => {
    await tokenContract.transfer(accounts[1], 100, {from: accounts[0], value: 0, gas: 3000000})
    await tokenContract.approve(escrowContract.address, 100, {from: accounts[1], value: 0, gas: 3000000})
    const didFail = await utils.expectAsyncThrow(async () => {
      await escrowContract.deposit(accounts[1], 200, {from: accounts[0], value: 0, gas: 3000000})
    })
    assert(didFail)
  })

  it('should withdraw successfully if balance is high enough', async () => {
    await tokenContract.transfer(accounts[1], 100, {from: accounts[0], value: 0, gas: 3000000})
    await tokenContract.approve(escrowContract.address, 100, {from: accounts[1], value: 0, gas: 3000000})
    await escrowContract.deposit(accounts[1], 100, {from: accounts[0], value: 0, gas: 3000000})
    await escrowContract.withdraw(accounts[1], 100, {from: accounts[0], value: 0, gas: 3000000})
    const totalBalance = await escrowContract.totalBalance()
    const depositorsBalance = await escrowContract.balanceOf(accounts[0])
    assert.equal(depositorsBalance, 0)
    assert.equal(0, totalBalance)
  })

  it('should reject withdrawal if balance is too low', async () => {
    const depositorsBalance = await escrowContract.balanceOf(accounts[0])
    assert.equal(depositorsBalance, 0)
    const didFail = await utils.expectAsyncThrow(async () => {
      await escrowContract.withdraw(1000, {from: accounts[0], value: 0, gas: 3000000})
    })
    assert(didFail)
  })

  it('should reject deposit/withdraw if staking address is not the caller', async () => {
    const stakingAddress = await accounts[0]
    await tokenContract.transfer(accounts[1], 10, {from: accounts[0], value: 0, gas: 3000000})
    await tokenContract.approve(escrowContract.address, 10, {from: accounts[1], value: 0, gas: 3000000})
    await escrowContract.deposit(accounts[1], 10, {from: stakingAddress, value: 0, gas: 3000000})

    const totalBalance = await escrowContract.totalBalance()
    const depositorsBalance = await escrowContract.balanceOf(accounts[1])

    const depositDidFail = await utils.expectAsyncThrow(async () => {
      await tokenContract.approve(escrowContract.address, 10, {from: accounts[1], value: 0, gas: 3000000})
      await escrowContract.deposit(accounts[1], 10, {from: accounts[1], value: 0, gas: 3000000})
    })
    assert(depositDidFail)

    const withdrawDidFail = await utils.expectAsyncThrow(async () => {
      await escrowContract.withdraw(accounts[1], 10, {from: accounts[1], value: 0, gas: 3000000})
    })
    assert(withdrawDidFail)

    assert.equal(depositorsBalance, 10)
    assert.equal(10, totalBalance)
  })
})
