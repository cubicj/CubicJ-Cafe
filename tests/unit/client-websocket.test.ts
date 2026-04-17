import type { WsExecutedData, WsExecutionErrorData, VideoFileInfo } from '@/lib/comfyui/client-types'
import { ComfyUIClient } from '@/lib/comfyui/client-core'

vi.mock('@/lib/database/ops-settings', () => ({
  getOpsSetting: () => 30000,
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('WebSocket types', () => {
  it('WsExecutedData has correct shape', () => {
    const data: WsExecutedData = {
      node: '64',
      output: {
        gifs: [{ filename: 'test_00001-audio.mp4', subfolder: 'wan', type: 'temp' }],
      },
      prompt_id: 'abc-123',
    }
    expect(data.prompt_id).toBe('abc-123')
    expect(data.output!.gifs![0].filename).toBe('test_00001-audio.mp4')
  })

  it('WsExecutionErrorData has correct shape', () => {
    const data: WsExecutionErrorData = {
      prompt_id: 'abc-123',
      node_id: '64',
      node_type: 'VHS_VideoCombine',
      exception_message: 'Out of memory',
      exception_type: 'RuntimeError',
    }
    expect(data.prompt_id).toBe('abc-123')
    expect(data.exception_message).toBe('Out of memory')
  })

  it('VideoFileInfo has correct shape', () => {
    const info: VideoFileInfo = {
      filename: 'test_00001-audio.mp4',
      subfolder: 'wan',
      type: 'temp',
    }
    expect(info.filename).toBe('test_00001-audio.mp4')
  })
})

describe('ComfyUIClient WebSocket', () => {
  let client: ComfyUIClient

  beforeEach(() => {
    client = new ComfyUIClient({ baseURL: 'http://127.0.0.1:8188', useProxy: false })
  })

  afterEach(() => {
    client.disconnectWebSocket()
  })

  it('registers and removes executed callbacks', () => {
    const callback = vi.fn()
    client.onExecuted('prompt-1', callback)
    client.removeCallbacks('prompt-1')
  })

  it('registers and removes error callbacks', () => {
    const callback = vi.fn()
    client.onExecutionError('prompt-1', callback)
    client.removeCallbacks('prompt-1')
  })

  it('routes executed message to correct callback', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    client.onExecuted('prompt-1', callback1)
    client.onExecuted('prompt-2', callback2)

    const message: WsExecutedData = {
      node: '64',
      output: { gifs: [{ filename: 'test.mp4', subfolder: 'wan', type: 'temp' }] },
      prompt_id: 'prompt-1',
    }

    client['handleWsMessage'](JSON.stringify({ type: 'executed', data: message }))

    expect(callback1).toHaveBeenCalledWith(message)
    expect(callback2).not.toHaveBeenCalled()
  })

  it('routes execution_error message to correct callback', () => {
    const callback = vi.fn()
    client.onExecutionError('prompt-1', callback)

    const message: WsExecutionErrorData = {
      prompt_id: 'prompt-1',
      node_id: '64',
      node_type: 'VHS_VideoCombine',
      exception_message: 'OOM',
      exception_type: 'RuntimeError',
    }

    client['handleWsMessage'](JSON.stringify({ type: 'execution_error', data: message }))

    expect(callback).toHaveBeenCalledWith(message)
  })

  it('ignores messages for unregistered promptIds', () => {
    const message = JSON.stringify({
      type: 'executed',
      data: { node: '1', output: {}, prompt_id: 'unknown' },
    })

    client['handleWsMessage'](message)
  })

  it('ignores non-executed/non-error message types', () => {
    const callback = vi.fn()
    client.onExecuted('prompt-1', callback)

    client['handleWsMessage'](JSON.stringify({ type: 'progress', data: { prompt_id: 'prompt-1' } }))

    expect(callback).not.toHaveBeenCalled()
  })

  it('ignores malformed JSON messages', () => {
    client['handleWsMessage']('not json at all')
  })

  it('getWebSocketURL returns correct URL', () => {
    const url = client.getWebSocketURL()
    expect(url).toMatch(/^ws:\/\/127\.0\.0\.1:8188\/ws\?clientId=cubicj-cafe-/)
  })

  it('preserves executed callbacks across disconnect', () => {
    const callback = vi.fn()
    client.onExecuted('prompt-1', callback)

    client.disconnectWebSocket()

    const message: WsExecutedData = {
      node: '82',
      output: { gifs: [{ filename: 'test.mp4', subfolder: 'wan', type: 'temp' }] },
      prompt_id: 'prompt-1',
    }
    client['handleWsMessage'](JSON.stringify({ type: 'executed', data: message }))

    expect(callback).toHaveBeenCalledWith(message)
  })

  it('preserves error callbacks across disconnect', () => {
    const callback = vi.fn()
    client.onExecutionError('prompt-1', callback)

    client.disconnectWebSocket()

    const message: WsExecutionErrorData = {
      prompt_id: 'prompt-1',
      node_id: '82',
      node_type: 'VHS_VideoCombine',
      exception_message: 'OOM',
      exception_type: 'RuntimeError',
    }
    client['handleWsMessage'](JSON.stringify({ type: 'execution_error', data: message }))

    expect(callback).toHaveBeenCalledWith(message)
  })
})
