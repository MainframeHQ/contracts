import React, { Component } from 'react'
import contract from 'truffle-contract'

import MainframeStakeContract from '../build/contracts/MainframeStake.json'
import MainframeTokenContract from '../build/contracts/MainframeToken.json'

import web3 from './utils/web3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

const MainframeToken = contract(MainframeTokenContract)
const MainframeStake = contract(MainframeStakeContract)

const accountsAsync = new Promise((resolve, reject) => {
  web3.eth.getAccounts((err, accounts) => {
    if (err) reject(err)
    else resolve(accounts)
  })
})

export default class App extends Component {
  state = {
    stakeChecks: {},
  }

  componentDidMount() {
    this.setup()
  }

  async setup() {
    try {
      MainframeToken.setProvider(web3.currentProvider)
      MainframeStake.setProvider(web3.currentProvider)
      const [accounts, stake, token] = await Promise.all([
        accountsAsync,
        MainframeStake.deployed(),
        MainframeToken.deployed(),
      ])
      const accountAddr = accounts[0]
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

    const [accountTokens, stakeTokens, accountStake, maxStake] = await Promise.all([
      this.token.balanceOf(accountAddr),
      this.token.balanceOf(this.stake.address),
      this.stake.balanceOf(accountAddr),
      this.stake.maxDeposit(),
    ])
    const tokenBalances = {
      [accountAddr]: accountTokens.toString(),
      [this.stake.address]: stakeTokens.toString(),
    }
    const stakeBalances = {
      [accountAddr]: accountStake.toString(),
    }

    this.setState({
      tokenBalances,
      stakeBalances,
      maxStake: maxStake.toNumber(),
      localMaxStake: maxStake.toNumber(),
    })
  }

  onDeposit = async () => {
    await this.token.approve(this.stake.address, this.state.maxStake, {
      from: this.state.accountAddr,
      gas: 3000000,
    })
    await this.stake.deposit(this.state.maxStake, {
      from: this.state.accountAddr,
      gas: 3000000,
    })
    await this.setBalances()
  }

  onWithdraw = async () => {
    await this.stake.withdraw(this.state.maxStake, {
      from: this.state.accountAddr,
      gas: 3000000,
    })
    await this.setBalances()
  }

  onStakeCheckChange = (event) => {
    this.setState({addressToCheck: event.target.value})
  }

  onSubmitStakeCheck = async (event) => {
    event.preventDefault()
    const { addressToCheck, stakeChecks } = this.state
    const hasStaked = await this.stake.hasStake(addressToCheck)
    stakeChecks[this.state.addressToCheck] = hasStaked
    this.setState({ stakeChecks })
  }

  onChangeMaxStake = (event) => {
    this.setState({localMaxStake: event.target.value})
  }

  onSubmitUpdateMax = async (event) => {
    try {
      await this.stake.setMaxDeposit(this.state.localMaxStake, { from: this.state.accountAddr })
      this.setState({
        maxState: this.state.localMaxStake,
      })
    } catch (err) {
      console.log(err)
    }
  }

  render() {
    const { accountAddr, stakeBalances, tokenBalances, stakeChecks, addressToCheck } = this.state
    let hasStakedStyle
    if (stakeChecks.hasOwnProperty(addressToCheck)) {
      hasStakedStyle = stakeChecks[addressToCheck] ?
      'hasStaked' : 'hasNotStaked'
    }

    const contents = tokenBalances ? (
      <div className="pure-u-1-1">
        <h1>Your account</h1>
        <p>Address: {accountAddr}</p>
        <p>
          Balance: {tokenBalances[accountAddr]} MFT +{' '}
          {stakeBalances[accountAddr]} MFT in stake.
        </p>
        <p>
          <button onClick={this.onDeposit}>Deposit {this.state.maxStake} MFT</button>
          <button onClick={this.onWithdraw}>Withdraw {this.state.maxStake} MFT</button>
        </p>
        <h2>Stake contract</h2>
        <p>Address: {this.stake.address}</p>
        <p>Balance: {tokenBalances[this.stake.address]} MFT</p>
        <p>Max Stake: {this.state.maxStake} MFT</p>
        <h2>Check Address has Staked</h2>
        <form onSubmit={this.onSubmitStakeCheck}>
          <label>
            Address:
            <div className="inputWrapper">
            	<input className={hasStakedStyle} type="text" value={this.state.value} onChange={this.onStakeCheckChange} />
            </div>
          </label>
          <input type="submit" value="Submit" />
        </form>
        <h2>Update Max Stake</h2>
        <form onSubmit={this.onSubmitUpdateMax}>
          <label>
            Max Stake:
            <div className="inputWrapper">
              <input type="text" value={this.state.localMaxStake} onChange={this.onChangeMaxStake} />
            </div>
          </label>
          <input type="submit" value="Submit" />
        </form>
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
