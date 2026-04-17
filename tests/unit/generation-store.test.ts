import { GenerationStore } from '@/lib/generation-store'
import { GenerationJob } from '@/types'
import { loadOpsSettings } from '@/lib/database/ops-settings'
import { cleanTables } from '../helpers/db'

beforeAll(async () => {
  await cleanTables()
  await loadOpsSettings()
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function makeJob(overrides: Partial<GenerationJob>): GenerationJob {
  return {
    id: 'job-default',
    promptId: 'prompt-default',
    status: 'completed',
    updatedAt: new Date(),
    createdAt: new Date(),
    userId: 'user-1',
    prompt: 'test',
    ...overrides,
  } as GenerationJob
}

describe('GenerationStore sweep', () => {
  it('removes completed jobs older than TTL', () => {
    const store = new GenerationStore()
    const oldDate = new Date(Date.now() - 31 * 60 * 1000)
    store.saveJob(makeJob({ id: 'job-1', promptId: 'prompt-1', status: 'completed', updatedAt: oldDate, createdAt: oldDate }))
    store.sweep()
    expect(store.getJob('prompt-1')).toBeUndefined()
  })

  it('removes failed jobs older than TTL', () => {
    const store = new GenerationStore()
    const oldDate = new Date(Date.now() - 31 * 60 * 1000)
    store.saveJob(makeJob({ id: 'job-2', promptId: 'prompt-2', status: 'failed', updatedAt: oldDate, createdAt: oldDate }))
    store.sweep()
    expect(store.getJob('prompt-2')).toBeUndefined()
  })

  it('preserves processing jobs regardless of age', () => {
    const store = new GenerationStore()
    const oldDate = new Date(Date.now() - 60 * 60 * 1000)
    store.saveJob(makeJob({ id: 'job-3', promptId: 'prompt-3', status: 'processing', updatedAt: oldDate, createdAt: oldDate }))
    store.sweep()
    expect(store.getJob('prompt-3')).toBeDefined()
  })

  it('preserves pending jobs regardless of age', () => {
    const store = new GenerationStore()
    const oldDate = new Date(Date.now() - 60 * 60 * 1000)
    store.saveJob(makeJob({ id: 'job-4', promptId: 'prompt-4', status: 'pending', updatedAt: oldDate, createdAt: oldDate }))
    store.sweep()
    expect(store.getJob('prompt-4')).toBeDefined()
  })

  it('preserves completed jobs within TTL', () => {
    const store = new GenerationStore()
    const recentDate = new Date(Date.now() - 10 * 60 * 1000)
    store.saveJob(makeJob({ id: 'job-5', promptId: 'prompt-5', status: 'completed', updatedAt: recentDate, createdAt: recentDate }))
    store.sweep()
    expect(store.getJob('prompt-5')).toBeDefined()
  })
})
