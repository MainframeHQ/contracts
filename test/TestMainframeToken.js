const MainframeToken = artifacts.require('./MainframeToken.sol')
const MessageTest = artifacts.require('./MessageTest.sol')
const BigNumber = require('bignumber.js')
const utils = require('./utils.js')
const ethjsABI = require('ethjs-abi')

contract('MainframeToken', (accounts) => {

  let token
  const txAmount = 500

  beforeEach('setup contract for each test', async() => {
    token = await MainframeToken.new()
  })

  it('should be named Mainframe Token', async () => {
    const name = await token.name.call()
    assert.equal(name, 'Mainframe Token', 'created with incorrect name')
  })

  it('should have symbol MFT', async () => {
    const symbol = await token.symbol.call()
    assert.equal(symbol, 'MFT', 'created with incorrect symbol')
  })

  it('should have 18 decimals', async () => {
    const decimals = await token.decimals.call()
    assert.equal(decimals, 18, 'created with incorrect decimals')
  })

  it('should assign creator as owner', async () => {
    const owner = await token.owner.call()
    assert.equal(owner, accounts[0], 'created with incorrect owner')
  })

  it('should have correct total supply', async () => {
    const totalSupply = await token.totalSupply()
    const expected = new BigNumber(10000000000 * 10**18)
    assert.equal(expected.toString(), totalSupply.toString(), 'created with incorrect total supply')
  })

  it('should assign initial token supply to owner', async () => {
    const ownersBalance = await token.balanceOf.call(accounts[0])
    const expected = new BigNumber(10000000000 * 10**18)
    assert.equal(expected.toString(), ownersBalance.toString(), 'incorrect assignment of initial token supply')
  })

  it('should allow transfer of ownership by owner', async () => {
    await token.transferOwnership(accounts[1], { from: accounts[0] })
    const owner = await token.owner.call()
    assert.equal(accounts[1], owner, 'failed transfer of ownership')
    await token.transferOwnership(accounts[0], { from: accounts[1] })
  })

  it('should not allow transfer of ownership by non owner', async () => {
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.transferOwnership(accounts[0], { from: accounts[1] })
    })
    assert(didFail, 'tranferred ownership by non owner')
  })

  it('should not allow transfer by non owner if tradeable is false ', async () => {
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    const failed = await utils.expectAsyncThrow(async () => {
      await token.transfer(accounts[2], txAmount, { from: accounts[1] })
    })
    assert(failed, 'allowed transfer by non owner when not tradeable')
  })

  it('should allow transfer of tokens by owner when tradeable is false', async () => {
    const starting0Balance = await token.balanceOf(accounts[0])
    const starting1Balance = await token.balanceOf(accounts[1])
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    await utils.assertEvent(token, { event: 'Transfer' })
    const ending0Balance = await token.balanceOf(accounts[0])
    const ending1Balance = await token.balanceOf(accounts[1])
    const expected0Bal = starting0Balance.minus(txAmount)
    const expected1Bal = starting1Balance.plus(txAmount)
    assert.equal(ending0Balance.toString(), expected0Bal.toString(), 'Balance of account 0 incorrect')
    assert.equal(ending1Balance.toString(), expected1Bal.toString(), 'Balance of account 1 incorrect')
  })

  it('should not allow transfer when to address is invalid', async () => {
    const failedNull = await utils.expectAsyncThrow(async () => {
      await token.transfer(null, txAmount, { from: accounts[0] })
    })
    assert(failedNull)
    const failed0Address = await utils.expectAsyncThrow(async () => {
      await token.transfer('0x0000000000000000000000000000000000000000', txAmount, { from: accounts[0] })
    })
    assert(failed0Address, 'transfer succeeded to invalid to address')
  })

  it('should not allow transfer when to address is token contract address', async () => {
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.transfer(token.address, txAmount, { from: accounts[0] })
    })
    assert(didFail, 'transfer succeeded when to address is token contract address')
  })

  it('should allow transfer of tokens by anyone when tradeable set to true', async () => {
    const starting0Balance = await token.balanceOf(accounts[0])
    const starting2Balance = await token.balanceOf(accounts[2])
    await token.turnOnTradeable({ from: accounts[0] })
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    await utils.assertEvent(token, { event: 'Transfer' })
    await token.transfer(accounts[2], txAmount, { from: accounts[1] })
    await utils.assertEvent(token, { event: 'Transfer' })
    const ending0Balance = await token.balanceOf(accounts[0])
    const ending2Balance = await token.balanceOf(accounts[2])
    const expected0Bal = starting0Balance.minus(txAmount)
    const expected2Bal = starting2Balance.plus(txAmount)
    assert.equal(ending0Balance.toString(), expected0Bal.toString(), 'Balance of account 0 incorrect')
    assert.equal(ending2Balance.toString(), expected2Bal.toString(), 'Balance of account 1 incorrect')
  })

  it('should not allow approve by non owner if tradeable is false ', async () => {
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    const failed = await utils.expectAsyncThrow(async () => {
      await token.approve(accounts[2], 500, { from: accounts[1] })
    })
    assert(failed, 'approve succeeded by non owner when tradeable false')
  })

  it('should not allow transferFrom when to address is invalid', async () => {
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
    await token.approve(accounts[1], txAmount, { from: accounts[0] })
    const didFail = await utils.expectAsyncThrow(async () => {
      await token.transferFrom(accounts[0], token.address, txAmount, { from: accounts[1] })
    })
    assert(didFail)
  })

  it('should allow transferFrom by owner when tradeable false', async () => {
    const starting0Balance = await token.balanceOf(accounts[0])
    const starting1Balance = await token.balanceOf(accounts[1])
    await token.turnOnTradeable({ from: accounts[0] })
    await token.approve(accounts[1], txAmount, { from: accounts[0] })
    await utils.assertEvent(token, { event: 'Approval' })
    await token.transferFrom(accounts[0], accounts[1], txAmount, { from: accounts[1] })
    const ending0Balance = await token.balanceOf(accounts[0])
    const ending1Balance = await token.balanceOf(accounts[1])
    assert.equal(ending0Balance.toNumber(), starting0Balance.toNumber() - txAmount, 'Balance of account 0 incorrect')
    assert.equal(ending1Balance.toNumber(), starting1Balance.toNumber() + txAmount, 'Balance of account 1 incorrect')
  })

  it('should allow transferFrom by anyone when address has approved balance and tradeable turned on', async () => {
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    const starting0Balance = await token.balanceOf(accounts[1])
    const starting1Balance = await token.balanceOf(accounts[2])
    await token.turnOnTradeable({ from: accounts[0] })
    await token.approve(accounts[2], txAmount, { from: accounts[1] })
    await utils.assertEvent(token, { event: 'Approval' })
    await token.transferFrom(accounts[1], accounts[2], txAmount, { from: accounts[2] })
    const ending0Balance = await token.balanceOf(accounts[1])
    const ending1Balance = await token.balanceOf(accounts[2])
    assert.equal(ending0Balance.toNumber(), starting0Balance.toNumber() - txAmount, 'Balance of account 0 incorrect')
    assert.equal(ending1Balance.toNumber(), starting1Balance.toNumber() + txAmount, 'Balance of account 1 incorrect')
  })

  // ERC827 Tests

  it('should not allow transfer (with data) by non owner if tradeable is false ', async () => {
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    const messageTest = await MessageTest.new();
    const extraData = messageTest.contract.showMessage.getData('transferred')
    const abiMethod = utils.findMethod(token.abi, 'transfer', 'address,uint256,bytes')
    const args = [messageTest.address, txAmount, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    const failed = await utils.expectAsyncThrow(async () => {
      await token.sendTransaction({
        from: accounts[1],
        data: transferData,
      })
    })
    assert(failed, 'allowed transfer (with data) by non owner when not tradeable')
  })

  it('should allow transfer (with data) by owner when tradeable is false ', async () => {
    const messageTest = await MessageTest.new();
    const extraData = messageTest.contract.showMessage.getData('transfer from account 0 to messageTest contract')
    const abiMethod = utils.findMethod(token.abi, 'transfer', 'address,uint256,bytes')
    const args = [messageTest.address, txAmount, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    const transaction = await token.sendTransaction({from: accounts[0], data: transferData})
    await utils.assertEvent(token, { event: 'Transfer' })
    await utils.assertEvent(messageTest, { event: 'ShowMessage' })
    const account1Bal = await token.balanceOf(messageTest.address)
    assert.equal(account1Bal.toNumber(), txAmount, 'transfer by owner failed when tradeable set to false')
  })

  it('should allow transfer (with data) by anyone when tradeable is true ', async () => {
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    await token.turnOnTradeable({ from: accounts[0] })
    const messageTest = await MessageTest.new();
    const extraData = messageTest.contract.showMessage.getData('transfer from account 1 to messageTest contract')
    const abiMethod = utils.findMethod(token.abi, 'transfer', 'address,uint256,bytes')
    const args = [messageTest.address, txAmount, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    await token.sendTransaction({from: accounts[1], data: transferData})
    await utils.assertEvent(token, { event: 'Transfer' })
    await utils.assertEvent(messageTest, { event: 'ShowMessage' })
    const account1Bal = await token.balanceOf(messageTest.address)
    assert.equal(account1Bal.toNumber(), txAmount, 'transfer failed when tradeable set to true')
  })

  it('should not allow approve (with data) by non owner when tradeable is false ', async () => {
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    const messageTest = await MessageTest.new();
    const extraData = messageTest.contract.showMessage.getData('approved')
    const abiMethod = utils.findMethod(token.abi, 'approve', 'address,uint256,bytes')
    const args = [accounts[2], txAmount, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    const failed = await utils.expectAsyncThrow(async () => {
      await token.sendTransaction({
        from: accounts[1],
        data: transferData,
      })
    })
    assert(failed, 'approve (with data) succeeded for non owner when tradeable set to false')
  })

  it('should approve (with data) correct allowance by owner when tradeable is false ', async () => {
    const messageTest = await MessageTest.new();
    const extraData = messageTest.contract.showMessage.getData(`account 0 approved ${txAmount} for messageTest contract`)
    const abiMethod = utils.findMethod(token.abi, 'approve', 'address,uint256,bytes')
    const args = [messageTest.address, txAmount, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    await token.sendTransaction({from: accounts[0], data: transferData})
    await utils.assertEvent(token, { event: 'Approval' })
    await utils.assertEvent(messageTest, { event: 'ShowMessage' })
    const allowance = await token.allowance(accounts[0], messageTest.address)
    assert.equal(allowance.toNumber(), txAmount, 'incorrect allowance approved by owner when tradeable false')
  })

  it('should approve (with data) correct allowance by anyone when tradeable is true ', async () => {
    await token.turnOnTradeable({ from: accounts[0] })
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    const messageTest = await MessageTest.new();
    const extraData = messageTest.contract.showMessage.getData(`account 1 approved ${txAmount} for messageTest contract`)
    const abiMethod = utils.findMethod(token.abi, 'approve', 'address,uint256,bytes')
    const args = [messageTest.address, txAmount, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    await token.sendTransaction({from: accounts[1], data: transferData})
    await utils.assertEvent(token, { event: 'Approval' })
    await utils.assertEvent(messageTest, { event: 'ShowMessage' })
    const allowance = await token.allowance(accounts[1], messageTest.address)
    assert.equal(allowance.toNumber(), txAmount, 'incorrect allowance approved by owner when tradeable false')
  })

  it('should not allow transferFrom (with data) by non owner when tradeable is false ', async () => {
    await token.approve(accounts[1], txAmount, { from: accounts[0] })
    const messageTest = await MessageTest.new();
    const extraData = messageTest.contract.showMessage.getData('transferFrom failed')
    const abiMethod = utils.findMethod(token.abi, 'transferFrom', 'address,address,uint256,bytes')
    const args = [accounts[0], accounts[1], txAmount, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    const failed = await utils.expectAsyncThrow(async () => {
      await token.sendTransaction({
        from: accounts[1],
        data: transferData,
      })
    })
    assert(failed, 'transferFrom (with data) succeeded for non owner when tradeable set to false')
  })

  it('should allow transferFrom (with data) by owner when tradeable is false ', async () => {
    await token.approve(accounts[0], txAmount, { from: accounts[0] })
    const messageTest = await MessageTest.new();
    const extraData = messageTest.contract.showMessage.getData(`transferred ${txAmount} from account 0 to account 1`)
    const abiMethod = utils.findMethod(token.abi, 'transferFrom', 'address,address,uint256,bytes')
    const args = [accounts[0], accounts[1], txAmount, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    await token.sendTransaction({from: accounts[0], data: transferData})
    const account1Bal = await token.balanceOf(accounts[1])
    assert.equal(account1Bal.toNumber(), txAmount, 'transferFrom failed for owner when tradeable set to false')
  })

  it('should allow transferFrom (with data) by anyone when tradeable is true ', async () => {
    await token.turnOnTradeable({ from: accounts[0] })
    await token.transfer(accounts[1], txAmount, { from: accounts[0] })
    await token.approve(accounts[2], txAmount, { from: accounts[1] })
    const messageTest = await MessageTest.new();
    const extraData = messageTest.contract.showMessage.getData(`transferred ${txAmount} from account 1 to account 2`)
    const abiMethod = utils.findMethod(token.abi, 'transferFrom', 'address,address,uint256,bytes')
    const args = [accounts[1], accounts[2], txAmount, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    await token.sendTransaction({from: accounts[2], data: transferData})
    const account1Bal = await token.balanceOf(accounts[2])
    assert.equal(account1Bal.toNumber(), txAmount, 'transferFrom failed for owner when tradeable set to false')
  })
})
