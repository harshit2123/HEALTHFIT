import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (process.env['NODE_ENV'] !== 'production') {
    console.error(err.stack)
  } else {
    console.error({ message: err.message, name: err.name })
  }
  res.status(500).json({ success: false, data: null, error: 'Internal server error' })
}
