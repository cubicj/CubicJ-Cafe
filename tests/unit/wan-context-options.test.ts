import { computeWanContextOptions } from '@/lib/comfyui/workflows/wan/context-options'

describe('computeWanContextOptions', () => {
  it('returns null when nLat equals CTX_LAT (81 frames)', () => {
    expect(computeWanContextOptions(81)).toBeNull()
  })

  it('returns null when nLat is below CTX_LAT', () => {
    expect(computeWanContextOptions(41)).toBeNull()
  })

  it('returns fixed schedule + pyramid + freenoise for windowed case', () => {
    const result = computeWanContextOptions(97)
    expect(result).not.toBeNull()
    expect(result!.context_schedule).toBe('static_standard')
    expect(result!.context_frames).toBe(81)
    expect(result!.context_stride).toBe(4)
    expect(result!.freenoise).toBe(true)
    expect(result!.fuse_method).toBe('pyramid')
  })

  it('computes integer overlap for 97 frames (nLat=25, n=2 → ov_lat=17)', () => {
    const result = computeWanContextOptions(97)
    expect(result!.context_overlap).toBe(17 * 4)
  })

  it('computes integer overlap for 113 frames (nLat=29, n=2 → ov_lat=13)', () => {
    const result = computeWanContextOptions(113)
    expect(result!.context_overlap).toBe(13 * 4)
  })

  it('picks smallest n yielding integer overlap in valid range', () => {
    const result = computeWanContextOptions(145)
    expect(result!.context_overlap).toBe(5 * 4)
  })

  it('falls back to ceiling when no integer solution exists in valid range', () => {
    const result = computeWanContextOptions(157)
    expect(result!.context_overlap).toBe(12 * 4)
  })

  it('throws when num_frames exceeds single-pass windowing limit', () => {
    expect(() => computeWanContextOptions(1001)).toThrow(/too large/)
  })
})
