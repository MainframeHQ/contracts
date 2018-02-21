const MainframeToken = artifacts.require('./MainframeToken.sol')
const BigNumber = require('bignumber.js');
const utils = require('./utils.js')

contract('MainframeToken', (accounts) => {
  let token

  beforeEach('setup contract for each test', async() => {
    token = await MainframeToken.new();
  })

  it('should be named Mainframe Token', async () => {
    const name = await token.name.call()
    assert.equal(name, 'Mainframe Token')
  })

  it('should have symbol MFT', async () => {
    const symbol = await token.symbol.call()
    assert.equal(symbol, 'MFT')
  })

  it('should have 18 decimals', async () => {
    const decimals = await token.decimals.call()
    assert.equal(decimals, 18)
  })

  it('should assign creator as owner', async () => {
    const owner = await token.owner.call()
    assert.equal(owner, accounts[0])
  })

  it('should assign initial token supply to owner', async () => {
    const ownersBalance = await token.balanceOf.call(accounts[0])
    const expected = new BigNumber(10000000000 * 10**18)
    assert.equal(expected.toString(), ownersBalance.toString())
  })

  it('should allow transfer of ownership by owner', async () => {
    await token.transferOwnership(accounts[1], { from: accounts[0] })
    const owner = await token.owner.call()
    assert.equal(accounts[1], owner)
    await token.transferOwnership(accounts[0], { from: accounts[1] })
  })

  it('should not allow transfer of ownership by non owner', async () => {
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.transferOwnership(accounts[0], { from: accounts[1] })
    })
    assert(didFail)
  })

  it('should be pausable and unpausable by owner', async () => {
    await token.pause({ from: accounts[0] })
    utils.assertEvent(token, { event: 'Pause' })
    let paused = await token.paused.call()
    assert.equal(paused, true)

    await token.unpause({ from: accounts[0] })
    paused = await token.paused.call()
    assert.equal(paused, false)
  })

  it('should not be pausable by non owner', async () => {
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.pause({ from: accounts[1] })
    })
    assert(didFail)
  })

  it('should not be unpausable by non owner', async () => {
    await token.pause({ from: accounts[0] })
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.unpause({ from: accounts[1] })
    })
    assert(didFail)
    await token.unpause({ from: accounts[0] })
  })

  it('should allow transfer of tokens by owner', async () => {
    const txAmount = 500
    const starting0Balance = await token.balanceOf(accounts[0])
    const starting1Balance = await token.balanceOf(accounts[1])
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    utils.assertEvent(token, { event: 'Transfer' })
    const ending0Balance = await token.balanceOf(accounts[0])
    const ending1Balance = await token.balanceOf(accounts[1])
    const expected0Bal = starting0Balance.minus(txAmount)
    const expected1Bal = starting1Balance.plus(txAmount)
    assert.equal(ending0Balance.toString(), expected0Bal.toString(), 'Balance of account 0 incorrect')
    assert.equal(ending1Balance.toString(), expected1Bal.toString(), 'Balance of account 1 incorrect')
  })

  it('should allow transferFrom when address has approved balance', async () => {
    const txAmount = 500
    const starting0Balance = await token.balanceOf(accounts[0])
    const starting1Balance = await token.balanceOf(accounts[1])
    await token.approve(accounts[1], txAmount, { from: accounts[0] })
    utils.assertEvent(token, { event: 'Approval' })
    await token.transferFrom(accounts[0], accounts[1], txAmount, { from: accounts[1] })
    const ending0Balance = await token.balanceOf(accounts[0])
    const ending1Balance = await token.balanceOf(accounts[1])
    assert.equal(ending0Balance.toNumber(), starting0Balance.toNumber() - txAmount, 'Balance of account 0 incorrect')
    assert.equal(ending1Balance.toNumber(), starting1Balance.toNumber() + txAmount, 'Balance of account 1 incorrect')
  })

  it('should not allow approve when paused', async () => {
    const txAmount = 500
    await token.pause({ from: accounts[0] })
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.approve(accounts[1], txAmount, { from: accounts[0] })
    })
    assert(didFail)
    await token.unpause({ from: accounts[0] })
  })

  it('should not allow transfer when paused', async () => {
    const txAmount = 500
    await token.pause({ from: accounts[0] })
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    })
    assert(didFail)
    await token.unpause({ from: accounts[0] })
  })

  it('should not allow transferFrom when paused', async () => {
    const txAmount = 500
    await token.approve(accounts[1], txAmount, { from: accounts[0] })
    await token.pause({ from: accounts[0] })
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.transferFrom(accounts[0], accounts[1], txAmount, { from: accounts[1] })
    })
    assert(didFail)
    await token.unpause({ from: accounts[0] })
    await token.approve(accounts[1], 0, { from: accounts[0] })
  })

  it('should not allow transfer when to address is invalid', async () => {
    const txAmount = 500
    const failedNull = await utils.expectAsyncThrow(async () => {
      await token.transfer(null, txAmount, { from: accounts[0] })
    })
    assert(failedNull)
    const failed0Address = await utils.expectAsyncThrow(async () => {
      await token.transfer('0x0000000000000000000000000000000000000000', txAmount, { from: accounts[0] })
    })
    assert(failed0Address)
  })

  it('should not allow transfer when to address is token contract address', async () => {
    const txAmount = 500
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.transfer(token.address, txAmount, { from: accounts[0] })
    })
    assert(didFail)
  })

  it('should not allow transferFrom when to address is invalid', async () => {
    const txAmount = 500
    await token.approve(accounts[1], txAmount, { from: accounts[0] })
    const failedNull = await utils.expectAsyncThrow(async () => {
      await token.transferFrom(accounts[0], null, txAmount, { from: accounts[1] })
    })
    assert(failedNull)
    const failed0Address = await utils.expectAsyncThrow(async () => {
      await token.transferFrom(accounts[0], '0x0000000000000000000000000000000000000000', txAmount, { from: accounts[1] })
    })
    assert(failed0Address)
    await token.approve(accounts[1], 0, { from: accounts[0] })
  })

  it('should not allow transferFrom when to address is contract address', async () => {
    const txAmount = 500
    await token.approve(accounts[1], txAmount, { from: accounts[0] })
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.transferFrom(accounts[0], token.address, txAmount, { from: accounts[1] })
    })
    assert(didFail)
  })
})
