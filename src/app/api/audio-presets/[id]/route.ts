import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { AudioPresetService } from '@/lib/database/audio-presets'
import { parseBody } from '@/lib/validations/parse'
import { renameAudioPresetSchema } from '@/lib/validations/schemas/audio-preset'

export const GET = createRouteHandler<{ id: string }>(
  { auth: 'user' },
  async (req, { params }) => {
    const { id } = params
    const preset = await AudioPresetService.getPresetWithBlob(id, Number(req.user!.id))
    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }
    return { preset }
  }
)

export const PUT = createRouteHandler<{ id: string }>(
  { auth: 'user' },
  async (req, { params }) => {
    const { id } = params
    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const result = parseBody(renameAudioPresetSchema, body)
    if (!result.success) return result.response

    const preset = await AudioPresetService.renamePreset(id, Number(req.user!.id), result.data.name)
    if (!preset) {
      return NextResponse.json({ error: 'Preset not found or no permission' }, { status: 404 })
    }
    return { preset }
  }
)

export const DELETE = createRouteHandler<{ id: string }>(
  { auth: 'user' },
  async (req, { params }) => {
    const { id } = params
    const deleted = await AudioPresetService.deletePreset(id, Number(req.user!.id))
    if (!deleted) {
      return NextResponse.json({ error: 'Preset not found or no permission' }, { status: 404 })
    }
    return { message: 'Preset deleted' }
  }
)
