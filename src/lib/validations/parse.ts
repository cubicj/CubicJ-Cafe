import { NextResponse } from 'next/server'
import { ZodType, ZodError } from 'zod'

type ParseSuccess<T> = { success: true; data: T }
type ParseFailure = { success: false; response: NextResponse }
export type ParseResult<T> = ParseSuccess<T> | ParseFailure

function formatZodError(error: ZodError): NextResponse {
  const details = error.issues.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }))
  return NextResponse.json({ error: 'Validation failed', details }, { status: 400 })
}

export function parseBody<T>(schema: ZodType<T>, data: unknown): ParseResult<T> {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, response: formatZodError(result.error) }
}

export function parseQuery<T>(schema: ZodType<T>, params: URLSearchParams): ParseResult<T> {
  const obj: Record<string, string> = {}
  params.forEach((value, key) => {
    obj[key] = value
  })
  const result = schema.safeParse(obj)
  if (result.success) return { success: true, data: result.data }
  return { success: false, response: formatZodError(result.error) }
}

export function parseFormData<T>(schema: ZodType<T>, formData: FormData): ParseResult<T> {
  const obj: Record<string, unknown> = {}
  formData.forEach((value, key) => {
    obj[key] = value
  })
  const result = schema.safeParse(obj)
  if (result.success) return { success: true, data: result.data }
  return { success: false, response: formatZodError(result.error) }
}
