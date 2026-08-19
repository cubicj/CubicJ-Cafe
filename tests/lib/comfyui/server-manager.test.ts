import { ComfyUIServerManager } from '@/lib/comfyui/server-manager'

describe('ComfyUIServerManager', () => {
  it('returns null when no servers are active', () => {
    const manager = new ComfyUIServerManager()

    expect(manager.selectBestServer()).toBeNull()
  })

  it('selects the available server with the best priority', () => {
    const manager = new ComfyUIServerManager()
    const servers = [
      {
        id: 'local',
        type: 'LOCAL',
        url: 'http://127.0.0.1:8188',
        isActive: true,
        activeJobs: 0,
        maxJobs: 1,
        priority: 2,
      },
      {
        id: 'runpod-0',
        type: 'RUNPOD',
        url: 'https://example.test',
        isActive: true,
        activeJobs: 0,
        maxJobs: 1,
        priority: 1,
      },
    ]

    Object.assign(manager, { servers })

    expect(manager.selectBestServer()?.id).toBe('runpod-0')
  })
})
