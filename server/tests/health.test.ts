
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app'

describe('GET /health', () => {
  it('should return API health status', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.message).toBe('DevTrack API is running')
    expect(response.body.timestamp).toBeDefined()
  })
})
