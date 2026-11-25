
import { env } from './config/env'
import { connectDatabase } from './config/database'
import app from './app'

const startServer = async () => {
  try {
    await connectDatabase()

    app.listen(env.PORT, () => {
        console.log(`Server running on port ${env.PORT}`)
    })
  } catch (error) {
    console.error('Failed to start DevTrack API:', error)
    process.exit(1)
  }
}

startServer()





