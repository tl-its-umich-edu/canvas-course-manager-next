// import { Config } from '../../config'
import { Sequelize } from 'sequelize'

var env = process.env.NODE_ENV
var config = require('./../config/config.js')

// const config = validateConfig(process.env)


console.log(config)

const  sequelize = new Sequelize(config.database, config.username, config.password, {
    dialect: 'mysql',
    host: config.host,
    // Todo: hook this up to logging level
    logging: false
  
  })
  
  export { Sequelize, sequelize };
