const _ = require("lodash")

module.exports = {
  assertEvent: (contract, filter) => {
    return new Promise((resolve, reject) => {
      const event = contract[filter.event]()
      event.watch()
      event.get((error, logs) => {
        const log = _.filter(logs, filter)
        if (log) {
          resolve(log)
        } else {
          throw Error("Failed to find filtered event for " + filter.event)
        }
      })
      event.stopWatching()
    })
  },

  expectAsyncThrow: async (asyncFunc) => {
    return new Promise(async (resolve, reject) => {
      try {
        await asyncFunc()
      } catch (err) {
        resolve(true)
      }
      resolve(false)
    })
  }
}
