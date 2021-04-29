const { NODE_ENV } = process.env
console.log(`${process.env.DB_HOST} and ${process.env.DB_USER}`)
module.exports = {
  'development': {
    'username': process.env.DB_USER,
    'password': process.env.DB_PASSWORD,
    'database': process.env.DB_NAME,
    'host': process.env.DB_HOST,
    'dialect': 'mysql'
  },
  'production': {
    'username': process.env.DB_USER,
    'password': process.env.DB_PASSWORD,
    'database': process.env.DB_NAME,
    'host': process.env.DB_HOST,
    'dialect': 'mysql'
  }
}
