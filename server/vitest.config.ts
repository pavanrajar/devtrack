import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import dotenv from 'dotenv'

dotenv.config({
  path: resolve(__dirname, '../.env.test'),
})

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
    },
    
  },
})