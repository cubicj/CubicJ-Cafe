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
    '354': {
      inputs: { enable_fp16_accumulation: true, model: ['298', 0] },
      class_type: 'ModelPatchTorchSettings',
    },
    '72': {
      inputs: {
        nag_scale: 5,
        nag_alpha: 0.3,
        nag_tau: 1.5,
        inplace: true,
        model: ['354', 0],
        nag_cond_video: ['23', 1],
        nag_cond_audio: ['23', 1],
      },
      class_type: 'LTX2_NAG',
    },
  }
}

describe('applyLtxLoraChain', () => {
  it('does nothing when loraItems is empty', async () => {
    const workflow = createBaseWorkflow()
    const preset: LoRAPresetData = { presetId: '1', presetName: 'empty', loraItems: [] }

    await applyLtxLoraChain(workflow, preset)

    expect(workflow['72']!.inputs!.model).toEqual(['354', 0])
    expect(workflow['400']).toBeUndefined()
  })

  it('chains LoRA from TorchSettings(354) and rewires NAG(72)', async () => {
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

    expect(workflow['400']).toBeDefined()
    expect(workflow['400']!.class_type).toBe('LoraLoaderModelOnly')
    expect(workflow['400']!.inputs!.lora_name).toBe('LTX\\Custom\\style-lora.safetensors')
    expect(workflow['400']!.inputs!.strength_model).toBe(0.7)
    expect(workflow['400']!.inputs!.model).toEqual(['354', 0])
    expect(workflow['72']!.inputs!.model).toEqual(['400', 0])
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

    expect(workflow['400']!.inputs!.model).toEqual(['354', 0])
    expect(workflow['401']!.inputs!.model).toEqual(['400', 0])
    expect(workflow['402']!.inputs!.model).toEqual(['401', 0])
    expect(workflow['72']!.inputs!.model).toEqual(['402', 0])
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
    expect(workflow['72']!.inputs!.model).toEqual(['401', 0])
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
