import { vi } from 'vitest'
import { removeLoraPlaceholder } from '@/lib/comfyui/workflows/wan/lora-manager'

vi.mock('@/lib/database/lora-bundles', () => ({
  LoRABundleService: {
    resolveMultipleLoRAs: vi.fn()
  }
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })
}))

describe('removeLoraPlaceholder', () => {
  it('removes nodes 65/66 and restores original wiring', () => {
    const workflow: Record<string, any> = {
      '13': { inputs: { clip_name: 'test' }, class_type: 'CLIPLoader' },
      '19': { inputs: { model: ['66', 0] }, class_type: 'WanVideoNAG' },
      '20': { inputs: { model: ['65', 0] }, class_type: 'WanVideoNAG' },
      '6': { inputs: {}, class_type: 'PathchSageAttentionKJ' },
      '12': { inputs: {}, class_type: 'PathchSageAttentionKJ' },
      '23': { inputs: { clip: ['65', 1] }, class_type: 'CLIPTextEncode' },
      '24': { inputs: { clip: ['65', 1] }, class_type: 'CLIPTextEncode' },
      '27': { inputs: { clip: ['66', 1] }, class_type: 'CLIPTextEncode' },
      '28': { inputs: { clip: ['66', 1] }, class_type: 'CLIPTextEncode' },
      '65': {
        inputs: {
          PowerLoraLoaderHeaderWidget: { type: 'PowerLoraLoaderHeaderWidget' },
          lora_1: { on: true, lora: 'PLACEHOLDER', strength: 1 },
          '➕ Add Lora': '',
          model: ['6', 0],
          clip: ['13', 0]
        },
        class_type: 'Power Lora Loader (rgthree)'
      },
      '66': {
        inputs: {
          PowerLoraLoaderHeaderWidget: { type: 'PowerLoraLoaderHeaderWidget' },
          lora_1: { on: true, lora: 'PLACEHOLDER', strength: 1 },
          '➕ Add Lora': '',
          model: ['12', 0],
          clip: ['13', 0]
        },
        class_type: 'Power Lora Loader (rgthree)'
      }
    }

    removeLoraPlaceholder(workflow)

    expect(workflow['65']).toBeUndefined()
    expect(workflow['66']).toBeUndefined()
    expect(workflow['20'].inputs.model).toEqual(['6', 0])
    expect(workflow['19'].inputs.model).toEqual(['12', 0])
    expect(workflow['23'].inputs.clip).toEqual(['13', 0])
    expect(workflow['24'].inputs.clip).toEqual(['13', 0])
    expect(workflow['27'].inputs.clip).toEqual(['13', 0])
    expect(workflow['28'].inputs.clip).toEqual(['13', 0])
  })
})

describe('applyLoraPreset', () => {
  it('applies HIGH loras to node 65 and LOW loras to node 66', async () => {
    const { applyLoraPreset } = await import('@/lib/comfyui/workflows/wan/lora-manager')

    const workflow: Record<string, any> = {
      '65': {
        inputs: {
          PowerLoraLoaderHeaderWidget: { type: 'PowerLoraLoaderHeaderWidget' },
          lora_1: { on: true, lora: 'PLACEHOLDER', strength: 1 },
          '➕ Add Lora': '',
          model: ['6', 0],
          clip: ['13', 0]
        },
        class_type: 'Power Lora Loader (rgthree)'
      },
      '66': {
        inputs: {
          PowerLoraLoaderHeaderWidget: { type: 'PowerLoraLoaderHeaderWidget' },
          lora_1: { on: true, lora: 'PLACEHOLDER', strength: 1 },
          '➕ Add Lora': '',
          model: ['12', 0],
          clip: ['13', 0]
        },
        class_type: 'Power Lora Loader (rgthree)'
      }
    }

    const loraPreset = {
      presetName: 'Test Preset',
      loraItems: [
        { loraFilename: 'WAN\\High\\style1.safetensors', loraName: 'Style 1', strength: 0.8, group: 'HIGH' as const, order: 0 },
        { loraFilename: 'WAN\\High\\style2.safetensors', loraName: 'Style 2', strength: 0.6, group: 'HIGH' as const, order: 1 },
        { loraFilename: 'WAN\\Low\\style1_low.safetensors', loraName: 'Style 1 Low', strength: 0.7, group: 'LOW' as const, order: 0 },
      ]
    }

    await applyLoraPreset(workflow, loraPreset)

    expect(workflow['65'].inputs.lora_1).toEqual({
      on: true,
      lora: 'WAN\\High\\style1.safetensors',
      strength: 0.8
    })
    expect(workflow['65'].inputs.lora_2).toEqual({
      on: true,
      lora: 'WAN\\High\\style2.safetensors',
      strength: 0.6
    })
    expect(workflow['66'].inputs.lora_1).toEqual({
      on: true,
      lora: 'WAN\\Low\\style1_low.safetensors',
      strength: 0.7
    })
  })
})
