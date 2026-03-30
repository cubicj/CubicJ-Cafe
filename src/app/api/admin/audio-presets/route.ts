import { createRouteHandler } from '@/lib/api/route-handler'
import { AudioPresetService } from '@/lib/database/audio-presets'

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const url = new URL(req.url)
    const userIdParam = url.searchParams.get('userId')
    const userId = userIdParam ? Number(userIdParam) : undefined

    const presets = await AudioPresetService.getAllPresets(userId)
    return { presets, count: presets.length }
  }
)
