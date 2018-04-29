const MainframeToken = artifacts.require('MainframeToken.sol')
const MainframeStake = artifacts.require('MainframeStake.sol')
const utils = require('./utils.js')
const ethjsABI = require('ethjs-abi')

contract('MainframeStake', (accounts) => {
  let tokenContract
  let stakeContract

  beforeEach('setup contracts for each test', async() => {
    tokenContract = await MainframeToken.new()
    stakeContract = await MainframeStake.new(tokenContract.address)
  })

  it('should assign creator as owner', async () => {
    const owner = await stakeContract.owner.call()
    assert.equal(owner, accounts[0], 'failed to asign creator as owner')
  })

  it('should set correct required stake', async () => {
    const requiredStake = await stakeContract.requiredStake()
    const expected = '1000000000000000000'
    assert.equal(requiredStake.toString(), expected, 'incorrect required stake returned')
  })

  it('should change the required stake correctly', async () => {
    const expected = 50
    await stakeContract.setRequiredStake(50)
    const requiredStake = await stakeContract.requiredStake()
    assert.equal(requiredStake, expected, 'incorrect required stake after update')
  })

  it('should whitelist address when staking', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(stakeContract.address, requiredStake, { from: accounts[0], value: 0 })
    await stakeContract.stake(accounts[0], accounts[0], { from: accounts[0], value: 0 })
    utils.assertEvent(stakeContract, { event: 'Staked' })
    const totalStaked = await stakeContract.totalStaked()
    const stakersBalance = await stakeContract.balanceOf(accounts[0])
    const hasStake = await stakeContract.hasStake(accounts[0])

    assert(hasStake, 'failed has stake check after staking')
    assert.equal(stakersBalance.toNumber(), requiredStake, 'incorrect balance for staker after staking')
    assert.equal(totalStaked.toNumber(), requiredStake, 'incorrect total stake value after staking')
  })

  it('should unwhitelist address and return stake', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(stakeContract.address, requiredStake, { from: accounts[0], value: 0 })
    await stakeContract.stake(accounts[0], accounts[0], { from: accounts[0], value: 0 })
    utils.assertEvent(stakeContract, { event: 'Staked' })

    let totalStaked = await stakeContract.totalStaked()
    let stakersBalance = await stakeContract.balanceOf(accounts[0])
    let hasStake = await stakeContract.hasStake(accounts[0])
    assert(hasStake)
    assert.equal(stakersBalance.toNumber(), requiredStake, 'incorrect balance for staker after staking')
    assert.equal(totalStaked.toNumber(), requiredStake, 'incorrect total stake value after staking')

    await stakeContract.unstake(accounts[0], { from: accounts[0], value: 0 })
    utils.assertEvent(stakeContract, { event: 'Unstaked' })
    totalStaked = await stakeContract.totalStaked()
    stakersBalance = await stakeContract.balanceOf(accounts[0])
    hasStake = await stakeContract.hasStake(accounts[0])
    assert(!hasStake, 'stake check returns true after unstaking')
    assert.equal(stakersBalance.toNumber(), 0, 'incorrect balance for staker after unstaking')
    assert.equal(totalStaked.toNumber(), 0, 'incorrect total staked value after unstaking')
  })

  it('should fail to deposit tokens if balance too low', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(stakeContract.address, requiredStake, { from: accounts[1], value: 0 })
    const didFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.stake(accounts[1], accounts[1], { from: accounts[1], value: 0 })
    })
    assert(didFail, 'succeeded staking when balance should be too low')
  })

  it('should fail to withdraw if balance too low', async () => {
    const requiredStake = await stakeContract.requiredStake()
    const didFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.unstake(accounts[0], { from: accounts[0], value: 0 })
    })
    assert(didFail, 'withdraw proceeded when should have failed')
  })

  it('should check address has stake', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(stakeContract.address, requiredStake, { from: accounts[0], value: 0 })
    await stakeContract.stake(accounts[0], accounts[0], { from: accounts[0], value: 0 })
    const hasStake = await stakeContract.hasStake(accounts[0])
    assert(hasStake, 'address should have stake')
  })

  it('should allow owner to update required stake', async () => {
    const initialRequiredStake = await stakeContract.requiredStake()
    assert(initialRequiredStake !== 10)
    await stakeContract.setRequiredStake(10, { from: accounts[0], value: 0 })
    const updatedRequiredStake = await stakeContract.requiredStake()
    assert.equal(updatedRequiredStake, 10, 'required stake not updated as expected')
  })

  it('should successfully drain mistakenly sent tokens', async () => {
    await tokenContract.transfer(stakeContract.address, 200, { from: accounts[0] })
    const totalBalanceBefore = await tokenContract.balanceOf(stakeContract.address)
    assert.equal(totalBalanceBefore, 200)
    await stakeContract.emergencyERC20Drain(tokenContract.address, { from: accounts[0], value: 0 })
    const totalBalanceAfter = await tokenContract.balanceOf(stakeContract.address)
    assert.equal(totalBalanceAfter, 0, 'incorrect total balance after draining tokens')
  })

  it('should deposit successfully when staking', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[0], value: 0})
    await stakeContract.stake(accounts[0], accounts[0], {from: accounts[0], value: 0})
    const depositorsBalance = await stakeContract.balanceOf(accounts[0])
    const totalDepositBalance = await stakeContract.totalDepositBalance()
    const totalBalance = await tokenContract.balanceOf(stakeContract.address)
    await utils.assertEvent(stakeContract, {event: 'Deposit'})
    assert.equal(depositorsBalance, requiredStake.toString())
    assert.equal(totalBalance, requiredStake.toString())
    assert.equal(totalDepositBalance, requiredStake.toString())
  })

  it('should approve and stake in a single transaction', async () => {
    const requiredStake = await stakeContract.requiredStake()
    const extraData = stakeContract.contract.stake.getData(accounts[0], accounts[0])

    const abiMethod = utils.findMethod(tokenContract.abi, 'approve', 'address,uint256,bytes')
    const args = [stakeContract.address, requiredStake, extraData]
    const transferData = ethjsABI.encodeMethod(abiMethod, args)
    await tokenContract.sendTransaction({from: accounts[0], data: transferData})
    await utils.assertEvent(tokenContract, { event: 'Approval' })

    const depositorsBalance = await stakeContract.balanceOf(accounts[0])
    const totalDepositBalance = await stakeContract.totalDepositBalance()
    const totalBalance = await tokenContract.balanceOf(stakeContract.address)
    await utils.assertEvent(stakeContract, {event: 'Deposit'})
    assert.equal(depositorsBalance, requiredStake.toString())
    assert.equal(totalBalance, requiredStake.toString())
    assert.equal(totalDepositBalance, requiredStake.toString())
  })

  it('should withdraw successfully if balance is high enough', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.transfer(accounts[1], requiredStake, {from: accounts[0], value: 0})
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[1], value: 0})
    await stakeContract.stake(accounts[1], accounts[1], {from: accounts[1], value: 0})
    await utils.assertEvent(stakeContract, {event: 'Deposit'})
    await stakeContract.unstake(accounts[1], {from: accounts[1], value: 0})
    await utils.assertEvent(stakeContract, {event: 'Withdrawal'})
    const totalBalance = await tokenContract.balanceOf(stakeContract.address)
    const depositorsBalance = await stakeContract.balanceOf(accounts[0])
    const totalDepositBalance = await stakeContract.totalDepositBalance()
    assert.equal(depositorsBalance, 0)
    assert.equal(0, totalBalance)
    assert.equal(totalDepositBalance, 0)
  })

  it('should fail to refund of balances called by non owner', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.transfer(accounts[1], requiredStake, {from: accounts[0], value: 0})
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[1], value: 0})
    await stakeContract.stake(accounts[1], accounts[1], {from: accounts[1], value: 0})
    const returnBalanceFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.refundBalances([accounts[1]], {from: accounts[2], value: 0})
    })
    assert(returnBalanceFail)
  })

  it('should fail to refund balances if list size exceeds limit', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[0]})
    await stakeContract.stake(accounts[0], accounts[0], {from: accounts[0]})
    await tokenContract.transfer(accounts[1], requiredStake, {from: accounts[0]})
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[1]})
    await stakeContract.stake(accounts[1], accounts[1], {from: accounts[1]})
    await stakeContract.setArrayLimit(1, {from: accounts[0]})
    const returnBalanceFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.refundBalances([accounts[0], accounts[1]], {from: accounts[0]})
    })
    assert(returnBalanceFail)
  })

  it('should refund balances if called by owner', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.transfer(accounts[1], requiredStake, {from: accounts[0], value: 0})
    await tokenContract.transfer(accounts[2], requiredStake, {from: accounts[0], value: 0})
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[1], value: 0})
    await stakeContract.stake(accounts[1], accounts[1], {from: accounts[1], value: 0})
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[2], value: 0})
    await stakeContract.stake(accounts[2], accounts[2], {from: accounts[2], value: 0})
    await stakeContract.refundBalances([accounts[1], accounts[2]], {from: accounts[0], value: 0})
    const totalBalance = await tokenContract.balanceOf(stakeContract.address)
    const depositor1Balance = await stakeContract.balanceOf(accounts[1])
    const depositor2Balance = await stakeContract.balanceOf(accounts[1])
    const totalDepositBalance = await stakeContract.totalDepositBalance()
    await utils.assertEvent(stakeContract, {event: 'RefundedBalance'})
    assert.equal(depositor1Balance, 0)
    assert.equal(depositor2Balance, 0)
    assert.equal(totalBalance, 0)
    assert.equal(totalDepositBalance, 0)
  })

  it('should successfully destroy itself if balance is unchanged (0)', async () => {
    await stakeContract.destroy()
  })

  it('should successfully destroy itself if balance is 0', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[0], value: 0})
    await stakeContract.stake(accounts[0], accounts[0], {from: accounts[0], value: 0})
    await stakeContract.unstake(accounts[0], {from: accounts[0], value: 0})
    await stakeContract.destroy()
  })

  it('should fail to destroy itself if balance is higher than 0', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[0], value: 0})
    await stakeContract.stake(accounts[0], accounts[0], {from: accounts[0], value: 0})
    const didFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.destroy()
    })
    assert(didFail)
  })

  it('should fail to destroy itself if someone sends tokens to the contract address', async () => {
    await tokenContract.transfer(stakeContract.address, 200, {from: accounts[0]})
    const didFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.destroy()
    })
    assert(didFail)
  })

  it('should drain only mistakenly sent tokens and not valid deposits', async () => {
    let totalBalance
    let totalDepositBalance
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[0], value: 0})
    await stakeContract.stake(accounts[0], accounts[0], {from: accounts[0], value: 0})
    await utils.assertEvent(stakeContract, {event: 'Deposit'})
    const depositorsBalance = await stakeContract.balanceOf(accounts[0])
    await tokenContract.transfer(stakeContract.address, requiredStake, {from: accounts[0]})
    totalBalance = await tokenContract.balanceOf(stakeContract.address)
    totalDepositBalance = await stakeContract.totalDepositBalance()
    assert.equal(depositorsBalance, requiredStake.toString())
    assert.equal(totalBalance, (requiredStake*2).toString())
    assert.equal(totalDepositBalance, requiredStake.toString())

    await stakeContract.emergencyERC20Drain(tokenContract.address, {from: accounts[0], value: 0})
    totalBalance = await tokenContract.balanceOf(stakeContract.address)
    totalDepositBalance = await stakeContract.totalDepositBalance()
    assert.equal(totalDepositBalance, requiredStake.toString())
    assert.equal(totalBalance, requiredStake.toString())
  })

  it('should extract correct balances through event logs', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.transfer(accounts[1], requiredStake, {from: accounts[0], value: 0})
    await tokenContract.transfer(accounts[2], requiredStake, {from: accounts[0], value: 0})
    await tokenContract.transfer(accounts[3], requiredStake, {from: accounts[0], value: 0})
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[1], value: 0})
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[2], value: 0})
    await tokenContract.approve(stakeContract.address, requiredStake, {from: accounts[3], value: 0})
    await stakeContract.stake(accounts[1], accounts[1], {from: accounts[1], value: 0})
    await stakeContract.unstake(accounts[1], {from: accounts[1], value: 0})
    await stakeContract.stake(accounts[2], accounts[2], {from: accounts[2], value: 0})
    await stakeContract.unstake(accounts[2], {from: accounts[2], value: 0})
    await stakeContract.stake(accounts[3], accounts[3], {from: accounts[3], value: 0})
    await stakeContract.unstake(accounts[3], {from: accounts[3], value: 0})
    var events = stakeContract.Withdrawal({}, {
      fromBlock: 0,
      toBlock: 'latest',
    })
    const passed = await new Promise(async (resolve, reject) => {
      await events.get( (error, logs) => {
        const outstandingBalances = {}
        logs.forEach(l => {
          outstandingBalances[l.args._address] = l.args.balance.toNumber()
        })
        resolve(
          outstandingBalances[accounts[1]] === 0 &&
          outstandingBalances[accounts[2]] === 0 &&
          outstandingBalances[accounts[3]] === 0
        )
      })
    })
    assert(passed, 'Incorrect balances derived from logs')
  })
})
