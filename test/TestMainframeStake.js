const MainframeStake = artifacts.require('./MainframeStake.sol')
const MainframeEscrow = artifacts.require('./MainframeEscrow.sol')
const MainframeToken = artifacts.require('./MainframeToken.sol')
const utils = require('./utils.js')

contract('MainframeStake', (accounts) => {
  let tokenContract
  let escrowContract
  let stakeContract

  beforeEach('setup contracts for each test', async() => {
    tokenContract = await MainframeToken.new()
    escrowContract = await MainframeEscrow.new(tokenContract.address)
    stakeContract = await MainframeStake.new(escrowContract.address)
    escrowContract.changeStakingAddress(stakeContract.address)
    await tokenContract.turnOnTradeable({ from: accounts[0] })
  })

  it('should return correct escrow address', async () => {
    const escrowAddress = await stakeContract.getEscrowAddress()
    assert.equal(escrowAddress, escrowContract.address, 'incorrect escrow address')
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
    await tokenContract.approve(escrowContract.address, requiredStake, { from: accounts[0], value: 0 })
    await stakeContract.stake(accounts[0], { from: accounts[0], value: 0 })
    utils.assertEvent(stakeContract, { event: 'Staked' })
    const totalStaked = await stakeContract.totalStaked()
    const stakersBalance = await escrowContract.balanceOf(accounts[0])
    const hasStake = await stakeContract.hasStake(accounts[0])

    assert(hasStake, 'failed has stake check after staking')
    assert.equal(stakersBalance.toNumber(), requiredStake, 'incorrect balance for staker after staking')
    assert.equal(totalStaked.toNumber(), requiredStake, 'incorrect total stake value after staking')
  })

  it('should unwhitelist address and return stake', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(escrowContract.address, requiredStake, { from: accounts[0], value: 0 })
    await stakeContract.stake(accounts[0], { from: accounts[0], value: 0 })
    utils.assertEvent(stakeContract, { event: 'Unstaked' })
    let totalStaked = await stakeContract.totalStaked()
    let stakersBalance = await stakeContract.balanceOf(accounts[0])
    let hasStake = await stakeContract.hasStake(accounts[0])
    assert(hasStake)
    assert.equal(stakersBalance.toNumber(), requiredStake, 'incorrect balance for staker after staking')
    assert.equal(totalStaked.toNumber(), requiredStake, 'incorrect total stake value after staking')

    await stakeContract.unstake(accounts[0], { from: accounts[0], value: 0 })
    totalStaked = await stakeContract.totalStaked()
    stakersBalance = await stakeContract.balanceOf(accounts[0])
    hasStake = await stakeContract.hasStake(accounts[0])
    assert(!hasStake, 'stake check returns true after unstaking')
    assert.equal(stakersBalance.toNumber(), 0, 'incorrect balance for staker after unstaking')
    assert.equal(totalStaked.toNumber(), 0, 'incorrect total staked value after unstaking')
  })

  it('should fail to deposit tokens if balance too low', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(escrowContract.address, requiredStake, { from: accounts[1], value: 0 })
    const didFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.stake(accounts[1], { from: accounts[1], value: 0 })
    })
    assert(didFail, 'succeeded staking when balance should be too low')
  })

  it('should fail withdraw if balance too low', async () => {
    const didFail = await utils.expectAsyncThrow(async () => {
      await stakeContract.withdraw(1000, { from: accounts[0], value: 0 })
    })
    assert(didFail, 'withdraw proceeded when should have failed')
  })

  it('should check address has stake', async () => {
    const requiredStake = await stakeContract.requiredStake()
    await tokenContract.approve(escrowContract.address, requiredStake, { from: accounts[0], value: 0 })
    await stakeContract.stake(accounts[0], { from: accounts[0], value: 0 })
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

  it('should successfully destroy itself', async () => {
    await escrowContract.destroy()
  })

  it('should successfully drain mistakenly sent tokens', async () => {
    await tokenContract.transfer(stakeContract.address, 100, { from: accounts[0] })
    const totalBalanceBefore = await tokenContract.balanceOf(stakeContract.address)
    assert.equal(totalBalanceBefore, 100)
    await stakeContract.emergencyERC20Drain(tokenContract.address, { from: accounts[0], value: 0 })
    const totalBalanceAfter = await tokenContract.balanceOf(stakeContract.address)
    assert.equal(totalBalanceAfter, 0, 'incorrect total balance after draining tokens')
  })
})
