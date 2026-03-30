import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { AudioPresetService } from '@/lib/database/audio-presets'
import { parseBody } from '@/lib/validations/parse'
import { reorderAudioPresetsSchema } from '@/lib/validations/schemas/audio-preset'

export const PUT = createRouteHandler(
  { auth: 'user' },
  async (req) => {
    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const result = parseBody(reorderAudioPresetsSchema, body)
    if (!result.success) return result.response

    await AudioPresetService.reorderPresets(Number(req.user!.id), result.data.presetIds)
    return { message: 'Preset order updated' }
  }
)
