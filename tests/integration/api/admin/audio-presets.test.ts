import { describe, it, expect, beforeEach } from 'vitest'
import { cleanTables } from '../../../helpers/db'
import { createUser, createAdminUser } from '../../../helpers/fixtures'
import { buildAuthenticatedRequest } from '../../../helpers/auth'
import { createTestSession } from '../../../helpers/auth'
import { GET as ADMIN_GET } from '@/app/api/admin/audio-presets/route'
import { DELETE as ADMIN_DELETE } from '@/app/api/admin/audio-presets/[id]/route'
import { POST } from '@/app/api/audio-presets/route'

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

describe('Admin Audio Presets API', () => {
  beforeEach(async () => {
    await cleanTables()
  })

  describe('GET /api/admin/audio-presets', () => {
    it('returns 403 for non-admin', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const res = await ADMIN_GET(buildAuthenticatedRequest('/api/admin/audio-presets', session.id))
      expect(res.status).toBe(403)
    })

    it('returns all presets with user info', async () => {
      const admin = await createAdminUser()
      const adminSession = await createTestSession(admin.id)

      const user = await createUser()
      const userSession = await createTestSession(user.id)
      await POST(buildFormDataRequest('/api/audio-presets', userSession.id, 'User Audio', createAudioFile()))

      const res = await ADMIN_GET(buildAuthenticatedRequest('/api/admin/audio-presets', adminSession.id))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.presets).toHaveLength(1)
      expect(body.presets[0].user.nickname).toBe('TestUser')
    })

    it('filters by userId', async () => {
      const admin = await createAdminUser()
      const adminSession = await createTestSession(admin.id)

      const user = await createUser()
      const userSession = await createTestSession(user.id)
      await POST(buildFormDataRequest('/api/audio-presets', userSession.id, 'User Audio', createAudioFile()))

      const res = await ADMIN_GET(
        buildAuthenticatedRequest(`/api/admin/audio-presets?userId=${user.id}`, adminSession.id)
      )
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.presets).toHaveLength(1)
    })
  })

  describe('DELETE /api/admin/audio-presets/[id]', () => {
    it('admin deletes any preset', async () => {
      const admin = await createAdminUser()
      const adminSession = await createTestSession(admin.id)

      const user = await createUser()
      const userSession = await createTestSession(user.id)
      const createRes = await POST(buildFormDataRequest('/api/audio-presets', userSession.id, 'Delete Me', createAudioFile()))
      const { preset } = await createRes.json()

      const res = await ADMIN_DELETE(
        buildAuthenticatedRequest(`/api/admin/audio-presets/${preset.id}`, adminSession.id, { method: 'DELETE' }),
        { params: Promise.resolve({ id: preset.id }) }
      )
      expect(res.status).toBe(200)
    })

    it('returns 404 for non-existent preset', async () => {
      const admin = await createAdminUser()
      const adminSession = await createTestSession(admin.id)

      const res = await ADMIN_DELETE(
        buildAuthenticatedRequest('/api/admin/audio-presets/nonexistent', adminSession.id, { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'nonexistent' }) }
      )
      expect(res.status).toBe(404)
    })
  })
})
