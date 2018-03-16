# Mainframe Contracts

## Prerequisites

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

## Usage

* Make sure your blockchain is running (using `ganache-cli` or an alternative).
* Run `truffle test` to start the test suite.

### References

* [Truffle documentation](http://truffleframework.com/docs/) for smart contracts development.
* [Create React App documentation](https://github.com/facebook/create-react-app) for app development.
