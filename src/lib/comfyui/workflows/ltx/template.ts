import type { ComfyUIWorkflow } from '@/types'

export const LTX_WORKFLOW_TEMPLATE: ComfyUIWorkflow = {
  '1': {
    inputs: {
      vae_name: 'PLACEHOLDER',
      device: 'main_device',
      weight_dtype: 'bf16',
    },
    class_type: 'VAELoaderKJ',
    _meta: {
      title: 'VAELoader KJ',
    },
  },
  '2': {
    inputs: {
      vae_name: 'PLACEHOLDER',
      device: 'main_device',
      weight_dtype: 'bf16',
    },
    class_type: 'VAELoaderKJ',
    _meta: {
      title: 'VAELoader KJ',
    },
  },
  '5': {
    inputs: {
      text: 'PLACEHOLDER',
      clip: ['390', 0],
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)',
    },
  },
  '6': {
    inputs: {
      text: 'PLACEHOLDER',
      clip: ['390', 0],
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)',
    },
  },
  '13': {
    inputs: {
      frames_number: ['101', 0],
      frame_rate: ['416', 2],
      batch_size: 1,
      audio_vae: ['1', 0],
    },
    class_type: 'LTXVEmptyLatentAudio',
    _meta: {
      title: 'LTXV Empty Latent Audio',
    },
  },
  '15': {
    inputs: {
      video_latent: ['265', 0],
      audio_latent: ['13', 0],
    },
    class_type: 'LTXVConcatAVLatent',
    _meta: {
      title: 'LTXVConcatAVLatent',
    },
  },
  '16': {
    inputs: {
      noise_seed: 0,
    },
    class_type: 'RandomNoise',
    _meta: {
      title: 'RandomNoise',
    },
  },
  '17': {
    inputs: {
      noise: ['16', 0],
      guider: ['482', 0],
      sampler: ['463', 0],
      sigmas: ['403', 0],
      latent_image: ['15', 0],
    },
    class_type: 'SamplerCustomAdvanced',
    _meta: {
      title: 'SamplerCustomAdvanced',
    },
  },
  '23': {
    inputs: {
      frame_rate: ['416', 1],
      positive: ['5', 0],
      negative: ['6', 0],
    },
    class_type: 'LTXVConditioning',
    _meta: {
      title: 'LTXVConditioning',
    },
  },
  '86': {
    inputs: {
      megapixels: 0,
      multiple_of: 0,
      upscale_method: 'PLACEHOLDER',
      image: ['87', 0],
    },
    class_type: 'ResizeImageToMegapixels',
    _meta: {
      title: 'Resize Image (Megapixels + Alignment)',
    },
  },
  '87': {
    inputs: {
      image: 'PLACEHOLDER',
    },
    class_type: 'LoadImage',
    _meta: {
      title: 'Start Image',
    },
  },
  '90': {
    inputs: {
      width: ['86', 1],
      height: ['86', 2],
      length: ['101', 0],
      batch_size: 1,
    },
    class_type: 'EmptyLTXVLatentVideo',
    _meta: {
      title: 'EmptyLTXVLatentVideo',
    },
  },
  '101': {
    inputs: {
      expression: 'a * b + 1',
      a: ['416', 2],
      b: ['103', 0],
    },
    class_type: 'MathExpression|pysssss',
    _meta: {
      title: 'Generate Frame',
    },
  },
  '103': {
    inputs: {
      value: 0,
    },
    class_type: 'PrimitiveInt',
    _meta: {
      title: 'Second',
    },
  },
  '260': {
    inputs: {
      image: 'PLACEHOLDER',
    },
    class_type: 'LoadImage',
    _meta: {
      title: 'End Image',
    },
  },
  '261': {
    inputs: {
      expression: 'a - 1',
      a: ['101', 0],
    },
    class_type: 'MathExpression|pysssss',
    _meta: {
      title: 'Last Index',
    },
  },
  '264': {
    inputs: {
      megapixels: 0,
      multiple_of: 0,
      upscale_method: 'PLACEHOLDER',
      image: ['260', 0],
    },
    class_type: 'ResizeImageToMegapixels',
    _meta: {
      title: 'Resize Image (Megapixels + Alignment)',
    },
  },
  '265': {
    inputs: {
      num_images: '2',
      'num_images.strength_1': 1,
      'num_images.strength_2': 1,
      'num_images.index_1': 0,
      'num_images.index_2': ['261', 0],
      vae: ['2', 0],
      latent: ['90', 0],
      'num_images.image_1': ['466', 0],
      'num_images.image_2': ['469', 0],
    },
    class_type: 'LTXVImgToVideoInplaceKJ',
    _meta: {
      title: 'LTXVImgToVideoInplaceKJ',
    },
  },
  '297': {
    inputs: {
      unet_name: 'PLACEHOLDER',
      weight_dtype: 'default',
    },
    class_type: 'UNETLoader',
    _meta: {
      title: '1 Pass Model',
    },
  },
  '321': {
    inputs: {
      samples: ['384', 1],
      audio_vae: ['1', 0],
    },
    class_type: 'LTXVAudioVAEDecode',
    _meta: {
      title: 'LTXV Audio VAE Decode',
    },
  },
  '322': {
    inputs: {
      resize_type: 'PLACEHOLDER',
      'resize_type.scale': 0,
      quality: 'PLACEHOLDER',
      images: ['489', 0],
    },
    class_type: 'RTXVideoSuperResolution',
    _meta: {
      title: 'RTX Video Super Resolution',
    },
  },
  '333': {
    inputs: {
      samples: ['384', 0],
      vae: ['2', 0],
    },
    class_type: 'VAEDecode',
    _meta: {
      title: 'VAE Decode',
    },
  },
  '339': {
    inputs: {
      value: 0,
    },
    class_type: 'PrimitiveInt',
    _meta: {
      title: 'multiplier',
    },
  },
  '340': {
    inputs: {
      expression: 'a * b',
      a: ['416', 2],
      b: ['339', 0],
    },
    class_type: 'MathExpression|pysssss',
    _meta: {
      title: 'Final FPS',
    },
  },
  '345': {
    inputs: {
      frame_rate: 0,
      loop_count: 0,
      filename_prefix: 'PLACEHOLDER',
      format: 'PLACEHOLDER',
      pix_fmt: 'PLACEHOLDER',
      crf: 0,
      save_metadata: false,
      trim_to_audio: false,
      pingpong: false,
      save_output: false,
      images: ['322', 0],
      audio: ['488', 0],
    },
    class_type: 'VHS_VideoCombine',
    _meta: {
      title: 'Video Combine 🎥🅥🅗🅢',
    },
  },
  '384': {
    inputs: {
      av_latent: ['486', 0],
    },
    class_type: 'LTXVSeparateAVLatent',
    _meta: {
      title: 'LTXVSeparateAVLatent',
    },
  },
  '390': {
    inputs: {
      clip_name1: 'PLACEHOLDER',
      clip_name2: 'PLACEHOLDER',
      type: 'ltxv',
      device: 'default',
    },
    class_type: 'DualCLIPLoader',
    _meta: {
      title: 'DualCLIPLoader',
    },
  },
  '403': {
    inputs: {
      steps: 0,
      max_shift: 0,
      base_shift: 0,
      stretch: true,
      terminal: 0,
      latent: ['15', 0],
    },
    class_type: 'LTXVScheduler',
    _meta: {
      title: 'LTXVScheduler',
    },
  },
  '416': {
    inputs: {
      number_type: 'integer',
      number: 0,
    },
    class_type: 'Constant Number',
    _meta: {
      title: 'FPS',
    },
  },
  '448': {
    inputs: {
      PowerLoraLoaderHeaderWidget: {
        type: 'PowerLoraLoaderHeaderWidget',
      },
      lora_1: {
        on: false,
        lora: '',
        strength: 0,
      },
      lora_2: {
        on: false,
        lora: '',
        strength: 0,
      },
      lora_3: {
        on: false,
        lora: '',
        strength: 0,
      },
      lora_4: {
        on: false,
        lora: '',
        strength: 0,
      },
      '➕ Add Lora': '',
      model: ['481', 0],
    },
    class_type: 'Power Lora Loader (rgthree)',
    _meta: {
      title: '1 Pass LoRA',
    },
  },
  '463': {
    inputs: {
      eta: 0,
      sampler_name: 'PLACEHOLDER',
      seed: 0,
      bongmath: true,
    },
    class_type: 'ClownSampler_Beta',
    _meta: {
      title: 'ClownSampler',
    },
  },
  '466': {
    inputs: {
      img_compression: 0,
      image: ['86', 0],
    },
    class_type: 'LTXVPreprocess',
    _meta: {
      title: 'LTXVPreprocess',
    },
  },
  '469': {
    inputs: {
      img_compression: 0,
      image: ['264', 0],
    },
    class_type: 'LTXVPreprocess',
    _meta: {
      title: 'LTXVPreprocess',
    },
  },
  '476': {
    inputs: {
      nag_scale: 0,
      nag_alpha: 0,
      nag_tau: 0,
      inplace: true,
      model: ['448', 0],
      nag_cond_video: ['23', 1],
      nag_cond_audio: ['23', 1],
    },
    class_type: 'LTX2_NAG',
    _meta: {
      title: 'LTX2 NAG',
    },
  },
  '481': {
    inputs: {
      triton_kernels: true,
      model: ['297', 0],
    },
    class_type: 'LTX2MemoryEfficientSageAttentionPatch',
    _meta: {
      title: 'LTX2 Mem Eff Sage Attention Patch',
    },
  },
  '482': {
    inputs: {
      cfg: 1,
      model: ['476', 0],
      positive: ['490', 0],
      negative: ['23', 1],
    },
    class_type: 'CFGGuider',
    _meta: {
      title: 'CFGGuider',
    },
  },
  '486': {
    inputs: {
      verbose: true,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['17', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (VRAM+Pinned)',
    },
  },
  '487': {
    inputs: {
      verbose: true,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['345', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (VRAM+Pinned)',
    },
  },
  '488': {
    inputs: {
      verbose: true,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['321', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (VRAM+Pinned)',
    },
  },
  '489': {
    inputs: {
      verbose: true,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['333', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (VRAM+Pinned)',
    },
  },
  '490': {
    inputs: {
      verbose: true,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['23', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (VRAM+Pinned)',
    },
  },
}
