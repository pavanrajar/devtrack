
import { Router } from 'express'
import { pool } from '../config/database'

const router = Router()

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'DevTrack API is running',
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

router.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.status(200).json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Readiness check failed:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      code:
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
          ? error.code
          : undefined,
    })
    res.status(503).json({
      success: false,
      status: 'not_ready',
      message: 'Database is unavailable',
    })
  }
})

export default router
