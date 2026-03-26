import { vi } from 'vitest'
import { GET as getSamplers } from '@/app/api/admin/comfyui/samplers/route'
import { GET as getModels } from '@/app/api/admin/comfyui/models/route'
import { GET as getNodeOptions } from '@/app/api/admin/comfyui/node-options/route'
import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

vi.mock('@/lib/comfyui/comfyui-state', () => ({
  isComfyUIEnabled: vi.fn(() => true),
}))

vi.mock('@/lib/comfyui/client', () => ({
  comfyUIClient: {
    getSamplerList: vi.fn(() => Promise.resolve(['euler', 'euler_ancestral', 'dpmpp_2m'])),
    getModelList: vi.fn(() => Promise.resolve({ diffusionModels: ['model1.safetensors'], textEncoders: [], vaes: [] })),
    getNodeOptions: vi.fn(() => Promise.resolve({ '10': { sampler_name: ['euler', 'dpmpp'] } })),
  },
}))

import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state'

beforeEach(async () => {
  await cleanTables()
  vi.mocked(isComfyUIEnabled).mockReturnValue(true)
})

describe('Admin ComfyUI Endpoints', () => {
  describe('GET /api/admin/comfyui/samplers', () => {
    it('returns 401 without authentication', async () => {
      const req = buildRequest('/api/admin/comfyui/samplers')
      const res = await getSamplers(req)
      expect(res.status).toBe(401)
    })

    it('returns 403 for non-admin user', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui/samplers', session.id)
      const res = await getSamplers(req)
      expect(res.status).toBe(403)
    })

    it('returns samplers for admin', async () => {
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui/samplers', session.id)
      const res = await getSamplers(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.samplers).toEqual(['euler', 'euler_ancestral', 'dpmpp_2m'])
    })

    it('returns empty array when ComfyUI disabled', async () => {
      vi.mocked(isComfyUIEnabled).mockReturnValue(false)
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui/samplers', session.id)
      const res = await getSamplers(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.samplers).toEqual([])
    })
  })

  describe('GET /api/admin/comfyui/models', () => {
    it('returns 401 without authentication', async () => {
      const req = buildRequest('/api/admin/comfyui/models')
      const res = await getModels(req)
      expect(res.status).toBe(401)
    })

    it('returns 403 for non-admin user', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui/models', session.id)
      const res = await getModels(req)
      expect(res.status).toBe(403)
    })

    it('returns models for admin', async () => {
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui/models', session.id)
      const res = await getModels(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.models).toEqual({ diffusionModels: ['model1.safetensors'], textEncoders: [], vaes: [] })
    })

    it('returns empty object when ComfyUI disabled', async () => {
      vi.mocked(isComfyUIEnabled).mockReturnValue(false)
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui/models', session.id)
      const res = await getModels(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.models).toEqual({})
    })
  })

  describe('GET /api/admin/comfyui/node-options', () => {
    it('returns 401 without authentication', async () => {
      const req = buildRequest('/api/admin/comfyui/node-options')
      const res = await getNodeOptions(req)
      expect(res.status).toBe(401)
    })

    it('returns 403 for non-admin user', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui/node-options', session.id)
      const res = await getNodeOptions(req)
      expect(res.status).toBe(403)
    })

    it('returns options for valid query', async () => {
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest(
        '/api/admin/comfyui/node-options?q=10:KSampler:sampler_name',
        session.id
      )
      const res = await getNodeOptions(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.options).toEqual({ '10': { sampler_name: ['euler', 'dpmpp'] } })
    })

    it('returns empty object when no q param', async () => {
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui/node-options', session.id)
      const res = await getNodeOptions(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.options).toEqual({})
    })

    it('returns empty object when ComfyUI disabled', async () => {
      vi.mocked(isComfyUIEnabled).mockReturnValue(false)
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest(
        '/api/admin/comfyui/node-options?q=10:KSampler:sampler_name',
        session.id
      )
      const res = await getNodeOptions(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.options).toEqual({})
    })
  })
})
