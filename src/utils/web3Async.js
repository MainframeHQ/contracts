import Web3 from 'web3'

export default new Promise(resolve => {
  // Wait for loading completion to avoid race conditions with web3 injection timing.
  window.addEventListener('load', () => {
    const provider =
      window.web3 == null
        ? new Web3.providers.HttpProvider(
            process.env.REACT_APP_WEB3_HTTP_PROVIDER,
          )
        : window.web3.currentProvider
    resolve(new Web3(provider))
  })
})
