import express from 'express'
import type { Request, Response } from 'express'

const apiRouter = express.Router()

/*
Server API Routes
Routes will begin with /api
*/

// Added for proof of concept
apiRouter.get('/hello', (req: Request, res: Response) => {
  const data = { message: 'You successfully communicated with the backend server. Hooray!' }
  res.json(data)
})

apiRouter.get('/globals', (req: Request, res: Response) => {
  const globals = {
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    useLTI: process.env.LTI === 'True'
  }
  res.json(globals)
})

export default apiRouter
