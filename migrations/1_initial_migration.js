/* global artifacts */

const Migrations = artifacts.require('Migrations')
const SimpleStorage = artifacts.require('SimpleStorage')

module.exports = deployer => {
  deployer.deploy([Migrations, SimpleStorage])
}
