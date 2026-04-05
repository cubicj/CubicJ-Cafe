import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { AudioPresetService, UpdateAudioPresetData } from '@/lib/database/audio-presets'
import { parseFormData } from '@/lib/validations/parse'
import { updateAudioPresetSchema } from '@/lib/validations/schemas/audio-preset'

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
    const formData = await req.formData()
    const result = parseFormData(updateAudioPresetSchema, formData)
    if (!result.success) return result.response

    const { name, audio } = result.data
    const updateData: UpdateAudioPresetData = { name }

    if (audio) {
      updateData.audioBlob = new Uint8Array(await audio.arrayBuffer())
      updateData.audioFilename = audio.name
      updateData.audioMimeType = audio.type
      updateData.audioSize = audio.size
    }

    const preset = await AudioPresetService.updatePreset(id, Number(req.user!.id), updateData)
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
