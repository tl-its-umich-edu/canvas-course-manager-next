// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

interface HelloData {
  name: string;
}

export default (req: NextApiRequest, res: NextApiResponse<HelloData>) => {
  res.status(200).json({ name: 'John Doe' })
}
