
import type { Server } from 'node:http'
import { env } from './config/env'
import { connectDatabase, pool } from './config/database'
import app from './app'

const startServer = async (): Promise<Server> => {
  try {
    await connectDatabase()

    return app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`)
    })
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined
    console.error('Failed to start DevTrack API:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      ...(code ? { code } : {}),
    })
    throw error
  }
}

if (require.main === module) {
  void startServer()
    .then((server) => {
      let shuttingDown = false

      const shutdown = (signal: NodeJS.Signals) => {
        if (shuttingDown) return
        shuttingDown = true
        console.log(`Received ${signal}; shutting down gracefully`)

        const forceClose = setTimeout(() => {
          server.closeAllConnections()
        }, 10000)
        forceClose.unref()

        server.close((error) => {
          clearTimeout(forceClose)
          if (error) {
            console.error('HTTP server shutdown failed:', error.name)
            process.exitCode = 1
          }

          void pool.end().catch((poolError: unknown) => {
            console.error(
              'PostgreSQL pool shutdown failed:',
              poolError instanceof Error ? poolError.name : 'UnknownError',
            )
            process.exitCode = 1
          })
        })
      }

      process.once('SIGINT', shutdown)
      process.once('SIGTERM', shutdown)
    })
    .catch(() => {
      process.exitCode = 1
    })
}





