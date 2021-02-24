import express from 'express'
import path from 'path'

const { NODE_ENV, PORT } = process.env

const port = PORT || 4000
const nodeEnv = NODE_ENV || 'development'

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

// Serve client/build if in production
if (nodeEnv === 'production') {
  console.log('Loading client/build')

  const prodBuildPath = path.join(__dirname, '..', 'client', 'build')
  app.use(express.static(prodBuildPath))

  app.get('*', (req, res) => {
    res.sendFile(path.join(prodBuildPath, 'index.html'))
  })
} else {
  console.log('Development server will be run separately.')
}

// Start the server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`)
})
