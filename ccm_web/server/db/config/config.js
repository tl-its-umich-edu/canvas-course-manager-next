

// {
//   "development": {
//     "username": "admin",
//     "password": "admin",
//     "database": "ccm",
//     "host": "ccm_db",
//     "dialect": "mysql"
//   },
//   "test": {
//     "username": "root",
//     "password": null,
//     "database": "database_test",
//     "host": "127.0.0.1",
//     "dialect": "mysql"
//   },
//   "production": {
//     "username": "root",
//     "password": null,
//     "database": "database_production",
//     "host": "127.0.0.1",
//     "dialect": "mysql"
//   }
// }
// require('dotenv').config()
// const { NODE_ENV } = process.env
// console.log(`${process.env.DB_HOST} and ${process.env.DB_USER}`)
// module.exports = {
//   'development': {
//         'username': process.env.DB_USER,
//         'password': process.env.DB_PASSWORD,
//         'database': process.env.DB_NAME,
//         'host': process.env.DB_HOST,
//         'dialect': 'mysql'
//       },
//       'test': {
//         'username': process.env.DB_USER,
//         'password': process.env.DB_PASSWORD,
//         'database': process.env.DB_NAME,
//         'host': process.env.DB_HOST,
//         'dialect': 'mysql'
//       },
//       'production': {
//         'username': process.env.DB_USER,
//         'password': process.env.DB_PASSWORD,
//         'database': process.env.DB_NAME,
//         'host': process.env.DB_HOST,
//         'dialect': 'mysql'
//       }

// }

// require('dotenv').config()
const { NODE_ENV } = process.env
console.log(`${process.env.DB_HOST} and ${process.env.DB_USER}`)
module.exports = {
  'development': {
        'username': 'admin',
        'password': 'admin',
        'database': 'ccm',
        'host': 'ccm_db',
        'dialect': 'mysql'
      },
      'test': {
        'username': 'admin',
        'password': 'admin',
        'database': 'ccm',
        'host': 'ccm_db',
        'dialect': 'mysql'
      },
      'production': {
        'username': 'admin',
        'password': 'admin',
        'database': 'ccm',
        'host': 'ccm_db',
        'dialect': 'mysql'
      }

}
