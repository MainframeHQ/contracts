import React, { Component } from 'react'
import contract from 'truffle-contract'

import MainframeStakeContract from '../build/contracts/MainframeStake.json'
import MainframeTokenContract from '../build/contracts/MainframeToken.json'

import web3Async from './utils/web3Async'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

const MainframeToken = contract(MainframeTokenContract)
const MainframeStake = contract(MainframeStakeContract)

const getAccounts = web3 =>
  new Promise((resolve, reject) => {
    web3.eth.getAccounts((err, accounts) => {
      if (err) reject(err)
      else resolve(accounts)
    })
  })

export default class App extends Component {
  state = {}

  componentDidMount() {
    this.setup()
  }

  async setup() {
    try {
      const web3 = await web3Async

      MainframeToken.setProvider(web3.currentProvider)
      MainframeStake.setProvider(web3.currentProvider)

      const [accounts, stake, token] = await Promise.all([
        getAccounts(web3),
        MainframeStake.deployed(),
        MainframeToken.deployed(),
      ])
      const accountAddr = accounts[1]

      this.setState({ accountAddr })
      this.stake = stake
      this.token = token

      await this.setBalances()
    } catch (err) {
      console.log(err)
    }
  }

  async setBalances() {
    const { accountAddr } = this.state

    const [accountTokens, stakeTokens, accountStake] = await Promise.all([
      this.token.balanceOf(accountAddr),
      this.token.balanceOf(this.stake.address),
      this.stake.balanceOf(accountAddr),
    ])
    const tokenBalances = {
      [accountAddr]: accountTokens.toString(),
      [this.stake.address]: stakeTokens.toString(),
    }
    const stakeBalances = {
      [accountAddr]: accountStake.toString(),
    }

    this.setState({ tokenBalances, stakeBalances })
  }

  onDeposit = async () => {
    await this.token.approve(this.stake.address, 100, {
      from: this.state.accountAddr,
    })
    await this.stake.deposit(100, { from: this.state.accountAddr })
    await this.setBalances()
  }

  onWithdraw = async () => {
    await this.stake.withdraw(100, { from: this.state.accountAddr })
    await this.setBalances()
  }

  render() {
    const { accountAddr, stakeBalances, tokenBalances } = this.state

    const contents = tokenBalances ? (
      <div className="pure-u-1-1">
        <h1>Your account</h1>
        <p>Address: {accountAddr}</p>
        <p>
          Balance: {tokenBalances[accountAddr]} MFT +{' '}
          {stakeBalances[accountAddr]} MFT in stake.
        </p>
        <p>
          <button onClick={this.onDeposit}>Deposit 100 MFT</button>
          <button onClick={this.onWithdraw}>Withdraw 100 MFT</button>
        </p>
        <h2>Stake contract</h2>
        <p>Address: {this.stake.address}</p>
        <p>Balance: {tokenBalances[this.stake.address]} MFT</p>
      </div>
    ) : (
      <div className="pure-u-1-1">
        <h1>Loading data...</h1>
      </div>
    )

    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">
            Mainframe stake
          </a>
        </nav>
        <main className="container">
          <div className="pure-g">{contents}</div>
        </main>
      </div>
    )
  }
}
