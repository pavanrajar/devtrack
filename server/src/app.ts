
import express from 'express'
import helmet from 'helmet'
import healthRouter from './routes/health.routes'
import authRouter from './routes/auth.routes'
import teamRouter from './routes/team.routes'
import projectRouter from './routes/project.routes'
import taskRouter from './routes/task.routes'
import errorHandler from './middleware/error.middleware'
import commentRouter from './routes/comment.routes'


import cors from 'cors'
import { env } from './config/env'

const app = express()

app.use(helmet())

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}))

app.use(express.json())

app.use('/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/teams', teamRouter)
app.use('/api', projectRouter)
app.use('/api', taskRouter)
app.use('/api', commentRouter)

app.use(errorHandler)

export default app
