import { vi } from 'vitest'

vi.mock('@/lib/startup/init', () => ({
  initializeServices: vi.fn(),
}))

vi.mock('@/lib/logger-file', () => ({
  initFileLogging: vi.fn(),
}))
