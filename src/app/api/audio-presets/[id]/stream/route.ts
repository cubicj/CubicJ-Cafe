import { createRouteHandler } from '@/lib/api/route-handler'
import { AudioPresetService } from '@/lib/database/audio-presets'

export const GET = createRouteHandler<{ id: string }>(
  { auth: 'user' },
  async (req, { params }) => {
    const { id } = params
    const preset = await AudioPresetService.getPresetWithBlob(id, Number(req.user!.id))
    if (!preset) {
      return new Response(null, { status: 404 })
    }

    return new Response(Buffer.from(preset.audioBlob), {
      headers: {
        'Content-Type': preset.audioMimeType,
        'Content-Length': String(preset.audioSize),
        'Content-Disposition': `inline; filename="${encodeURIComponent(preset.audioFilename)}"`,
        'Cache-Control': 'private, max-age=3600',
        'Accept-Ranges': 'bytes',
      },
    })
  }
)
