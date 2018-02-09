import Web3 from 'web3'

const provider = new Web3.providers.HttpProvider(process.env.WEB3_HTTP_PROVIDER)

export default new Web3(provider)
