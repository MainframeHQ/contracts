const csv = require('csv-parser')
const fs = require('fs')
const { prompt } = require('inquirer')
const { utils } = require('web3')

const config = require('../config')
const tokenAbi = require('../abi/MainframeDistribution.json')
const { log } = require('../cli-utils')

const createDistributionContract = (web3, ethNetwork) => {
  const contractAddress = config.contractAddresses.MainframeDistribution[ethNetwork]
  return new web3.eth.Contract(tokenAbi, contractAddress)
}

const distributeTokens = async (
  web3,
  ethNetwork,
) => {
  const data = await parseCSV()
  const accountAddress = await web3.eth.getCoinbase()
  await validateDistribution(data, accountAddress, ethNetwork)
  const distroContract = createDistributionContract(web3, ethNetwork)
  log.info('Pending transaction...', 'blue')
  const transaction = await distroContract.methods.distributeTokens(
    accountAddress,
    data.recipients,
    data.amounts,
  ).send({
    from: accountAddress,
    gas: 300000,
  })
  log.success('Transaction complete!')
  console.log(transaction)
}

const parseCSV = async () => {
  const answers = await prompt([{
    type : 'input',
    name : 'filePath',
    message : 'Enter file path of csv containing distribution data: ',
  }])
  const filePath = answers.filePath
  return new Promise((resolve, reject) => {
    const recipients = []
    const amounts = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        recipients.push(data.address)
        amounts.push(utils.toWei(data.tokens, config.tokenDecimals))
      })
      .on('end', () => {
        resolve({recipients, amounts})
      })
      .on('error', reject)
  })
}

const validateDistribution = async (data, fromAccount, ethNetwork) => {
  const dataForDisplay = data.recipients.reduce((string, r, i) => {
    return string += `${r} : ${utils.fromWei(data.amounts[i], config.tokenDecimals)}\n`
  }, '')
  log.info(`
    Distribute Tokens

    Network: ${ethNetwork}
    From account: ${fromAccount}
    Data:\n\n${dataForDisplay}
  `)
  const answers = await prompt([{
    type : 'confirm',
    name : 'Confirm',
    message : 'Confirm data is correct and proceed with distribution: ',
  }])
  if (!answers.Confirm) {
    log.warn('Distribution terminated')
    process.exit()
  }
}

module.exports = { distributeTokens }
