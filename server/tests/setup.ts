import { beforeAll, afterAll, beforeEach } from 'vitest'
import { cleanTestDatabase, closeTestDatabase } from './helpers/test-db'

beforeAll(async () => {
  await cleanTestDatabase()
})

beforeEach(async () => {
  await cleanTestDatabase()
})

afterAll(async () => {
  await closeTestDatabase()
})