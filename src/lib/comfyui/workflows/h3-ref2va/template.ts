import type { ComfyUIWorkflow } from '@/types';

export const H3_REF2VA_WORKFLOW_TEMPLATE = {
  '1': {
    inputs: { shift_video: 0, shift_audio: 0, model: ['8', 0] },
    class_type: 'MiniMaxH3SigmaShift',
    _meta: { title: 'ModelSamplingMiniMaxH3' },
  },
  '4': {
    inputs: {
      prompt: ['18', 0],
      width: 0,
      height: 0,
      length: ['20', 0],
      ref_image_size: 'PLACEHOLDER',
      clip: ['17', 0],
      vae: ['16', 0],
      audio_vae: ['15', 0],
    },
    class_type: 'MiniMaxH3ReferenceToVideo',
    _meta: { title: 'MiniMax H3 Reference to Video' },
  },
  '7': {
    inputs: { unet_name: 'PLACEHOLDER', weight_dtype: 'PLACEHOLDER' },
    class_type: 'UNETLoader',
    _meta: { title: 'Load Diffusion Model' },
  },
  '8': {
    inputs: { lora_name: 'PLACEHOLDER', strength_model: 0, model: ['7', 0] },
    class_type: 'LoraLoaderModelOnly',
    _meta: { title: 'Load LoRA' },
  },
  '15': {
    inputs: { vae_name: 'PLACEHOLDER' },
    class_type: 'VAELoader',
    _meta: { title: 'Load VAE' },
  },
  '16': {
    inputs: { vae_name: 'PLACEHOLDER' },
    class_type: 'VAELoader',
    _meta: { title: 'Load VAE' },
  },
  '17': {
    inputs: { clip_name: 'PLACEHOLDER', type: 'PLACEHOLDER', device: 'PLACEHOLDER' },
    class_type: 'CLIPLoader',
    _meta: { title: 'Load CLIP' },
  },
  '18': {
    inputs: { positive: 'PLACEHOLDER' },
    class_type: 'easy positive',
    _meta: { title: 'Positive' },
  },
  '19': {
    inputs: { value: 0 },
    class_type: 'PrimitiveInt',
    _meta: { title: 'Steps' },
  },
  '20': {
    inputs: { expression: 'PLACEHOLDER', a: ['21', 0] },
    class_type: 'MathExpression|pysssss',
    _meta: { title: 'Generate Frame' },
  },
  '21': {
    inputs: { value: 0 },
    class_type: 'PrimitiveInt',
    _meta: { title: 'N' },
  },
  '22': {
    inputs: { number_type: 'float', number: 0 },
    class_type: 'Constant Number',
    _meta: { title: 'FPS' },
  },
  '23': {
    inputs: { model: ['52', 0], conditioning: ['29', 0] },
    class_type: 'BasicGuider',
    _meta: { title: 'Basic Guider' },
  },
  '24': {
    inputs: {
      noise: ['25', 0],
      guider: ['23', 0],
      sampler: ['26', 0],
      sigmas: ['27', 0],
      latent_image: ['4', 1],
    },
    class_type: 'SamplerCustomAdvanced',
    _meta: { title: 'SamplerCustomAdvanced' },
  },
  '25': {
    inputs: { noise_seed: 0 },
    class_type: 'RandomNoise',
    _meta: { title: 'RandomNoise' },
  },
  '26': {
    inputs: { sampler_name: 'PLACEHOLDER' },
    class_type: 'KSamplerSelect',
    _meta: { title: 'KSamplerSelect' },
  },
  '27': {
    inputs: { scheduler: 'PLACEHOLDER', steps: ['19', 0], denoise: 1, model: ['52', 0] },
    class_type: 'BasicScheduler',
    _meta: { title: 'BasicScheduler' },
  },
  '29': {
    inputs: { verbose: true, release_pinned_ram: true, aimdo_analyze: true, passthrough: ['4', 0] },
    class_type: 'ForceFullUnload',
    _meta: { title: 'Force Full Unload (VRAM+Pinned)' },
  },
  '30': {
    inputs: { verbose: true, release_pinned_ram: true, aimdo_analyze: true, passthrough: ['24', 0] },
    class_type: 'ForceFullUnload',
    _meta: { title: 'Force Full Unload (VRAM+Pinned)' },
  },
  '31': {
    inputs: { samples: ['62', 0], vae: ['16', 0] },
    class_type: 'VAEDecode',
    _meta: { title: 'VAE Decode' },
  },
  '32': {
    inputs: { samples: ['62', 1], vae: ['15', 0] },
    class_type: 'VAEDecodeAudio',
    _meta: { title: 'VAE Decode Audio' },
  },
  '33': {
    inputs: { resize_type: 'PLACEHOLDER', 'resize_type.scale': 0, quality: 'PLACEHOLDER', images: ['31', 0] },
    class_type: 'RTXVideoSuperResolution',
    _meta: { title: 'RTX Video Super Resolution' },
  },
  '34': {
    inputs: {
      frame_rate: ['22', 1],
      loop_count: 0,
      filename_prefix: 'PLACEHOLDER',
      format: 'PLACEHOLDER',
      pix_fmt: 'PLACEHOLDER',
      crf: 0,
      save_metadata: false,
      trim_to_audio: false,
      pingpong: false,
      save_output: false,
      images: ['33', 0],
      audio: ['32', 0],
    },
    class_type: 'VHS_VideoCombine',
    _meta: { title: 'Video Combine 🎥🅥🅗🅢' },
  },
  '40': {
    inputs: { verbose: true, release_pinned_ram: true, aimdo_analyze: true, passthrough: ['34', 0] },
    class_type: 'ForceFullUnload',
    _meta: { title: 'Force Full Unload (VRAM+Pinned)' },
  },
  '43': {
    inputs: { sage_attention: 'PLACEHOLDER', allow_compile: false, model: ['1', 0] },
    class_type: 'PathchSageAttentionKJ',
    _meta: { title: 'Patch Sage Attention KJ' },
  },
  '49': {
    inputs: { head_chunks: 0, model: ['50', 0] },
    class_type: 'MiniMaxLowVRAMAttention',
    _meta: { title: 'MiniMax H3 Low VRAM Attention' },
  },
  '50': {
    inputs: { model: ['43', 0] },
    class_type: 'MiniMaxH3MemoryEfficientSageAttentionPatch',
    _meta: { title: 'MiniMax H3 Mem Eff Sage Attention Patch' },
  },
  '52': {
    inputs: { enabled: false, chunks: 0, min_tokens: 0, model: ['49', 0] },
    class_type: 'MiniMaxH3ChunkFeedForward',
    _meta: { title: 'MiniMax H3 Chunk FeedForward' },
  },
  '62': {
    inputs: { av_latent: ['30', 0] },
    class_type: 'LTXVSeparateAVLatent',
    _meta: { title: 'LTXVSeparateAVLatent' },
  },
} satisfies ComfyUIWorkflow;
