import path from 'path'

import express from 'express'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'

import devConfig from '../webpack/webpack.dev'

const compiler = webpack(devConfig)
const { NODE_ENV, PORT, HOST } = process.env

const port = PORT ?? 4000
const isDev = NODE_ENV !== 'production'
const host = HOST ?? 'localhost'

// Initialize
const app = express()

// API Routes

const apiPathBase = '/api/'

// Added for proof of concept
app.get(apiPathBase + 'hello', (req, res) => {
  let message = `Status code: ${res.statusCode}.`
  if (res.statusCode === 200) {
    message += ' You successfully communicated with the backend server. Hooray!'
  }
  res.json({ message: message })
})

console.log(`Environment: ${isDev ? 'Development' : 'Production'}`)

// Handle client code
if (isDev) {
  console.log('Setting up webpack-dev-middleware...')
  const publicPath = typeof devConfig.output?.publicPath === 'string'
    ? devConfig.output.publicPath
    : undefined

  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: publicPath,
      // Just copies what's used in memory to client/build (changing doesn't do anything)
      writeToDisk: true
    })
  )
} else {
  console.log('Loading dist/client...')
  const prodBuildPath = path.join(__dirname, '..', 'client')

  app.use(express.static(prodBuildPath))

  app.get('*', (req, res) => {
    res.sendFile(path.join(prodBuildPath, 'index.html'))
  })
}

// Start the server
// TO DO: handle production host
app.listen(port, () => {
  console.log(`Server started on ${host} and port ${port}`)
})
