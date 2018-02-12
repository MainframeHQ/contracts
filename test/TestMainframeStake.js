var MainframeStake = artifacts.require("./MainframeStake.sol");
var MainframeToken = artifacts.require("./MainframeToken.sol");

contract('MainframeStake', (accounts) => {

  it("should deposits tokens", async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    await tokenContract.approve(stakeContract.address, 100, { from: accounts[0], value: 0, gas: 3000000 })
    await stakeContract.deposit(100, { from: accounts[0], value: 0, gas: 3000000 })
    const totalStaked = await stakeContract.totalStaked()
    const stakersBalance = await stakeContract.balanceOf(accounts[0])
    assert.equal(stakersBalance, 100)
    assert.equal(totalStaked, 100)
  })

  it("should fail to despoit tokens if balance too low", async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    await tokenContract.transfer(accounts[1], 100, { from: accounts[0], value: 0, gas: 3000000 })
    await tokenContract.approve(stakeContract.address, 100, { from: accounts[0], value: 0, gas: 3000000 })
    let success
    try {
      success = await stakeContract.deposit(200, { from: accounts[0], value: 0, gas: 3000000 })
    } catch (err) {
      success = false
    }
    assert.equal(false, success)
  })

  it("should allow withdraw if balance available", async () => {
    const stakeContract = await MainframeStake.deployed()
    await stakeContract.withdraw(100, { from: accounts[0], value: 0, gas: 3000000 })
    const totalStaked = await stakeContract.totalStaked()
    const stakersBalance = await stakeContract.balanceOf(accounts[0])
    assert.equal(stakersBalance, 0)
    assert.equal(0, totalStaked)
  })

  it("should fail withdraw if balance too low", async () => {
    const stakeContract = await MainframeStake.deployed()
    try {
      await stakeContract.withdraw(1000, { from: accounts[0], value: 0, gas: 3000000 })
    } catch (err) {
      assert(err)
    }
  })

  it("should check address has stake", async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    await tokenContract.approve(stakeContract.address, 100, { from: accounts[0], value: 0, gas: 3000000 })
    await stakeContract.deposit(100, { from: accounts[0], value: 0, gas: 3000000 })
    const hasStake = await stakeContract.hasStake(accounts[0])
    assert.equal(true, hasStake)
  })

})
