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

export default apiRouter
