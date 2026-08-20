import { vi } from 'vitest'
import { ComfyUIServerManager, type ActiveServer, type ComfyUIServer } from '@/lib/comfyui/server-manager'

vi.mock('@/lib/database/ops-settings', () => ({
  getOpsSetting: () => 60000,
}))

function createClient(overrides: Record<string, unknown> = {}) {
  return {
    checkServerHealth: vi.fn().mockResolvedValue(true),
    connectWebSocket: vi.fn(),
    disconnectWebSocket: vi.fn(),
    isWebSocketConnected: vi.fn().mockReturnValue(false),
    ...overrides,
  }
}

function createActiveServer(
  id: string,
  type: 'local' | 'runpod',
  client = createClient(),
  currentJobId?: string,
): ActiveServer {
  return {
    id,
    client: client as never,
    name: type === 'local' ? '로컬 서버' : `Runpod ${id}`,
    type,
    url: type === 'local' ? 'http://127.0.0.1:8188' : `https://${id}.example.test`,
    currentJobId,
  }
}

describe('ComfyUIServerManager', () => {
  it('returns null when no servers are active', () => {
    const manager = new ComfyUIServerManager()

    expect(manager.selectBestServer()).toBeNull()
  })

  it('selects the available server with the best submission priority', () => {
    const manager = new ComfyUIServerManager()
    const servers: ComfyUIServer[] = [
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

  it('refreshes the runtime pool with canonical inventory ids and preserves leases', async () => {
    const manager = new ComfyUIServerManager()
    const localClient = createClient()
    const runpodClient = createClient()
    const removedClient = createClient()
    const servers: ComfyUIServer[] = [
      {
        id: 'local',
        type: 'LOCAL',
        url: 'http://127.0.0.1:8188',
        isActive: false,
        activeJobs: 0,
        maxJobs: 1,
        priority: 2,
      },
      {
        id: 'runpod-3',
        type: 'RUNPOD',
        url: 'https://runpod.example.test',
        isActive: false,
        activeJobs: 0,
        maxJobs: 1,
        priority: 1,
      },
    ]
    const existingRunpod = createActiveServer('stale-id', 'runpod', runpodClient, 'request-1')
    existingRunpod.url = 'https://runpod.example.test'
    const removedServer = createActiveServer('runpod-removed', 'runpod', removedClient)

    Object.assign(manager, {
      servers,
      activeServers: [existingRunpod, removedServer],
      lastServerUpdateTime: 0,
    })
    vi.spyOn(manager, 'getClient').mockImplementation(server => (
      server.id === 'local' ? localClient : runpodClient
    ) as never)

    await manager.updateActiveServers()

    expect(manager.getActiveServers().map(server => ({
      id: server.id,
      name: server.name,
      currentJobId: server.currentJobId,
    }))).toEqual([
      { id: 'local', name: '로컬 서버', currentJobId: undefined },
      { id: 'runpod-3', name: 'Runpod runpod-3', currentJobId: 'request-1' },
    ])
    expect(removedClient.disconnectWebSocket).toHaveBeenCalledOnce()
  })

  it('selects runpod first and manages lease release notifications', () => {
    const manager = new ComfyUIServerManager()
    const localServer = createActiveServer('local', 'local')
    const runpodServer = createActiveServer('runpod-0', 'runpod')
    const listener = vi.fn()
    Object.assign(manager, { activeServers: [localServer, runpodServer] })
    manager.setSlotReleasedListener(listener)

    const selectedServer = manager.selectAvailableServer()
    expect(selectedServer?.id).toBe('runpod-0')

    manager.assignJobToServer(selectedServer!, 'request-1')
    expect(manager.getAvailableServerCount()).toBe(1)

    manager.releaseServer('request-1')
    expect(runpodServer.currentJobId).toBeUndefined()
    expect(listener).toHaveBeenCalledOnce()
  })

  it('releases only leases absent from the processing id set', () => {
    const manager = new ComfyUIServerManager()
    const retainedServer = createActiveServer('runpod-0', 'runpod', createClient(), 'request-active')
    const orphanedServer = createActiveServer('local', 'local', createClient(), 'request-orphaned')
    Object.assign(manager, { activeServers: [retainedServer, orphanedServer] })

    expect(manager.reconcileProcessingSlots(new Set(['request-active']))).toBe(1)
    expect(retainedServer.currentJobId).toBe('request-active')
    expect(orphanedServer.currentJobId).toBeUndefined()
  })

  it('connects runtime sockets on enable and disconnects them on disable', async () => {
    const manager = new ComfyUIServerManager()
    const client = createClient()
    const server = createActiveServer('local', 'local', client)
    Object.assign(manager, { activeServers: [server] })
    vi.spyOn(manager, 'updateActiveServers').mockResolvedValue(undefined)

    manager.enableStreaming()
    await Promise.resolve()
    manager.disableStreaming()

    expect(client.connectWebSocket).toHaveBeenCalledOnce()
    expect(client.disconnectWebSocket).toHaveBeenCalledOnce()
  })
})
