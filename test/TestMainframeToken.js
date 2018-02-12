var MainframeToken = artifacts.require("./MainframeToken.sol")

contract('MainframeToken', (accounts) => {

  it("should be named Mainframe Token", async () => {
    const token = await MainframeToken.deployed()
    const name = await token.name.call()
    assert.equal(name, 'Mainframe Token')
  })

  it("should have symbol MFT", async () => {
    const token = await MainframeToken.deployed()
    const symbol = await token.symbol.call()
    assert.equal(symbol, 'MFT')
  })

  it("should have 8 decimals", async () => {
    const token = await MainframeToken.deployed()
    const decimals = await token.decimals.call()
    assert.equal(decimals, 8)
  })

  it("should assign creator as owner", async () => {
    const token = await MainframeToken.deployed()
    const owner = await token.owner.call()
    assert.equal(owner, accounts[0])
  })

  it("should assign initial token supply to owner", async () => {
    const token = await MainframeToken.deployed()
    const ownersBalance = await token.balanceOf.call(accounts[0])
    assert.equal(1e18, ownersBalance)
  })

  it("should allow transfer of ownership by owner", async () => {
    const token = await MainframeToken.deployed()
    await token.transferOwnership(accounts[1], { from: accounts[0] })
    const owner = await token.owner.call()
    assert.equal(accounts[1], owner)
    await token.transferOwnership(accounts[0], { from: accounts[1] })
  })

  it("should not allow transfer of ownership by non owner", async () => {
    const token = await MainframeToken.deployed()
    try {
      await token.transferOwnership(accounts[0], { from: accounts[1] })
			assert.fail()
    } catch (err) {
			assert(err)
    }
  })

  it("should be pausable and unpausable by owner", async () => {
    const token = await MainframeToken.deployed()
    await token.pause({ from: accounts[0] })
    let paused = await token.paused.call()
    assert.equal(paused, true)

    await token.unpause({ from: accounts[0] })
    paused = await token.paused.call()
    assert.equal(paused, false)
  })

  it("should not be pausable by non owner", async () => {
    const token = await MainframeToken.deployed()
    try {
      await token.pause({ from: accounts[1] })
			assert.fail()
    } catch (err) {
			assert(err)
    }
  })

  it("should not be unpausable by non owner", async () => {
    const token = await MainframeToken.deployed()
    await token.pause({ from: accounts[0] })
    try {
      await token.unpause({ from: accounts[1] })
			assert.fail()
    } catch (err) {
			assert(err)
    }
    await token.unpause({ from: accounts[0] })
  })

  it("should allow transfer of tokens by owner", async () => {
    const token = await MainframeToken.deployed()
    const txAmount = 500
    const starting0Balance = await token.balanceOf(accounts[0])
    const starting1Balance = await token.balanceOf(accounts[1])
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    const ending0Balance = await token.balanceOf(accounts[0])
    const ending1Balance = await token.balanceOf(accounts[1])
    assert.equal(ending0Balance.toNumber(), starting0Balance.toNumber() - txAmount, 'Balance of account 0 incorrect')
    assert.equal(ending1Balance.toNumber(), starting1Balance.toNumber() + txAmount, 'Balance of account 1 incorrect')
  })

  it("should allow transferFrom when address has approved balance", async () => {
    const token = await MainframeToken.deployed()
    const txAmount = 500
    const starting0Balance = await token.balanceOf(accounts[0])
    const starting1Balance = await token.balanceOf(accounts[1])
    await token.approve(accounts[1], txAmount, { from: accounts[0] })
    await token.transferFrom(accounts[0], accounts[1], txAmount, { from: accounts[1] })
    const ending0Balance = await token.balanceOf(accounts[0])
    const ending1Balance = await token.balanceOf(accounts[1])
    assert.equal(ending0Balance.toNumber(), starting0Balance.toNumber() - txAmount, 'Balance of account 0 incorrect')
    assert.equal(ending1Balance.toNumber(), starting1Balance.toNumber() + txAmount, 'Balance of account 1 incorrect')
  })

  it("should not allow approve when paused", async () => {
    const token = await MainframeToken.deployed()
    const txAmount = 500
    await token.pause({ from: accounts[0] })
    try {
      await token.approve(accounts[1], txAmount, { from: accounts[0] })
			assert.fail()
    } catch (err) {
			assert(err)
    }
    await token.unpause({ from: accounts[0] })
  })

  it("should not allow transfer when paused", async () => {
    const token = await MainframeToken.deployed()
    const txAmount = 500
    await token.pause({ from: accounts[0] })
    try {
      await token.transfer(accounts[1], txAmount, { from: accounts[0] })
			assert.fail()
    } catch (err) {
			assert(err)
    }
    await token.unpause({ from: accounts[0] })
  })
})
