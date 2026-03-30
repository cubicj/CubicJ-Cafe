import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { AudioPresetService } from '@/lib/database/audio-presets'

export const DELETE = createRouteHandler<{ id: string }>(
  { auth: 'admin', category: 'admin' },
  async (_req, { params }) => {
    const { id } = params
    const deleted = await AudioPresetService.adminDeletePreset(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }
    return { message: 'Preset deleted by admin' }
  }
)
