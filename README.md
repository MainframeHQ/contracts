# Mainframe Contracts

### Mainframe Token

An ERC20 standard token, built using the [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-solidity) framework.

### Mainframe Staking

The staking contract enables users to stake MFT allowing them to participate in the Mainframe network. When staking, the user provides the ethereum wallet address associated with the node they want to stake for.

It exposes a public `hasStake` function, that takes an eth address as an argument to check stake state.

Users can withdraw their stake at any time by calling the `unstake` function and passing the address they staked for.

### Mainframe Distribution

The distribution contract enables batch transfer of MFT by the contract owner with a limit of 200 per transaction.

# Development

## Setup Truffle

### Prerequisites

* [node](https://nodejs.org/en/) v8+ (includes npm)
* [Yarn](https://yarnpkg.com/lang/en/) (optional - faster alternative to npm)
* [Truffle](http://truffleframework.com/docs/getting_started/installation)
* [Ganache](http://truffleframework.com/ganache/) or [Ganache CLI](https://github.com/trufflesuite/ganache-cli) (optional if you have an alternative)

### MacOS quick setup

```sh
# Homebrew
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
# node
brew install node
# Yarn (optional)
brew install yarn
# Truffle
npm install -g truffle
# Ganache CLI (optional if you have an alternative)
npm install -g ganache-cli
```

## Installation

* Clone this repository and open a terminal in the repository folder.
* Run `yarn install` (or `npm install`) to install the dependencies.
* Run `ganache-cli` in another terminal, or make sure your alternative blockchain is running.
* Run `truffle console` to start the console. It will use the configuration from the [truffle.js](truffle.js) file, so you may need to customise this configuration if you are not using Ganache.
* In the Truffle console, run `compile` then `migrate` to setup the smart contracts on the blockchain.

## Running Tests

* Run `truffle test` to start the test suite.

### References

* [Truffle documentation](http://truffleframework.com/docs/) for smart contracts development.

## License

[MIT](LICENSE)
