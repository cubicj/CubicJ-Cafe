export type WanContextOptions = {
  context_schedule: 'static_standard'
  context_frames: 81
  context_stride: 4
  context_overlap: number
  freenoise: true
  fuse_method: 'pyramid'
}

const CTX_LAT = 21
const MAX_N = 10
const MIN_OV_LAT = 4

export function computeWanContextOptions(numFrames: number): WanContextOptions | null {
  const nLat = (numFrames - 1) / 4 + 1
  if (nLat <= CTX_LAT) return null

  const build = (ovLat: number): WanContextOptions => ({
    context_schedule: 'static_standard',
    context_frames: 81,
    context_stride: 4,
    context_overlap: ovLat * 4,
    freenoise: true,
    fuse_method: 'pyramid',
  })

  for (let n = 2; n <= MAX_N; n++) {
    const ovLat = (n * CTX_LAT - nLat) / (n - 1)
    if (Number.isInteger(ovLat) && ovLat >= MIN_OV_LAT && ovLat < CTX_LAT) {
      return build(ovLat)
    }
  }
  for (let n = 2; n <= MAX_N; n++) {
    const ovLatRaw = (n * CTX_LAT - nLat) / (n - 1)
    if (ovLatRaw >= MIN_OV_LAT && ovLatRaw < CTX_LAT) {
      return build(Math.ceil(ovLatRaw))
    }
  }
  throw new Error(`num_frames ${numFrames} too large for single-pass windowing`)
}
