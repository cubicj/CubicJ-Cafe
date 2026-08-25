import { summarizeWorkflowJson } from '@/lib/comfyui/workflows/workflow-summary'

describe('summarizeWorkflowJson', () => {
  it('extracts supported generation settings with stable deduplication', () => {
    const workflow = {
      '10': {
        class_type: 'FakeSampler',
        inputs: {
          steps: 17,
          megapixels: 1.25,
          sampler_name: 'fake_sampler_a',
          scheduler: 'fake_scheduler_a',
          unet_name: 'fake_unet_a.safetensors',
          model_name: 'fake_noise_model.safetensors',
          lora_name: 'fake_lora_a.safetensors',
        },
      },
      '20': {
        class_type: 'FakeLinkedSampler',
        inputs: {
          steps: 17,
          megapixels: 0,
          sampler_name: 'fake_sampler_a',
          scheduler: ['10', 0],
          ckpt_name: 'fake_checkpoint_b.safetensors',
          model: ['10', 0],
          lora_name: 'PLACEHOLDER',
        },
      },
      '30': {
        class_type: 'FakeWanVideoModelLoader',
        inputs: {
          steps: 29,
          megapixels: 2,
          sampler_name: 'fake_sampler_b',
          scheduler: 'fake_scheduler_b',
          model: 'fake_wan_model_c.safetensors',
          unet_name: 'PLACEHOLDER',
          lora_1: { lora: 'fake_power_lora_b.safetensors', on: true },
          lora_2: { lora: 'fake_disabled_lora.safetensors', on: false },
          lora_3: { lora: 'fake_power_lora_c.safetensors' },
          lora_4: { lora: 'PLACEHOLDER' },
        },
      },
      '40': {
        class_type: 'FakeDuplicateNode',
        inputs: {
          steps: Number.NaN,
          megapixels: Number.POSITIVE_INFINITY,
          sampler_name: 'PLACEHOLDER',
          scheduler: '',
          ckpt_name: 'fake_checkpoint_b.safetensors',
          lora_name: 'fake_lora_a.safetensors',
          lora_1: { lora: 'fake_power_lora_b.safetensors' },
        },
      },
    }

    expect(summarizeWorkflowJson(JSON.stringify(workflow))).toEqual({
      steps: [17, 29],
      megapixels: [1.25, 2],
      samplers: ['fake_sampler_a', 'fake_sampler_b'],
      schedulers: ['fake_scheduler_a', 'fake_scheduler_b'],
      models: [
        'fake_unet_a.safetensors',
        'fake_checkpoint_b.safetensors',
        'fake_wan_model_c.safetensors',
      ],
      loras: [
        'fake_lora_a.safetensors',
        'fake_power_lora_b.safetensors',
        'fake_power_lora_c.safetensors',
      ],
    })
  })

  it('returns null for invalid JSON and non-object JSON', () => {
    expect(summarizeWorkflowJson('{invalid')).toBeNull()
    expect(summarizeWorkflowJson('null')).toBeNull()
    expect(summarizeWorkflowJson('[]')).toBeNull()
  })

  it('resolves steps linked to a primitive value node', () => {
    const workflow = {
      '19': {
        class_type: 'PrimitiveInt',
        inputs: { value: 6 },
      },
      '27': {
        class_type: 'BasicScheduler',
        inputs: { scheduler: 'fake_scheduler', steps: ['19', 0], denoise: 1, model: ['9', 0] },
      },
      '28': {
        class_type: 'FakeScheduler',
        inputs: { steps: ['99', 0] },
      },
      '29': {
        class_type: 'FakeScheduler',
        inputs: { steps: ['30', 0] },
      },
      '30': {
        class_type: 'FakeStringPrimitive',
        inputs: { value: 'fake_text' },
      },
    }

    expect(summarizeWorkflowJson(JSON.stringify(workflow))).toEqual({
      steps: [6],
      megapixels: [],
      samplers: [],
      schedulers: ['fake_scheduler'],
      models: [],
      loras: [],
    })
  })

  it('extracts dotted megapixels inputs', () => {
    const workflow = {
      '50': {
        class_type: 'FakeLatentUpscaler',
        inputs: { 'mode.megapixels': 0.6 },
      },
    }

    expect(summarizeWorkflowJson(JSON.stringify(workflow))?.megapixels).toEqual([0.6])
  })
})
