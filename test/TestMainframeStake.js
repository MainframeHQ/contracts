const web3 = global.web3;
var MainframeStake = artifacts.require("./ACMainframeStake.sol");
var MainframeToken = artifacts.require("./ACMainframeToken.sol");

contract('MainframeToken', (accounts) => {

  it("allows staking tokens in two transactions", async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    let totalStaked
    try {
      await tokenContract.approve(stakeContract.address, 100, { from: accounts[0], value: 0, gas: 3000000 })
      await stakeContract.stakeTokens(100, { from: accounts[0], value: 0, gas: 3000000 })
      const num = await stakeContract.totalStaked()
      totalStaked = num.toString(10)
      console.log('total staked: ', totalStaked)
    } catch (err) {
      console.log(err)
    }

    const stakersBalance = await stakeContract.amountStaked(accounts[0])
    assert.equal(stakersBalance.toString(10), 100)
    assert.equal(100, totalStaked)
  })

  it("allows staking tokens in a single transaction", async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    let totalStaked
    try {
      await tokenContract.approveAndCall(stakeContract.address, 150, "", { from: accounts[0], value: 0, gas: 3000000 })
      const num = await stakeContract.totalStaked()
      totalStaked = num.toString(10)
      console.log('total staked: ', totalStaked)
    } catch (err) {
      console.log(err)
			return false
    }

    assert.equal(250, totalStaked)
  })

  it("it fails to stake tokens if balance too low", async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    await tokenContract.transfer(accounts[1], 100, { from: accounts[0], value: 0, gas: 3000000 })
    let totalStaked
    try {
      const success = await tokenContract.approveAndCall(stakeContract.address, 101, "", { from: accounts[1], value: 0, gas: 3000000 })
    } catch (err) {
      return true
    }
    return false
  })

  it("it allows withdraw if balance available", async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    let totalStaked
    try {
      await stakeContract.withdrawStake(100, { from: accounts[0], value: 0, gas: 3000000 })
      const num = await stakeContract.totalStaked()
      totalStaked = num.toString(10)
      console.log('total staked: ', totalStaked)
    } catch (err) {
      console.log(err)
			return false
    }
    assert.equal(150, totalStaked)
  })

  it("it declines withdraw if request above balance", async () => {
    const tokenContract = await MainframeToken.deployed()
    const stakeContract = await MainframeStake.deployed()
    let totalStaked
    try {
      await stakeContract.withdrawStake(1000, { from: accounts[0], value: 0, gas: 3000000 })
      const num = await stakeContract.totalStaked()
      totalStaked = num.toString(10)
      console.log('total staked: ', totalStaked)
    } catch (err) {
      return true
    }
    return false
  })

	it("checks account has stake", async () => {
		const tokenContract = await MainframeToken.deployed()
		const stakeContract = await MainframeStake.deployed()
		let hasStake
		try {
			await tokenContract.approveAndCall(stakeContract.address, 50, "", { from: accounts[0], value: 0, gas: 3000000 })
			hasStake = await stakeContract.hasStake(accounts[0])

			const num = await stakeContract.totalStaked()
			const totalStaked = num.toString(10)
			console.log('total staked: ', totalStaked)

			console.log('hasStake: ', hasStake)
		} catch (err) {
			return false
		}
		assert.equal(true, hasStake)
		return hasStake
	})

})
