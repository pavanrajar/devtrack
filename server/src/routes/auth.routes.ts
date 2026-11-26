
import { Router } from 'express'
import { register, login, logout, me } from '../controllers/auth.controller'
import authenticate from '../middleware/auth.middleware'
import validate from '../middleware/validate.middleware'
import {
  registerSchema,
  loginSchema,
} from '../validators/auth.validator'

import { authRateLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

router.post('/register', authRateLimiter, validate(registerSchema), register)
router.post('/login', authRateLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', authenticate, me)



export default router
