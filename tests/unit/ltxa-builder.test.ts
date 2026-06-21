import { buildLtxaWorkflow as rawBuilder } from '@/lib/comfyui/workflows/ltxa/builder'
import { prisma } from '@/lib/database/prisma'
import { assertNoPlaceholders } from '../helpers/workflow-assertions'
import { cleanTables } from '../helpers/db'
import type { ComfyUIWorkflow } from '@/types'
import { LTXA } from '@/lib/comfyui/workflows/ltxa/nodes'

const END_IMAGE = {
  LOAD_IMAGE: '260',
  FRAME_INDEX: '261',
  RESIZE: '264',
} as const

const DYNAMIC_LORA = {
  FIRST: '7000',
  SECOND: '7001',
} as const

const TWO_PASS = {
  TEXT_ATTENTION: '534',
  LATENT_UPSCALE_MODEL: '536',
  FORCE_AFTER_SECOND_PASS: '538',
  FINAL_SEPARATE_AV: '539',
  LATENT_UPSAMPLER: '540',
  SECOND_PASS_CONCAT_AV: '543',
  MULTIMODAL_CFG: '555',
  SECOND_PASS_IMG_TO_VIDEO: '572',
  SECOND_PASS_IMAGE_SCALE: '575',
  SECOND_PASS_CFG_GUIDER: '580',
  SECOND_PASS_SIGMAS: '582',
  SECOND_PASS_SAMPLER: '583',
  FINAL_AUDIO_DECODE: '587',
  SECOND_PASS_ANCHOR: '593',
  SECOND_PASS_ADD_GUIDE: '607',
  SECOND_PASS_CROP_GUIDES: '608',
  SECOND_PASS_REFERENCE_CROP: '708',
  FIRST_PASS_GUIDER_UNLOAD: '641',
  SECOND_PASS_GUIDER_UNLOAD: '642',
} as const

const REFRESH = {
  SAMPLER_SELECT: '654',
  FIRST_PASS_PREPROCESS: '660',
  SECOND_PASS_PREPROCESS: '661',
} as const

const SOURCE_PATCH = {
  AUDIO_VAE: '611',
  SCHEDULER: '682',
  MODEL_SAGE_PATCH: '658',
  MEMORY_SAGE_PATCH: '672',
  TORCH_SETTINGS: '674',
  CHUNK_EXPRESSION: '675',
  CHUNK_FEED_FORWARD: '676',
  ATTENTION_TUNER: '677',
} as const

const DISTILLED_LORA = {
  FIRST_PASS: '680',
  SECOND_PASS: '681',
  SECOND_PASS_REFERENCE_AUDIO: '684',
} as const

const SOURCE_STATIC = {
  FIRST_STATIC_LORA: '606',
  SECOND_STATIC_LORA: '634',
  THIRD_STATIC_LORA: '646',
} as const

const REMOVED = {
  CLOWN_SAMPLER: '463',
} as const

let lastWorkflow: ComfyUIWorkflow | null = null
const buildLtxaWorkflow = async (...args: Parameters<typeof rawBuilder>) => {
  const wf = await rawBuilder(...args)
  lastWorkflow = wf
  return wf
}

async function updateSettings(settings: Record<string, string>) {
  await prisma.$transaction(
    Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.update({
        where: { key },
        data: { value },
      })
    )
  )
}

beforeEach(async () => {
  await cleanTables()
})

afterEach(() => {
  if (lastWorkflow) assertNoPlaceholders(lastWorkflow)
  lastWorkflow = null
})

describe('buildLtxaWorkflow', () => {
  it('builds base workflow with prompt, input image, models, duration, and conditioning prompts', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'fake requested scene',
      inputImage: 'fake-start.png',
      videoDuration: 8,
    })

    expect(wf[LTXA.POSITIVE_PROMPT]!.inputs!.text).toBe('fake requested scene')
    expect(wf[LTXA.NEGATIVE_PROMPT]!.inputs!.text).toBe('fake negative prompt z8r')
    expect(wf[LTXA.VIDEO_CONDITIONING_PROMPT]!.inputs!.text).toBe('fake video conditioning prompt h2k')
    expect(wf[LTXA.AUDIO_CONDITIONING_PROMPT]!.inputs!.text).toBe('fake audio conditioning prompt m9t')
    expect(wf[LTXA.DURATION]!.inputs!.value).toBe(8)
    expect(wf[LTXA.FRAME_BASE]!.inputs!.value).toBe(10)
    expect(wf[LTXA.FRAME_RATE]!.inputs!.number).toBe(18)
    expect(wf[LTXA.FRAME_RATE]!.inputs!.number_type).toBe('integer')
    expect(wf[LTXA.FRAME_RATE]!.inputs!.value).toBeUndefined()
    expect(wf[LTXA.VIDEO_COMBINE]!.inputs!.save_output).toBe(false)
    expect(wf[LTXA.RTX_SUPER_RES]!.inputs).toMatchObject({
      resize_type: 'fake-rtx-resize-type',
      'resize_type.scale': 1.5,
      quality: 'fake-rtx-quality',
      images: [LTXA.VAE_DECODE, 0],
    })
    expect(wf[LTXA.VIDEO_COMBINE]!.inputs!.images).toEqual([LTXA.RTX_SUPER_RES, 0])
    expect(wf[LTXA.LOAD_IMAGE_START]!.inputs!.image).toBe('fake-start.png')
    expect(wf[LTXA.CHECKPOINT]!.inputs!.ckpt_name).toBe('fake-ltxa-checkpoint-q7m.safetensors')
    expect(wf[SOURCE_PATCH.AUDIO_VAE]!.inputs!.ckpt_name).toBe(
      'fake-ltxa-audio-vae-b2m.safetensors'
    )
    expect(wf[LTXA.TEXT_ENCODER]!.inputs).toMatchObject({
      text_encoder: 'fake-ltxa-text-encoder-p4v.safetensors',
      ckpt_name: 'fake-ltxa-checkpoint-q7m.safetensors',
    })
    expect(wf[LTXA.RESIZE_START_IMAGE]!.inputs).toMatchObject({
      megapixels: 0.73,
      multiple_of: 24,
      upscale_method: 'fake-resize-method',
    })
    expect(wf[LTXA.LOAD_AUDIO]).toBeUndefined()
    expect(wf[LTXA.REFERENCE_AUDIO]).toBeUndefined()
  })

  it('uses the updated Constant Number input shape for frame rate', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXA.FRAME_RATE]!.inputs!.number).toBe(18)
    expect(wf[LTXA.FRAME_RATE]!.inputs!.number_type).toBe('integer')
    expect(wf[LTXA.FRAME_RATE]!.inputs!.value).toBeUndefined()
  })

  it('builds the refreshed LTXA model patch chain before the dynamic LoRA chain', async () => {
    await updateSettings({
      'ltxa.sage_attention': 'fake-sage-backend',
      'ltxa.sage_allow_compile': 'true',
      'ltxa.memory_sage_triton_kernels': 'false',
      'ltxa.torch_fp16_accumulation': 'true',
      'ltxa.chunk_feed_forward_dim_threshold': '37',
      'ltxa.attention_tuner_video_scale': '0.71',
      'ltxa.attention_tuner_video_to_audio_scale': '0.72',
      'ltxa.attention_tuner_audio_scale': '0.73',
      'ltxa.attention_tuner_audio_to_video_scale': '0.74',
      'ltxa.attention_tuner_blocks': 'fake-attention-blocks-1,3',
      'ltxa.attention_tuner_triton_kernels': 'false',
    })

    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[SOURCE_PATCH.MODEL_SAGE_PATCH]).toMatchObject({
      class_type: 'PathchSageAttentionKJ',
      inputs: {
        model: [LTXA.CHECKPOINT, 0],
        sage_attention: 'fake-sage-backend',
        allow_compile: true,
      },
    })
    expect(wf[SOURCE_PATCH.MEMORY_SAGE_PATCH]).toMatchObject({
      class_type: 'LTX2MemoryEfficientSageAttentionPatch',
      inputs: {
        model: [SOURCE_PATCH.MODEL_SAGE_PATCH, 0],
        triton_kernels: false,
      },
    })
    expect(wf[SOURCE_PATCH.TORCH_SETTINGS]).toMatchObject({
      class_type: 'ModelPatchTorchSettings',
      inputs: {
        model: [SOURCE_PATCH.MEMORY_SAGE_PATCH, 0],
        enable_fp16_accumulation: true,
      },
    })
    expect(wf[SOURCE_PATCH.CHUNK_EXPRESSION]).toMatchObject({
      class_type: 'ComfyMathExpression',
      inputs: {
        'values.a': [LTXA.FRAME_COUNT_MATH, 0],
        'values.b': [LTXA.RESIZE_START_IMAGE, 1],
        'values.c': [LTXA.RESIZE_START_IMAGE, 2],
      },
    })
    expect(wf[SOURCE_PATCH.CHUNK_FEED_FORWARD]).toMatchObject({
      class_type: 'LTXVChunkFeedForward',
      inputs: {
        model: [SOURCE_PATCH.TORCH_SETTINGS, 0],
        chunks: [SOURCE_PATCH.CHUNK_EXPRESSION, 1],
        dim_threshold: 37,
      },
    })
    expect(wf[SOURCE_PATCH.ATTENTION_TUNER]).toMatchObject({
      class_type: 'LTX2AttentionTunerPatch',
      inputs: {
        model: [SOURCE_PATCH.CHUNK_FEED_FORWARD, 0],
        video_scale: 0.71,
        video_to_audio_scale: 0.72,
        audio_scale: 0.73,
        audio_to_video_scale: 0.74,
        blocks: 'fake-attention-blocks-1,3',
        triton_kernels: false,
      },
    })
    expect(wf[LTXA.NAG]!.inputs!.model).toEqual([SOURCE_PATCH.ATTENTION_TUNER, 0])
    expect(wf[DYNAMIC_LORA.FIRST]!.inputs!.model).toEqual([LTXA.NAG, 0])
    expect(wf['481']).toBeUndefined()
    expect(wf['595']).toBeUndefined()
  })

  it('uses the refreshed scheduler, audio VAE, and frame rate node shapes', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[SOURCE_PATCH.SCHEDULER]).toMatchObject({
      class_type: 'LTXVScheduler',
      inputs: {
        steps: 13,
        max_shift: 1.37,
        base_shift: 0.41,
        stretch: false,
        terminal: 0.23,
        latent: [LTXA.CONCAT_AV, 0],
      },
    })
    expect(wf[LTXA.SAMPLER_ADVANCED]!.inputs!.sigmas).toEqual([SOURCE_PATCH.SCHEDULER, 0])
    expect(wf[LTXA.FRAME_RATE]!.inputs).toMatchObject({
      number: 18,
      number_type: 'integer',
    })
    expect(wf[LTXA.FRAME_RATE]!.inputs!.value).toBeUndefined()
    expect(wf[SOURCE_PATCH.AUDIO_VAE]).toMatchObject({
      class_type: 'LTXVAudioVAELoader',
      inputs: {
        ckpt_name: 'fake-ltxa-audio-vae-b2m.safetensors',
      },
    })
    expect(wf[LTXA.EMPTY_LATENT_AUDIO]!.inputs!.audio_vae).toEqual([SOURCE_PATCH.AUDIO_VAE, 0])
    expect(wf[LTXA.FINAL_AUDIO_DECODE]!.inputs!.audio_vae).toEqual([SOURCE_PATCH.AUDIO_VAE, 0])
  })

  it('builds the LTXA two-pass topology and removes replaced single-pass nodes', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    for (const id of Object.values(TWO_PASS).filter((id) => id !== TWO_PASS.SECOND_PASS_ANCHOR)) {
      expect(wf[id]).toBeDefined()
    }

    expect(wf['526']).toBeUndefined()
    expect(wf['321']).toBeUndefined()
    expect(wf['488']).toBeUndefined()

    expect(wf[TWO_PASS.FIRST_PASS_GUIDER_UNLOAD]).toMatchObject({
      class_type: 'ForceFullUnload',
      inputs: { passthrough: [TWO_PASS.MULTIMODAL_CFG, 0] },
    })
    expect(wf[LTXA.SAMPLER_ADVANCED]!.inputs!.guider).toEqual([TWO_PASS.FIRST_PASS_GUIDER_UNLOAD, 0])
    expect(wf[TWO_PASS.SECOND_PASS_GUIDER_UNLOAD]).toMatchObject({
      class_type: 'ForceFullUnload',
      inputs: { passthrough: [TWO_PASS.SECOND_PASS_CFG_GUIDER, 0] },
    })
    expect(wf[TWO_PASS.SECOND_PASS_SAMPLER]!.inputs).toMatchObject({
      guider: [TWO_PASS.SECOND_PASS_GUIDER_UNLOAD, 0],
      sigmas: [TWO_PASS.SECOND_PASS_SIGMAS, 0],
      latent_image: [TWO_PASS.SECOND_PASS_CONCAT_AV, 0],
    })
    expect(wf[TWO_PASS.SECOND_PASS_CONCAT_AV]!.inputs!.video_latent).toEqual([
      TWO_PASS.SECOND_PASS_ADD_GUIDE,
      2,
    ])
    expect(wf[TWO_PASS.MULTIMODAL_CFG]!.inputs!.model).toEqual([LTXA.ANCHOR, 0])
    expect(wf[TWO_PASS.SECOND_PASS_CFG_GUIDER]!.inputs).toMatchObject({
      model: [TWO_PASS.TEXT_ATTENTION, 0],
      positive: [TWO_PASS.SECOND_PASS_REFERENCE_CROP, 0],
      negative: [TWO_PASS.SECOND_PASS_REFERENCE_CROP, 1],
    })
    expect(wf[TWO_PASS.SECOND_PASS_REFERENCE_CROP]!.inputs).toMatchObject({
      positive: [LTXA.CROP_GUIDES, 0],
      negative: [LTXA.CROP_GUIDES, 1],
      latent: [TWO_PASS.FINAL_SEPARATE_AV, 0],
    })
    expect(wf[TWO_PASS.SECOND_PASS_ANCHOR]).toBeUndefined()
    expect(wf[TWO_PASS.SECOND_PASS_CROP_GUIDES]!.inputs).toMatchObject({
      positive: [TWO_PASS.SECOND_PASS_ADD_GUIDE, 0],
      negative: [TWO_PASS.SECOND_PASS_ADD_GUIDE, 1],
      latent: [TWO_PASS.FINAL_SEPARATE_AV, 0],
    })
    expect(wf[LTXA.VAE_DECODE]!.inputs!.samples).toEqual([TWO_PASS.SECOND_PASS_CROP_GUIDES, 2])
    expect(wf[LTXA.VIDEO_COMBINE]!.inputs!.images).toEqual([LTXA.RTX_SUPER_RES, 0])
    expect(wf[LTXA.VIDEO_COMBINE]!.inputs!.audio).toEqual([TWO_PASS.FINAL_AUDIO_DECODE, 0])
  })

  it('allows empty LTXA anchor block index filters', async () => {
    await updateSettings({
      'ltxa.anchor_block_index_filter': '',
    })

    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXA.ANCHOR]!.inputs!.block_index_filter).toBe('')
    expect(wf[TWO_PASS.SECOND_PASS_ANCHOR]).toBeUndefined()
  })

  it('allows an empty LTXA attention tuner blocks filter', async () => {
    await updateSettings({
      'ltxa.attention_tuner_blocks': '',
    })

    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[SOURCE_PATCH.ATTENTION_TUNER]!.inputs!.blocks).toBe('')
  })

  it('injects admin-configured model patch settings', async () => {
    await updateSettings({
      'ltxa.sage_attention': 'fake-sage-backend',
      'ltxa.sage_allow_compile': 'true',
      'ltxa.memory_sage_triton_kernels': 'false',
      'ltxa.torch_fp16_accumulation': 'true',
      'ltxa.chunk_feed_forward_dim_threshold': '37',
      'ltxa.attention_tuner_video_scale': '0.71',
      'ltxa.attention_tuner_video_to_audio_scale': '0.72',
      'ltxa.attention_tuner_audio_scale': '0.73',
      'ltxa.attention_tuner_audio_to_video_scale': '0.74',
      'ltxa.attention_tuner_blocks': 'fake-attention-blocks-1,3',
      'ltxa.attention_tuner_triton_kernels': 'false',
    })

    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[SOURCE_PATCH.MODEL_SAGE_PATCH]!.inputs).toMatchObject({
      sage_attention: 'fake-sage-backend',
      allow_compile: true,
    })
    expect(wf[SOURCE_PATCH.MEMORY_SAGE_PATCH]!.inputs).toMatchObject({
      triton_kernels: false,
    })
    expect(wf[SOURCE_PATCH.TORCH_SETTINGS]!.inputs).toMatchObject({
      enable_fp16_accumulation: true,
    })
    expect(wf[SOURCE_PATCH.CHUNK_FEED_FORWARD]!.inputs).toMatchObject({
      dim_threshold: 37,
    })
    expect(wf[SOURCE_PATCH.ATTENTION_TUNER]!.inputs).toMatchObject({
      video_scale: 0.71,
      video_to_audio_scale: 0.72,
      audio_scale: 0.73,
      audio_to_video_scale: 0.74,
      blocks: 'fake-attention-blocks-1,3',
      triton_kernels: false,
    })
  })

  it('uses the refreshed shared sampler topology', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[REMOVED.CLOWN_SAMPLER]).toBeUndefined()
    expect(wf[REFRESH.SAMPLER_SELECT]).toMatchObject({
      class_type: 'KSamplerSelect',
      inputs: { sampler_name: 'fake-sampler-r6d' },
    })
    expect(wf[LTXA.SAMPLER_ADVANCED]!.inputs!.sampler).toEqual([REFRESH.SAMPLER_SELECT, 0])
    expect(wf[TWO_PASS.SECOND_PASS_SAMPLER]!.inputs!.sampler).toEqual([
      REFRESH.SAMPLER_SELECT,
      0,
    ])
  })

  it('uses refreshed preprocess nodes before first and second pass guides', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[REFRESH.FIRST_PASS_PREPROCESS]).toMatchObject({
      class_type: 'LTXVPreprocess',
      inputs: {
        img_compression: 19,
        image: [LTXA.RESIZE_START_IMAGE, 0],
      },
    })
    expect(wf[LTXA.ADD_GUIDE]!.inputs!.image).toEqual([REFRESH.FIRST_PASS_PREPROCESS, 0])
    expect(wf[REFRESH.SECOND_PASS_PREPROCESS]).toMatchObject({
      class_type: 'LTXVPreprocess',
      inputs: {
        img_compression: 19,
        image: [TWO_PASS.SECOND_PASS_IMAGE_SCALE, 0],
      },
    })
    expect(wf[TWO_PASS.SECOND_PASS_ADD_GUIDE]!.inputs!.image).toEqual([
      REFRESH.SECOND_PASS_PREPROCESS,
      0,
    ])
  })

  it('injects scheduler, NAG, guide, anchor, and two-pass settings', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[SOURCE_PATCH.SCHEDULER]!.inputs).toMatchObject({
      steps: 13,
      max_shift: 1.37,
      base_shift: 0.41,
      stretch: false,
      terminal: 0.23,
    })
    expect(wf[LTXA.NAG]!.inputs).toMatchObject({
      nag_scale: 3.4,
      nag_alpha: 0.19,
      nag_tau: 1.61,
    })
    expect(wf[LTXA.ADD_GUIDE]!.inputs).toMatchObject({
      frame_idx: 3,
      strength: 0.46,
      crf: 27,
      blur_radius: 5,
      interpolation: 'fake-guide-interpolation',
      crop: 'fake-guide-crop',
    })
    expect(wf[TWO_PASS.SECOND_PASS_ADD_GUIDE]!.inputs).toMatchObject({
      frame_idx: 3,
      strength: 0.46,
      crf: 27,
      blur_radius: 5,
      interpolation: 'fake-guide-interpolation',
      crop: 'fake-guide-crop',
    })
    expect(wf[LTXA.ANCHOR]!.inputs).toMatchObject({
      strength: 0.31,
      cache_at_step: 4,
      similarity_threshold: 0.62,
      decay_with_distance: 0.27,
      energy_threshold: 0.18,
      bypass: true,
      debug: false,
      advanced_mode: true,
      cache_mode: 'fake-anchor-cache-mode',
      forwards_per_step: 2,
      cache_warmup: 6,
      anchor_frame: 1,
      depth_curve: 'fake-anchor-depth-curve',
      block_index_filter: 'fake-block-filter-2,4,6',
    })
    expect(wf[TWO_PASS.TEXT_ATTENTION]!.inputs).toMatchObject({
      text_amplification: 1.37,
    })
    expect(wf[TWO_PASS.LATENT_UPSCALE_MODEL]!.inputs).toMatchObject({
      model_name: 'fake-ltxa-latent-upscaler-u8p.safetensors',
    })
    expect(wf[TWO_PASS.MULTIMODAL_CFG]!.inputs).toMatchObject({
      video_cfg: 2.41,
      audio_cfg: 4.73,
      inactive_cfg: 0.83,
      active_steps: 3,
    })
    expect(wf[TWO_PASS.SECOND_PASS_CFG_GUIDER]!.inputs).toMatchObject({
      cfg: 1.29,
    })
    expect(wf[TWO_PASS.SECOND_PASS_SIGMAS]!.inputs).toMatchObject({
      sigmas: 'fake-second-pass-sigmas-q5m',
    })
    expect(wf[TWO_PASS.SECOND_PASS_IMAGE_SCALE]!.inputs).toMatchObject({
      upscale_method: 'fake-second-pass-upscale-method',
      scale_by: 1.75,
    })
  })

  it('injects the enabled SFW LoRA chain by default', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[DYNAMIC_LORA.FIRST]).toMatchObject({
      class_type: 'LTX2LoraLoaderAdvanced',
      inputs: {
        lora_name: 'fake-ltxa-sfw-chain-a.safetensors',
        strength_model: 0.51,
        video: 0.11,
        video_to_audio: 0.12,
        audio: 0.13,
        audio_to_video: 0.14,
        other: 0.15,
        model: [LTXA.NAG, 0],
      },
    })
    expect(wf[DYNAMIC_LORA.SECOND]).toMatchObject({
      class_type: 'LTX2LoraLoaderAdvanced',
      inputs: {
        lora_name: 'fake-ltxa-sfw-chain-c.safetensors',
        strength_model: 0.73,
        video: 0.31,
        video_to_audio: 0.32,
        audio: 0.33,
        audio_to_video: 0.34,
        other: 0.35,
        model: [DYNAMIC_LORA.FIRST, 0],
      },
    })
    expect(wf[LTXA.NAG]!.class_type).toBe('CubicJLTX2ExplicitNAG')
    expect(wf[LTXA.NAG]!.inputs!.model).toEqual([SOURCE_PATCH.ATTENTION_TUNER, 0])
  })

  it('does not copy source static dynamic LoRA helper nodes', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    for (const id of Object.values(SOURCE_STATIC)) {
      expect(wf[id]).toBeUndefined()
    }
    expect(wf[DYNAMIC_LORA.FIRST]).toBeDefined()
    expect(wf[DYNAMIC_LORA.SECOND]).toBeDefined()
  })

  it('places dynamic and distilled LoRAs in the pass-specific model chains', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXA.NAG]!.inputs!.model).toEqual([SOURCE_PATCH.ATTENTION_TUNER, 0])
    expect(wf[DYNAMIC_LORA.FIRST]!.inputs!.model).toEqual([LTXA.NAG, 0])
    expect(wf[DYNAMIC_LORA.SECOND]!.inputs!.model).toEqual([DYNAMIC_LORA.FIRST, 0])
    expect(wf[DISTILLED_LORA.FIRST_PASS]).toMatchObject({
      class_type: 'LTX2LoraLoaderAdvanced',
      inputs: {
        lora_name: 'fake-ltxa-first-pass-distilled.safetensors',
        strength_model: 0.82,
        model: [DYNAMIC_LORA.SECOND, 0],
      },
    })
    expect(wf[LTXA.ANCHOR]!.inputs!.model).toEqual([DISTILLED_LORA.FIRST_PASS, 0])
    expect(wf[DISTILLED_LORA.SECOND_PASS]).toMatchObject({
      class_type: 'LTX2LoraLoaderAdvanced',
      inputs: {
        lora_name: 'fake-ltxa-second-pass-distilled.safetensors',
        strength_model: 0.42,
        model: [DYNAMIC_LORA.SECOND, 0],
      },
    })
    expect(wf[TWO_PASS.TEXT_ATTENTION]!.inputs!.model).toEqual([DISTILLED_LORA.SECOND_PASS, 0])
    expect(wf[TWO_PASS.SECOND_PASS_CFG_GUIDER]!.inputs!.model).toEqual([
      TWO_PASS.TEXT_ATTENTION,
      0,
    ])
  })

  it('injects the enabled NSFW LoRA chain when content is NSFW', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      isNSFW: true,
    })

    expect(wf[DYNAMIC_LORA.FIRST]).toMatchObject({
      class_type: 'LTX2LoraLoaderAdvanced',
      inputs: {
        lora_name: 'fake-ltxa-nsfw-chain-a.safetensors',
        strength_model: 0.56,
        model: [LTXA.NAG, 0],
      },
    })
    expect(wf[DYNAMIC_LORA.SECOND]).toMatchObject({
      class_type: 'LTX2LoraLoaderAdvanced',
      inputs: {
        lora_name: 'fake-ltxa-nsfw-chain-b.safetensors',
        strength_model: 0.67,
        model: [DYNAMIC_LORA.FIRST, 0],
      },
    })
    expect(wf[LTXA.NAG]!.inputs!.model).toEqual([SOURCE_PATCH.ATTENTION_TUNER, 0])
  })

  it('bypasses the LoRA chain when it is empty', async () => {
    await updateSettings({ 'ltxa.sfw_lora_chain': '[]' })
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[DYNAMIC_LORA.FIRST]).toBeUndefined()
    expect(wf[DYNAMIC_LORA.SECOND]).toBeUndefined()
    expect(wf[LTXA.NAG]!.class_type).toBe('CubicJLTX2ExplicitNAG')
    expect(wf[LTXA.NAG]!.inputs!.model).toEqual([SOURCE_PATCH.ATTENTION_TUNER, 0])
    expect(wf[DISTILLED_LORA.FIRST_PASS]!.inputs!.model).toEqual([LTXA.NAG, 0])
    expect(wf[DISTILLED_LORA.SECOND_PASS]!.inputs!.model).toEqual([LTXA.NAG, 0])
  })

  it('applies ID LoRA after dynamic LoRA and before pass-specific reference audio', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      referenceAudio: 'fake-reference.wav',
      videoDuration: 4,
    })

    expect(wf[LTXA.NAG]).toMatchObject({
      class_type: 'CubicJLTX2ExplicitNAG',
      inputs: {
        nag_scale: 3.4,
        nag_alpha: 0.19,
        nag_tau: 1.61,
        nag_cond_video: [LTXA.VIDEO_CONDITIONING_PROMPT, 0],
        nag_cond_audio: [LTXA.AUDIO_CONDITIONING_PROMPT, 0],
      },
    })
    expect(wf[LTXA.ID_LORA]!.inputs!.model).toEqual([DYNAMIC_LORA.SECOND, 0])
    expect(wf[LTXA.REFERENCE_AUDIO]!.inputs!.model).toEqual([LTXA.ID_LORA, 0])
    expect(wf[DISTILLED_LORA.FIRST_PASS]!.inputs!.model).toEqual([LTXA.REFERENCE_AUDIO, 0])
    expect(wf[LTXA.ANCHOR]!.inputs!.model).toEqual([DISTILLED_LORA.FIRST_PASS, 0])
    expect(wf[DISTILLED_LORA.SECOND_PASS_REFERENCE_AUDIO]).toMatchObject({
      class_type: 'LTXVReferenceAudio',
      inputs: {
        model: [LTXA.ID_LORA, 0],
        positive: [LTXA.CROP_GUIDES, 0],
        negative: [LTXA.CROP_GUIDES, 1],
        reference_audio: [LTXA.LOAD_AUDIO, 0],
        audio_vae: [SOURCE_PATCH.AUDIO_VAE, 0],
      },
    })
    expect(wf[DISTILLED_LORA.SECOND_PASS]!.inputs!.model).toEqual([
      DISTILLED_LORA.SECOND_PASS_REFERENCE_AUDIO,
      0,
    ])
    expect(wf[TWO_PASS.TEXT_ATTENTION]!.inputs!.model).toEqual([DISTILLED_LORA.SECOND_PASS, 0])
    expect(wf[TWO_PASS.SECOND_PASS_CFG_GUIDER]!.inputs).toMatchObject({
      model: [TWO_PASS.TEXT_ATTENTION, 0],
      positive: [TWO_PASS.SECOND_PASS_REFERENCE_CROP, 0],
      negative: [TWO_PASS.SECOND_PASS_REFERENCE_CROP, 1],
    })
    expect(wf[TWO_PASS.SECOND_PASS_REFERENCE_CROP]!.inputs).toMatchObject({
      positive: [DISTILLED_LORA.SECOND_PASS_REFERENCE_AUDIO, 1],
      negative: [DISTILLED_LORA.SECOND_PASS_REFERENCE_AUDIO, 2],
      latent: [TWO_PASS.FINAL_SEPARATE_AV, 0],
    })
  })

  it('removes RTX upscale when disabled', async () => {
    await updateSettings({
      'ltxa.rtx_enabled': 'false',
    })

    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXA.RTX_SUPER_RES]).toBeUndefined()
    expect(wf[LTXA.VIDEO_COMBINE]!.inputs!.images).toEqual([LTXA.VAE_DECODE, 0])
  })

  it('injects end image nodes when endImage provided', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      endImage: 'fake-end.png',
    })

    expect(wf[END_IMAGE.LOAD_IMAGE]).toMatchObject({
      inputs: { image: 'fake-end.png' },
      class_type: 'LoadImage',
    })
    expect(wf[END_IMAGE.FRAME_INDEX]!.inputs).toMatchObject({
      expression: 'a - 1',
      a: [LTXA.FRAME_COUNT_MATH, 0],
    })
    expect(wf[END_IMAGE.RESIZE]!.inputs).toMatchObject({
      megapixels: 0.73,
      multiple_of: 24,
      upscale_method: 'fake-resize-method',
      image: [END_IMAGE.LOAD_IMAGE, 0],
    })
    expect(wf[LTXA.IMG_TO_VIDEO]!.inputs!['num_images']).toBe('2')
    expect(wf[LTXA.IMG_TO_VIDEO]!.inputs!['num_images.image_2']).toEqual([END_IMAGE.RESIZE, 0])
    expect(wf[LTXA.IMG_TO_VIDEO]!.inputs!['num_images.index_2']).toEqual([END_IMAGE.FRAME_INDEX, 0])
    expect(wf[LTXA.IMG_TO_VIDEO]!.inputs!['num_images.strength_2']).toBe(1)
    expect(wf[TWO_PASS.SECOND_PASS_IMG_TO_VIDEO]!.inputs!['num_images']).toBe('2')
    expect(wf[TWO_PASS.SECOND_PASS_IMG_TO_VIDEO]!.inputs!['num_images.image_2']).toEqual([END_IMAGE.RESIZE, 0])
    expect(wf[TWO_PASS.SECOND_PASS_IMG_TO_VIDEO]!.inputs!['num_images.index_2']).toEqual([END_IMAGE.FRAME_INDEX, 0])
    expect(wf[TWO_PASS.SECOND_PASS_IMG_TO_VIDEO]!.inputs!['num_images.strength_2']).toBe(1)
  })

  it('removes end image nodes when endImage absent', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[END_IMAGE.LOAD_IMAGE]).toBeUndefined()
    expect(wf[END_IMAGE.FRAME_INDEX]).toBeUndefined()
    expect(wf[END_IMAGE.RESIZE]).toBeUndefined()
    expect(wf[LTXA.IMG_TO_VIDEO]!.inputs!['num_images']).toBe('1')
    expect(wf[LTXA.IMG_TO_VIDEO]!.inputs!['num_images.image_2']).toBeUndefined()
    expect(wf[LTXA.IMG_TO_VIDEO]!.inputs!['num_images.index_2']).toBeUndefined()
    expect(wf[LTXA.IMG_TO_VIDEO]!.inputs!['num_images.strength_2']).toBeUndefined()
    expect(wf[TWO_PASS.SECOND_PASS_IMG_TO_VIDEO]!.inputs!['num_images']).toBe('1')
    expect(wf[TWO_PASS.SECOND_PASS_IMG_TO_VIDEO]!.inputs!['num_images.image_2']).toBeUndefined()
    expect(wf[TWO_PASS.SECOND_PASS_IMG_TO_VIDEO]!.inputs!['num_images.index_2']).toBeUndefined()
    expect(wf[TWO_PASS.SECOND_PASS_IMG_TO_VIDEO]!.inputs!['num_images.strength_2']).toBeUndefined()
  })

  it('injects output settings', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXA.VIDEO_COMBINE]!.inputs).toMatchObject({
      frame_rate: [LTXA.FRAME_RATE, 1],
      crf: 29,
      format: 'fake-video-format',
      pix_fmt: 'fake-pix-fmt',
      filename_prefix: 'LTXA/fake-start',
    })
  })
})
