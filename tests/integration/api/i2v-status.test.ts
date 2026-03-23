import { generationStore } from '@/lib/generation-store'
import { buildRequest } from '../../helpers/auth'

import { GET } from '@/app/api/i2v/status/route'

describe('GET /api/i2v/status', () => {
  it('returns 400 when jobId is missing', async () => {
    const req = buildRequest('/api/i2v/status')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when job does not exist', async () => {
    const req = buildRequest('/api/i2v/status?jobId=nonexistent-id')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Job not found')
  })

  it('returns job status when job exists', async () => {
    const now = new Date()
    generationStore.saveJob({
      id: 'test-job-123',
      userId: 'user-1',
      promptId: 'prompt-456',
      status: 'processing',
      prompt: 'test prompt',
      createdAt: now,
      updatedAt: now,
    })

    const req = buildRequest('/api/i2v/status?jobId=test-job-123')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.jobId).toBe('test-job-123')
    expect(body.status).toBe('processing')
    expect(body.prompt).toBe('test prompt')
    expect(body.promptId).toBe('prompt-456')

    generationStore.deleteJob('prompt-456')
  })

  it('returns completed job with all fields', async () => {
    const now = new Date()
    generationStore.saveJob({
      id: 'completed-job',
      userId: 'user-1',
      promptId: 'prompt-789',
      status: 'completed',
      prompt: 'completed prompt',
      createdAt: now,
      updatedAt: now,
      error: undefined,
    })

    const req = buildRequest('/api/i2v/status?jobId=completed-job')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('completed')

    generationStore.deleteJob('prompt-789')
  })

  it('returns failed job with error message', async () => {
    const now = new Date()
    generationStore.saveJob({
      id: 'failed-job',
      userId: 'user-1',
      promptId: 'prompt-fail',
      status: 'failed',
      prompt: 'failed prompt',
      createdAt: now,
      updatedAt: now,
      error: 'Something went wrong',
    })

    const req = buildRequest('/api/i2v/status?jobId=failed-job')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('failed')
    expect(body.error).toBe('Something went wrong')

    generationStore.deleteJob('prompt-fail')
  })
})
