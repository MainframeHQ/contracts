var MainframeToken = artifacts.require("./MainframeToken.sol");
var MainframeEscrow = artifacts.require("./MainframeEscrow.sol");
const utils = require('./utils.js')

contract("MainframeEscrow", (accounts) => {

  it("should deposit tokens", async () => {
    const tokenContract = await MainframeToken.deployed()
    const escrowContract = await MainframeEscrow.deployed()

    await tokenContract.approve(escrowContract.address, 100, {from: accounts[0], value: 0, gas: 3000000})
    await escrowContract.deposit(accounts[0], 100, {from: accounts[0], value: 0, gas: 3000000})
    const depositorsBalance = await escrowContract.balanceOf(accounts[0])
    const totalBalance = await escrowContract.totalBalance()

    assert.equal(depositorsBalance, 100)
    assert.equal(totalBalance, 100)
  })

  it("should reject deposits if balance is too low", async () => {
    const tokenContract = await MainframeToken.deployed()
    const escrowContract = await MainframeEscrow.deployed()

    await tokenContract.transfer(accounts[1], 100, {from: accounts[0], value: 0, gas: 3000000})
    await tokenContract.approve(escrowContract.address, 100, {from: accounts[0], value: 0, gas: 3000000})

    const didFail = await utils.expectAsyncThrow(async () => {
      await escrowContract.deposit(200, {from: accounts[0], value: 0, gas: 3000000})
    })
    assert(didFail)
  })

  it("should allow withdrawal if balance is high enough", async () => {
    const escrowContract = await MainframeEscrow.deployed()

    await escrowContract.withdraw(accounts[0], 100, {from: accounts[0], value: 0, gas: 3000000})
    const totalBalance = await escrowContract.totalBalance()
    const depositorsBalance = await escrowContract.balanceOf(accounts[0])

    assert.equal(depositorsBalance, 0)
    assert.equal(0, totalBalance)
  })

  it("should reject withdrawal if balance is too low", async () => {
    const escrowContract = await MainframeEscrow.deployed()
    const depositorsBalance = await escrowContract.balanceOf(accounts[0])

    assert.equal(depositorsBalance, 0)
    const didFail = await utils.expectAsyncThrow(async () => {
      await escrowContract.withdraw(1000, {from: accounts[0], value: 0, gas: 3000000})
    })
    assert(didFail)
  })

  it("should reject deposit/withdraw if non-owner requests it", async () => {
    const tokenContract = await MainframeToken.deployed()
    const escrowContract = await MainframeEscrow.deployed()
    const escrowOwner = await escrowContract.owner()
    assert.equal(accounts[0], escrowOwner)

    await tokenContract.approve(escrowContract.address, 10, {from: accounts[1], value: 0, gas: 3000000})
    await escrowContract.deposit(accounts[1], 10, {from: escrowOwner, value: 0, gas: 3000000})

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
