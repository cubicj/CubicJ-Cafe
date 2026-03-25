import { applyLtxLoraChain } from '@/lib/comfyui/workflows/ltx/lora-manager'
import type { ComfyUIWorkflow } from '@/types'
import type { LoRAPresetData } from '@/types/lora'

function createBaseWorkflow(): ComfyUIWorkflow {
  return {
    '297': { inputs: { unet_name: 'test.safetensors', weight_dtype: 'default' }, class_type: 'UNETLoader' },
    '298': {
      inputs: { triton_kernels: true, model: ['297', 0] },
      class_type: 'LTX2MemoryEfficientSageAttentionPatch',
    },
    '296': {
      inputs: {
        lora_name: 'LTX\\Custom\\REDACTED_MODEL.safetensors',
        strength_model: 0,
        model: ['298', 0],
      },
      class_type: 'LoraLoaderModelOnly',
    },
    '317': {
      inputs: {
        audio_normalization_factors: '1,1,1',
        model: ['296', 0],
      },
      class_type: 'LTX2AudioLatentNormalizingSampling',
    },
  }
}

describe('applyLtxLoraChain', () => {
  it('does nothing when loraItems is empty', async () => {
    const workflow = createBaseWorkflow()
    const preset: LoRAPresetData = { presetId: '1', presetName: 'empty', loraItems: [] }

    await applyLtxLoraChain(workflow, preset)

    expect(workflow['296']).toBeDefined()
    expect(workflow['317']!.inputs!.model).toEqual(['296', 0])
    expect(workflow['400']).toBeUndefined()
  })

  it('removes placeholder(296) and chains LoRA from SageAttention(298)', async () => {
    const workflow = createBaseWorkflow()
    const preset: LoRAPresetData = {
      presetId: '1',
      presetName: 'test',
      loraItems: [{
        loraFilename: 'LTX\\Custom\\style-lora.safetensors',
        loraName: 'Style',
        strength: 0.7,
        group: 'HIGH',
        order: 0,
      }],
    }

    await applyLtxLoraChain(workflow, preset)

    expect(workflow['296']).toBeUndefined()
    expect(workflow['400']).toBeDefined()
    expect(workflow['400']!.class_type).toBe('LoraLoaderModelOnly')
    expect(workflow['400']!.inputs!.lora_name).toBe('LTX\\Custom\\style-lora.safetensors')
    expect(workflow['400']!.inputs!.strength_model).toBe(0.7)
    expect(workflow['400']!.inputs!.model).toEqual(['298', 0])
    expect(workflow['317']!.inputs!.model).toEqual(['400', 0])
  })

  it('chains multiple LoRAs in order', async () => {
    const workflow = createBaseWorkflow()
    const preset: LoRAPresetData = {
      presetId: '1',
      presetName: 'multi',
      loraItems: [
        { loraFilename: 'lora-a.safetensors', loraName: 'A', strength: 0.5, group: 'HIGH', order: 0 },
        { loraFilename: 'lora-b.safetensors', loraName: 'B', strength: 0.8, group: 'HIGH', order: 1 },
        { loraFilename: 'lora-c.safetensors', loraName: 'C', strength: 0.3, group: 'HIGH', order: 2 },
      ],
    }

    await applyLtxLoraChain(workflow, preset)

    expect(workflow['296']).toBeUndefined()
    expect(workflow['400']!.inputs!.model).toEqual(['298', 0])
    expect(workflow['401']!.inputs!.model).toEqual(['400', 0])
    expect(workflow['402']!.inputs!.model).toEqual(['401', 0])
    expect(workflow['317']!.inputs!.model).toEqual(['402', 0])
  })

  it('deduplicates by loraFilename', async () => {
    const workflow = createBaseWorkflow()
    const preset: LoRAPresetData = {
      presetId: '1',
      presetName: 'dupes',
      loraItems: [
        { loraFilename: 'same.safetensors', loraName: 'A', strength: 0.5, group: 'HIGH', order: 0 },
        { loraFilename: 'same.safetensors', loraName: 'A copy', strength: 0.8, group: 'HIGH', order: 1 },
        { loraFilename: 'other.safetensors', loraName: 'B', strength: 0.6, group: 'HIGH', order: 2 },
      ],
    }

    await applyLtxLoraChain(workflow, preset)

    expect(workflow['400']).toBeDefined()
    expect(workflow['401']).toBeDefined()
    expect(workflow['402']).toBeUndefined()
    expect(workflow['317']!.inputs!.model).toEqual(['401', 0])
  })

  it('converts backslashes for RUNPOD server', async () => {
    const workflow = createBaseWorkflow()
    const preset: LoRAPresetData = {
      presetId: '1',
      presetName: 'runpod',
      loraItems: [{
        loraFilename: 'LTX\\Custom\\style.safetensors',
        loraName: 'Style',
        strength: 0.7,
        group: 'HIGH',
        order: 0,
      }],
    }
    const server = { type: 'RUNPOD' } as any

    await applyLtxLoraChain(workflow, preset, server)

    expect(workflow['400']!.inputs!.lora_name).toBe('LTX/Custom/style.safetensors')
  })
})
