import { describe, it, expect, beforeEach } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { buildRequest, buildAuthenticatedRequest, noContext } from '../../helpers/auth'
import { createTestSession } from '../../helpers/auth'
import { GET, POST } from '@/app/api/audio-presets/route'
import { PUT, DELETE } from '@/app/api/audio-presets/[id]/route'
import { GET as STREAM } from '@/app/api/audio-presets/[id]/stream/route'
import { PUT as REORDER } from '@/app/api/audio-presets/reorder/route'

function createAudioFile(name = 'test.wav', size = 1024) {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type: 'audio/wav' })
}

function buildFormDataRequest(url: string, sessionId: string, name: string, file: File) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('audio', file)
  return buildAuthenticatedRequest(url, sessionId, {
    method: 'POST',
    body: formData,
  })
}

describe('Audio Presets API', () => {
  beforeEach(async () => {
    await cleanTables()
  })

  describe('GET /api/audio-presets', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await GET(buildRequest('/api/audio-presets'))
      expect(res.status).toBe(401)
    })

    it('returns empty list for new user', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const res = await GET(buildAuthenticatedRequest('/api/audio-presets', session.id))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.presets).toEqual([])
      expect(body.count).toBe(0)
    })

    it('returns user presets without blob', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      await POST(buildFormDataRequest('/api/audio-presets', session.id, 'My Audio', createAudioFile()))

      const res = await GET(buildAuthenticatedRequest('/api/audio-presets', session.id))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.presets).toHaveLength(1)
      expect(body.presets[0].name).toBe('My Audio')
      expect(body.presets[0].audioFilename).toBe('test.wav')
      expect(body.presets[0].audioBlob).toBeUndefined()
    })
  })

  describe('POST /api/audio-presets', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await POST(buildRequest('/api/audio-presets', { method: 'POST' }))
      expect(res.status).toBe(401)
    })

    it('creates preset with name and audio file', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const res = await POST(buildFormDataRequest('/api/audio-presets', session.id, 'BGM 1', createAudioFile('bgm.mp3', 2048)))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.preset.name).toBe('BGM 1')
      expect(body.preset.audioFilename).toBe('bgm.mp3')
      expect(body.preset.audioSize).toBe(2048)
    })

    it('returns 400 when name is missing', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const formData = new FormData()
      formData.append('name', '')
      formData.append('audio', createAudioFile())
      const res = await POST(buildAuthenticatedRequest('/api/audio-presets', session.id, {
        method: 'POST',
        body: formData,
      }))
      expect(res.status).toBe(400)
    })

    it('returns 400 when audio file is missing', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const formData = new FormData()
      formData.append('name', 'test')
      const res = await POST(buildAuthenticatedRequest('/api/audio-presets', session.id, {
        method: 'POST',
        body: formData,
      }))
      expect(res.status).toBe(400)
    })
  })

  describe('PUT /api/audio-presets/[id]', () => {
    it('renames own preset', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const createRes = await POST(buildFormDataRequest('/api/audio-presets', session.id, 'Original', createAudioFile()))
      const { preset } = await createRes.json()

      const res = await PUT(
        buildAuthenticatedRequest(`/api/audio-presets/${preset.id}`, session.id, {
          method: 'PUT',
          body: JSON.stringify({ name: 'Renamed' }),
          headers: { 'content-type': 'application/json' },
        }),
        { params: Promise.resolve({ id: preset.id }) }
      )
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.preset.name).toBe('Renamed')
    })

    it('returns 404 for other user preset', async () => {
      const user1 = await createUser()
      const session1 = await createTestSession(user1.id)
      const createRes = await POST(buildFormDataRequest('/api/audio-presets', session1.id, 'User1 Audio', createAudioFile()))
      const { preset } = await createRes.json()

      const user2 = await createUser({ discordId: 'other-123', discordUsername: 'other', nickname: 'Other' })
      const session2 = await createTestSession(user2.id)

      const res = await PUT(
        buildAuthenticatedRequest(`/api/audio-presets/${preset.id}`, session2.id, {
          method: 'PUT',
          body: JSON.stringify({ name: 'Hijack' }),
          headers: { 'content-type': 'application/json' },
        }),
        { params: Promise.resolve({ id: preset.id }) }
      )
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/audio-presets/[id]', () => {
    it('deletes own preset', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const createRes = await POST(buildFormDataRequest('/api/audio-presets', session.id, 'Delete Me', createAudioFile()))
      const { preset } = await createRes.json()

      const res = await DELETE(
        buildAuthenticatedRequest(`/api/audio-presets/${preset.id}`, session.id, { method: 'DELETE' }),
        { params: Promise.resolve({ id: preset.id }) }
      )
      expect(res.status).toBe(200)

      const checkRes = await GET(buildAuthenticatedRequest('/api/audio-presets', session.id))
      const body = await checkRes.json()
      expect(body.presets).toHaveLength(0)
    })

    it('returns 404 for other user preset', async () => {
      const user1 = await createUser()
      const session1 = await createTestSession(user1.id)
      const createRes = await POST(buildFormDataRequest('/api/audio-presets', session1.id, 'Protected', createAudioFile()))
      const { preset } = await createRes.json()

      const user2 = await createUser({ discordId: 'other-123', discordUsername: 'other', nickname: 'Other' })
      const session2 = await createTestSession(user2.id)

      const res = await DELETE(
        buildAuthenticatedRequest(`/api/audio-presets/${preset.id}`, session2.id, { method: 'DELETE' }),
        { params: Promise.resolve({ id: preset.id }) }
      )
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/audio-presets/[id]/stream', () => {
    it('returns audio binary with correct headers', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const createRes = await POST(buildFormDataRequest('/api/audio-presets', session.id, 'Stream Test', createAudioFile('test.wav', 2048)))
      const { preset } = await createRes.json()

      const res = await STREAM(
        buildAuthenticatedRequest(`/api/audio-presets/${preset.id}/stream`, session.id),
        { params: Promise.resolve({ id: preset.id }) }
      )

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('audio/wav')
      expect(res.headers.get('Content-Length')).toBe('2048')
      expect(res.headers.get('Cache-Control')).toBe('private, max-age=3600')

      const body = await res.arrayBuffer()
      expect(body.byteLength).toBe(2048)
    })

    it('returns 401 when not authenticated', async () => {
      const res = await STREAM(
        buildRequest('/api/audio-presets/fake-id/stream'),
        { params: Promise.resolve({ id: 'fake-id' }) }
      )
      expect(res.status).toBe(401)
    })

    it('returns 404 for other user preset', async () => {
      const user1 = await createUser()
      const session1 = await createTestSession(user1.id)
      const createRes = await POST(buildFormDataRequest('/api/audio-presets', session1.id, 'Private', createAudioFile()))
      const { preset } = await createRes.json()

      const user2 = await createUser({ discordId: 'other-123', discordUsername: 'other', nickname: 'Other' })
      const session2 = await createTestSession(user2.id)

      const res = await STREAM(
        buildAuthenticatedRequest(`/api/audio-presets/${preset.id}/stream`, session2.id),
        { params: Promise.resolve({ id: preset.id }) }
      )
      expect(res.status).toBe(404)
    })

    it('returns 404 for non-existent preset', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)

      const res = await STREAM(
        buildAuthenticatedRequest('/api/audio-presets/nonexistent/stream', session.id),
        { params: Promise.resolve({ id: 'nonexistent' }) }
      )
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/audio-presets/reorder', () => {
    it('reorders presets', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)

      const r1 = await POST(buildFormDataRequest('/api/audio-presets', session.id, 'First', createAudioFile()))
      const r2 = await POST(buildFormDataRequest('/api/audio-presets', session.id, 'Second', createAudioFile()))
      const p1 = (await r1.json()).preset
      const p2 = (await r2.json()).preset

      const res = await REORDER(
        buildAuthenticatedRequest('/api/audio-presets/reorder', session.id, {
          method: 'PUT',
          body: JSON.stringify({ presetIds: [p2.id, p1.id] }),
          headers: { 'content-type': 'application/json' },
        }),
        noContext
      )
      expect(res.status).toBe(200)

      const listRes = await GET(buildAuthenticatedRequest('/api/audio-presets', session.id))
      const { presets } = await listRes.json()
      expect(presets[0].name).toBe('Second')
      expect(presets[1].name).toBe('First')
    })
  })
})
