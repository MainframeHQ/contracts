/* global artifacts, web3 */

const MainframeToken = artifacts.require('MainframeToken')
const MainframeStake = artifacts.require('MainframeStake')

const run = async () => {
  const [alice, bob] = web3.eth.accounts

  // Use deployed contract - use alternative below to create new ones
  const [stake, token] = await Promise.all([
    MainframeStake.deployed(),
    MainframeToken.deployed(),
  ])
  // Alice gets all the tokens when creating the contract
  // const token = await MainframeToken.new({ from: alice })
  // The stake contract needs the token contract address to be able to call it
  // const stake = await MainframeStake.new(token.address, { from: alice })

  // Alice transfers 1000 tokens to Bob and Bob allows the stake contract to withdraw 100 tokens from his account
  await Promise.all([
    token.transfer(bob, 1000, { from: alice }),
    token.approve(stake.address, 100, { from: bob }),
  ])

  // Bob deposits 100 tokens in its stake and then withdraws 50
  await stake.deposit(100, { from: bob })
  await stake.withdraw(50, { from: bob })

  const [bobTokens, stakeTokens, bobStake] = await Promise.all([
    token.balanceOf(bob),
    token.balanceOf(stake.address),
    stake.balanceOf(bob),
  ])
  console.log(`Bob has ${bobTokens.toString()} MFT tokens + ${bobStake.toString()} staked tokens.
The stake contract contains ${stakeTokens.toString()} MFT.`)
}

module.exports = async cb => {
  try {
    await run()
    cb()
  } catch (err) {
    cb(err)
  }
}
