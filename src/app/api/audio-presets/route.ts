import { createRouteHandler } from '@/lib/api/route-handler'
import { AudioPresetService } from '@/lib/database/audio-presets'
import { parseFormData } from '@/lib/validations/parse'
import { createAudioPresetSchema } from '@/lib/validations/schemas/audio-preset'

export const GET = createRouteHandler(
  { auth: 'user' },
  async (req) => {
    const presets = await AudioPresetService.getUserPresets(Number(req.user!.id))
    return { presets, count: presets.length }
  }
)

export const POST = createRouteHandler(
  { auth: 'user' },
  async (req) => {
    const formData = await req.formData()
    const result = parseFormData(createAudioPresetSchema, formData)
    if (!result.success) return result.response

    const { name, audio } = result.data
    const audioBuffer = new Uint8Array(await audio.arrayBuffer())

    const preset = await AudioPresetService.createPreset(Number(req.user!.id), {
      name,
      audioBlob: audioBuffer,
      audioFilename: audio.name,
      audioMimeType: audio.type,
      audioSize: audio.size,
    })

    return { preset }
  }
)
