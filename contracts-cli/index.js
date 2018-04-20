const Web3 = require('Web3')
const fs = require('fs')
const path = require('path')
const Accounts = require('web3-eth-accounts')
const HDWalletProvider = require('truffle-hdwallet-provider')
const HDWalletProviderPK = require('truffle-hdwallet-provider-privkey')
const program = require('commander')
const ProviderEngine = require('web3-provider-engine')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc')
const LedgerWalletSubproviderFactory = require('ledger-wallet-provider').default
const { prompt } = require('inquirer')

const config = require('./config')
const contract = require('./contract')
const { log, capitalize } = require('./cli-utils')

var web3
var ethNetwork = 'testnet' // testnet or mainnet

const determineNetwork = async () => {
  const answers = await prompt([{
    type : 'list',
    name : 'network',
    message : 'Select Ethereum network: ',
    choices : ['testnet', 'mainnet']
  }])
  ethNetwork = answers.network
}

const requestPrivateKey = async () => {
  const answers = await prompt([{
    type : 'password',
    name : 'privateKey',
    message : 'Enter private key: ',
  }])
  return answers.privateKey
}

const requestMnemonic = async () => {
  const answers = await prompt([{
    type : 'password',
    name : 'mnemonic',
    message : 'Enter mnemonic passphrase: ',
  }])
  return answers.mnemonic
}

const decodeKeystore = async() => {
  const answers = await prompt([
    {
      type : 'input',
      name : 'keystorePath',
      message : 'Enter path of keystore file: ',
    },
    {
      type : 'input',
      name : 'password',
      message : 'Enter password to decrypt file: ',
    }
  ])
  const file = await JSON.parse(fs.readFileSync(answers.keystorePath))
  const accounts = new Accounts()
  const decrypted = accounts.decrypt(file, answers.password)
  return decrypted.privateKey
}

const requestWalletAccessType = async () => {
  const answers = await prompt([{
    type : 'list',
    name : 'wallet',
    message : 'Wallet source:',
    choices : ['Private Key', 'Mnemonic', 'Ledger', 'Keystore File'],
  }])
  var provider
  switch (answers.wallet) {
    case 'Private Key':
      const key = await requestPrivateKey()
      provider = new HDWalletProviderPK(key, config.rpcUrl[ethNetwork])
      web3 = new Web3(provider)
      break
    case 'Keystore File':
      var decodedKey = await decodeKeystore()
      if (decodedKey.slice(0, 2) === '0x') {
        decodedKey = decodedKey.slice(2, decodedKey.length)
      }
      provider = new HDWalletProviderPK(decodedKey, config.rpcUrl[ethNetwork])
      web3 = new Web3(provider)
      break
    case 'Mnemonic':
      const mnemonic = await requestMnemonic()
      provider = new HDWalletProvider(mnemonic, config.rpcUrl[ethNetwork])
      web3 = new Web3(provider)
      break
    case 'Ledger':
      var engine = new ProviderEngine()
      web3 = new Web3(engine)

      var ledgerWalletSubProvider = await LedgerWalletSubproviderFactory(() => 3, `44'/60'/0'/0`)
      engine.addProvider(ledgerWalletSubProvider)
      engine.addProvider(new RpcSubprovider({rpcUrl: config.rpcUrl[ethNetwork]})) // you need RPC endpoint
      engine.start()
      try {
        const accounts = await web3.eth.getAccounts()
        console.log('Ledger accounts: ', accounts)
      } catch (err) {
        console.log(`Device not found, please make sure:\n
        - You have entered your pin and unlocked your ledger\n
        - Selected Ethereum wallet\n
        - Have browser support turned off`
        )
        process.exit()
      }
      break
  }
  const account = await web3.eth.getCoinbase()
  log.info(`Using account: ${account}`, 'blue')
}

const selectMethod = async (web3Contract, contractName) => {
  const contractAbi = web3Contract._jsonInterface
  const methods = contractAbi.reduce((acc, m) => {
    if (m.name && m.type === 'function') acc.push(m.name)
    return acc
  }, [])
  log.header(`${capitalize(contractName)} Contract`)
  const answers = await prompt([{
    type : 'list',
    name : 'method',
    message : 'Select contract action: ',
    choices : methods,
  }])
  return answers.method
}

const selectContractName = async () => {
  const contractNames = await availableContracts()
  const answers = await prompt([{
    type : 'list',
    name : 'contract',
    message : 'Select contract: ',
    choices : contractNames,
  }])
  return answers.contract
}

const availableContracts = async () => {
  const filePath = path.resolve(__dirname, 'abi')
  const files = fs.readdirSync(filePath).reduce((acc, file) => {
    if (file.endsWith('.json')) {
      acc.push(file.replace('.json', ''))
    }
    return acc
  }, [])
  return files
}

const getWeb3Contract = async (name, web3, ethNetwork) => {
  const filePath = path.resolve(__dirname, 'abi', `${name}.json`)
  const abi = JSON.parse(fs.readFileSync(filePath))
  return await contract.getWeb3Contract(name, abi, web3, ethNetwork)
}

const requestContractMethod = async (web3, ethNetwork) => {
  const account = await web3.eth.getCoinbase()
  const contractName = await selectContractName()
  const web3Contract = await getWeb3Contract(contractName, web3, ethNetwork)
  const methodName = await selectMethod(web3Contract, contractName)
  await contract.callMethod(web3Contract, contractName, methodName, web3, ethNetwork)
}

const initialize = async () => {
  try {
    await requestWalletAccessType()
    await determineNetwork()
    await requestContractMethod(web3, ethNetwork)
  } catch (err) {
    log.warn('Error: ' + err.message)
    log.info(err.stack)
    process.exit()
  }
}

initialize()
