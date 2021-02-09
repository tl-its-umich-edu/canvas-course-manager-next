import sirv from 'sirv'
import compression from 'compression'
import express from 'express'

import * as sapper from '@sapper/server'

const { PORT, NODE_ENV } = process.env
const dev = NODE_ENV === 'development'

const app = express()

app.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		sapper.middleware()
	)
	.listen(PORT)
	.on('error', (err) => console.log('error', err))
