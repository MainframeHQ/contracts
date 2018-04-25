// See <http://truffleframework.com/docs/advanced/configuration>
const { clone } = require('lodash')
const LedgerWalletProvider = require("truffle-ledger-provider")
const infura_apikey = process.env.INFURA_KEY

const ledgerOptions = {
  path: "44'/60'/0'/0", // ledger default derivation path
  accountsLength: 5,
  accountsOffset: 0, // change to select different ledger account
}

const ledgerOptionsMainnet = clone(ledgerOptions)
const ledgerOptionsTestnet = clone(ledgerOptions)
ledgerOptionsTestnet.networkId = 3
ledgerOptionsMainnet.networkId = 1

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*', // Match any network id
    },
    ropsten: {
      network_id: 3,
      gas: 4600000,
      provider: new LedgerWalletProvider(
        ledgerOptionsTestnet,
        "https://ropsten.infura.io/" + infura_apikey
      ),
    },
    mainnet: {
      network_id: 1,
      gas: 4600000,
      provider: new LedgerWalletProvider(
        ledgerOptionsMainnet,
        "https://mainnet.infura.io/" + infura_apikey
      ),
    },
  },
}
