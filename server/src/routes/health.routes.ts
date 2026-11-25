
import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'DevTrack API is running',
    timestamp: new Date().toISOString(),
  })
})

// // Temporary error-handling test route
// router.get('/error-test', (_req, _res, next) => {
//   next(new Error('This is a test error'))
// })

export default router
