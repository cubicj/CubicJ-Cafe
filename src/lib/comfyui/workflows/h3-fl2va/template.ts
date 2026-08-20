import type { ComfyUIWorkflow } from '@/types'

export const H3_FL2VA_WORKFLOW_TEMPLATE = {
  '2': {
    inputs: { megapixels: 0, multiple_of: 0, upscale_method: 'PLACEHOLDER', image: ['17', 0] },
    class_type: 'ResizeImageToMegapixels',
    _meta: { title: 'Resize Image (Megapixels + Alignment)' },
  },
  '3': {
    inputs: { shift_video: 0, shift_audio: 0, model: ['56', 0] },
    class_type: 'MiniMaxH3SigmaShift',
    _meta: { title: 'ModelSamplingMiniMaxH3' },
  },
  '5': {
    inputs: {
      prompt: ['23', 0],
      width: ['2', 1],
      height: ['2', 2],
      length: ['19', 0],
      clip: ['26', 0],
      vae: ['28', 0],
      first_frame: ['2', 0],
      last_frame: ['58', 0],
    },
    class_type: 'MiniMaxH3ImageToVideo',
    _meta: { title: 'MiniMax H3 Image to Video' },
  },
  '15': {
    inputs: { unet_name: 'PLACEHOLDER', weight_dtype: 'PLACEHOLDER' },
    class_type: 'UNETLoader',
    _meta: { title: 'Load Diffusion Model' },
  },
  '16': {
    inputs: { attention: 'PLACEHOLDER', model: ['3', 0] },
    class_type: 'ModelAttentionBackend',
    _meta: { title: 'ModelAttentionBackend' },
  },
  '17': {
    inputs: { image: 'PLACEHOLDER' },
    class_type: 'LoadImage',
    _meta: { title: 'First Frame' },
  },
  '19': {
    inputs: { expression: 'PLACEHOLDER', a: ['21', 0] },
    class_type: 'MathExpression|pysssss',
    _meta: { title: 'Generate Frame' },
  },
  '21': {
    inputs: { value: 0 },
    class_type: 'PrimitiveInt',
    _meta: { title: 'N' },
  },
  '23': {
    inputs: { positive: 'PLACEHOLDER' },
    class_type: 'easy positive',
    _meta: { title: 'Positive' },
  },
  '26': {
    inputs: { clip_name: 'PLACEHOLDER', type: 'PLACEHOLDER', device: 'PLACEHOLDER' },
    class_type: 'CLIPLoader',
    _meta: { title: 'Load CLIP' },
  },
  '27': {
    inputs: { vae_name: 'PLACEHOLDER' },
    class_type: 'VAELoader',
    _meta: { title: 'Load VAE' },
  },
  '28': {
    inputs: { vae_name: 'PLACEHOLDER' },
    class_type: 'VAELoader',
    _meta: { title: 'Load VAE' },
  },
  '29': {
    inputs: {
      noise: ['33', 0],
      guider: ['40', 0],
      sampler: ['32', 0],
      sigmas: ['53', 0],
      latent_image: ['5', 1],
    },
    class_type: 'SamplerCustomAdvanced',
    _meta: { title: 'SamplerCustomAdvanced' },
  },
  '32': {
    inputs: { sampler_name: 'PLACEHOLDER' },
    class_type: 'KSamplerSelect',
    _meta: { title: 'KSamplerSelect' },
  },
  '33': {
    inputs: { noise_seed: 0 },
    class_type: 'RandomNoise',
    _meta: { title: 'RandomNoise' },
  },
  '40': {
    inputs: { model: ['60', 0], conditioning: ['63', 0] },
    class_type: 'BasicGuider',
    _meta: { title: 'Basic Guider' },
  },
  '42': {
    inputs: { av_latent: ['64', 0] },
    class_type: 'LTXVSeparateAVLatent',
    _meta: { title: 'LTXVSeparateAVLatent' },
  },
  '43': {
    inputs: { samples: ['42', 0], vae: ['28', 0] },
    class_type: 'VAEDecode',
    _meta: { title: 'VAE Decode' },
  },
  '45': {
    inputs: { samples: ['42', 1], vae: ['27', 0] },
    class_type: 'VAEDecodeAudio',
    _meta: { title: 'VAE Decode Audio' },
  },
  '46': {
    inputs: {
      frame_rate: ['47', 1],
      loop_count: 0,
      filename_prefix: 'PLACEHOLDER',
      format: 'PLACEHOLDER',
      pix_fmt: 'PLACEHOLDER',
      crf: 0,
      save_metadata: false,
      trim_to_audio: false,
      pingpong: false,
      save_output: false,
      images: ['54', 0],
      audio: ['45', 0],
    },
    class_type: 'VHS_VideoCombine',
    _meta: { title: 'Video Combine 🎥🅥🅗🅢' },
  },
  '47': {
    inputs: { number_type: 'integer', number: 0 },
    class_type: 'Constant Number',
    _meta: { title: 'FPS' },
  },
  '49': {
    inputs: { verbose: true, release_pinned_ram: true, aimdo_analyze: true, passthrough: ['46', 0] },
    class_type: 'ForceFullUnload',
    _meta: { title: 'Force Full Unload (VRAM+Pinned)' },
  },
  '52': {
    inputs: { value: 0 },
    class_type: 'PrimitiveInt',
    _meta: { title: 'Steps' },
  },
  '53': {
    inputs: { scheduler: 'PLACEHOLDER', steps: ['52', 0], denoise: 1, model: ['60', 0] },
    class_type: 'BasicScheduler',
    _meta: { title: 'BasicScheduler' },
  },
  '54': {
    inputs: { resize_type: 'PLACEHOLDER', 'resize_type.scale': 0, quality: 'PLACEHOLDER', images: ['43', 0] },
    class_type: 'RTXVideoSuperResolution',
    _meta: { title: 'RTX Video Super Resolution' },
  },
  '56': {
    inputs: { lora_name: 'PLACEHOLDER', strength_model: 0, model: ['15', 0] },
    class_type: 'LoraLoaderModelOnly',
    _meta: { title: 'Load LoRA' },
  },
  '57': {
    inputs: { image: 'PLACEHOLDER' },
    class_type: 'LoadImage',
    _meta: { title: 'Last Frame' },
  },
  '58': {
    inputs: { megapixels: 0, multiple_of: 0, upscale_method: 'PLACEHOLDER', image: ['57', 0] },
    class_type: 'ResizeImageToMegapixels',
    _meta: { title: 'Resize Image (Megapixels + Alignment)' },
  },
  '59': {
    inputs: { enabled: false, model: ['16', 0] },
    class_type: 'MiniMaxH3FusedModulation',
    _meta: { title: 'MiniMax H3 Fused Modulation' },
  },
  '60': {
    inputs: { enabled: false, chunks: 0, min_tokens: 0, model: ['59', 0] },
    class_type: 'MiniMaxH3ChunkFeedForward',
    _meta: { title: 'MiniMax H3 Chunk FeedForward' },
  },
  '63': {
    inputs: { verbose: true, release_pinned_ram: true, aimdo_analyze: true, passthrough: ['5', 0] },
    class_type: 'ForceFullUnload',
    _meta: { title: 'Force Full Unload (VRAM+Pinned)' },
  },
  '64': {
    inputs: { verbose: true, release_pinned_ram: true, aimdo_analyze: true, passthrough: ['29', 0] },
    class_type: 'ForceFullUnload',
    _meta: { title: 'Force Full Unload (VRAM+Pinned)' },
  },
} satisfies ComfyUIWorkflow
