import { z } from 'zod'
import { parseBody, parseQuery, parseFormData } from '@/lib/validations/parse'

describe('parseBody', () => {
  const schema = z.object({
    name: z.string().min(1),
    count: z.number().int().positive(),
  })

  it('returns parsed data on valid input', () => {
    const result = parseBody(schema, { name: 'test', count: 5 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: 'test', count: 5 })
    }
  })

  it('returns 400 response on invalid input', () => {
    const result = parseBody(schema, { name: '', count: -1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.response.status).toBe(400)
    }
  })

  it('returns 400 response with details array', async () => {
    const result = parseBody(schema, {})
    expect(result.success).toBe(false)
    if (!result.success) {
      const body = await result.response.json()
      expect(body.error).toBe('Validation failed')
      expect(body.details).toBeInstanceOf(Array)
      expect(body.details.length).toBeGreaterThan(0)
      expect(body.details[0]).toHaveProperty('field')
      expect(body.details[0]).toHaveProperty('message')
    }
  })
})

describe('parseQuery', () => {
  const schema = z.object({
    page: z.coerce.number().int().positive().default(1),
    q: z.string().optional(),
  })

  it('parses URLSearchParams to typed object', () => {
    const params = new URLSearchParams('page=3&q=hello')
    const result = parseQuery(schema, params)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ page: 3, q: 'hello' })
    }
  })

  it('applies defaults for missing params', () => {
    const params = new URLSearchParams('')
    const result = parseQuery(schema, params)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
    }
  })

  it('returns 400 on invalid query params', () => {
    const params = new URLSearchParams('page=abc')
    const result = parseQuery(schema, params)
    expect(result.success).toBe(false)
  })
})

describe('parseFormData', () => {
  const schema = z.object({
    title: z.string().min(1),
    image: z.instanceof(File),
  })

  it('parses FormData with string and File fields', () => {
    const fd = new FormData()
    fd.set('title', 'hello')
    fd.set('image', new File(['data'], 'test.png', { type: 'image/png' }))
    const result = parseFormData(schema, fd)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('hello')
      expect(result.data.image).toBeInstanceOf(File)
    }
  })

  it('returns 400 on missing required fields', () => {
    const fd = new FormData()
    const result = parseFormData(schema, fd)
    expect(result.success).toBe(false)
  })
})
