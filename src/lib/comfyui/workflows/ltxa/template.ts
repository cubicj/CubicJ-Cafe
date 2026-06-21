import type { ComfyUIWorkflow } from '@/types';

export const LTXA_WORKFLOW_TEMPLATE = {
  '5': {
    inputs: {
      text: 'PLACEHOLDER',
      clip: ['506', 0],
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)',
    },
  },
  '6': {
    inputs: {
      text: 'PLACEHOLDER',
      clip: ['506', 0],
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'CLIP Text Encode (Prompt)',
    },
  },
  '13': {
    inputs: {
      frames_number: ['498', 0],
      frame_rate: ['416', 2],
      batch_size: 1,
      audio_vae: ['611', 0],
    },
    class_type: 'LTXVEmptyLatentAudio',
    _meta: {
      title: 'LTXV Empty Latent Audio',
    },
  },
  '15': {
    inputs: {
      video_latent: ['508', 2],
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
      guider: ['641', 0],
      sampler: ['654', 0],
      sigmas: ['682', 0],
      latent_image: ['15', 0],
    },
    class_type: 'SamplerCustomAdvanced',
    _meta: {
      title: '1-Pass',
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
      length: ['498', 0],
      batch_size: 1,
    },
    class_type: 'EmptyLTXVLatentVideo',
    _meta: {
      title: 'EmptyLTXVLatentVideo',
    },
  },
  '103': {
    inputs: {
      value: 0,
    },
    class_type: 'PrimitiveInt',
    _meta: {
      title: 'N',
    },
  },
  '265': {
    inputs: {
      num_images: '1',
      'num_images.strength_1': 1,
      'num_images.index_1': 0,
      vae: ['504', 2],
      latent: ['90', 0],
      'num_images.image_1': ['86', 0],
    },
    class_type: 'LTXVImgToVideoInplaceKJ',
    _meta: {
      title: 'LTXVImgToVideoInplaceKJ',
    },
  },
  '322': {
    inputs: {
      resize_type: 'PLACEHOLDER',
      'resize_type.scale': 0,
      quality: 'PLACEHOLDER',
      images: ['333', 0],
    },
    class_type: 'RTXVideoSuperResolution',
    _meta: {
      title: 'RTX Video Super Resolution',
    },
  },
  '333': {
    inputs: {
      samples: ['708', 2],
      vae: ['504', 2],
    },
    class_type: 'VAEDecode',
    _meta: {
      title: 'VAE Decode',
    },
  },
  '345': {
    inputs: {
      frame_rate: ['416', 1],
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
      audio: ['587', 0],
    },
    class_type: 'VHS_VideoCombine',
    _meta: {
      title: 'Video Combine 🎥🅥🅗🅢',
    },
  },
  '348': {
    inputs: {
      identity_guidance_scale: 0,
      start_percent: 0,
      end_percent: 0,
      model: ['492', 0],
      positive: ['23', 0],
      negative: ['23', 1],
      reference_audio: ['350', 0],
      audio_vae: ['611', 0],
    },
    class_type: 'LTXVReferenceAudio',
    _meta: {
      title: 'LTXV Reference Audio (ID-LoRA)',
    },
  },
  '350': {
    inputs: {
      audio: 'PLACEHOLDER',
    },
    class_type: 'LoadAudio',
    _meta: {
      title: 'Load Audio',
    },
  },
  '384': {
    inputs: {
      av_latent: ['17', 0],
    },
    class_type: 'LTXVSeparateAVLatent',
    _meta: {
      title: 'LTXVSeparateAVLatent',
    },
  },
  '416': {
    inputs: {
      number: 0,
      number_type: 'integer',
    },
    class_type: 'Constant Number',
    _meta: {
      title: 'FPS',
    },
  },
  '654': {
    inputs: {
      sampler_name: 'PLACEHOLDER',
    },
    class_type: 'KSamplerSelect',
    _meta: {
      title: 'KSamplerSelect',
    },
  },
  '476': {
    inputs: {
      nag_scale: 0,
      nag_alpha: 0,
      nag_tau: 0,
      inplace: true,
      debug: false,
      model: ['504', 0],
      nag_cond_video: ['512', 0],
      nag_cond_audio: ['513', 0],
    },
    class_type: 'CubicJLTX2ExplicitNAG',
    _meta: {
      title: 'LTX2 NAG',
    },
  },
  '487': {
    inputs: {
      verbose: false,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['345', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (VRAM+Pinned)',
    },
  },
  '490': {
    inputs: {
      verbose: false,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['23', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (VRAM+Pinned)',
    },
  },
  '498': {
    inputs: {
      expression: 'a * b + 1',
      a: ['499', 0],
      b: ['103', 0],
    },
    class_type: 'MathExpression|pysssss',
    _meta: {
      title: 'Generate Frame',
    },
  },
  '499': {
    inputs: {
      value: 0,
    },
    class_type: 'PrimitiveInt',
    _meta: {
      title: 'Base',
    },
  },
  '504': {
    inputs: {
      ckpt_name: 'PLACEHOLDER',
    },
    class_type: 'CheckpointLoaderSimple',
    _meta: {
      title: 'Load Checkpoint',
    },
  },
  '611': {
    inputs: {
      ckpt_name: 'PLACEHOLDER',
    },
    class_type: 'LTXVAudioVAELoader',
    _meta: {
      title: 'LTXV Audio VAE Loader',
    },
  },
  '506': {
    inputs: {
      text_encoder: 'PLACEHOLDER',
      ckpt_name: 'PLACEHOLDER',
      device: 'default',
    },
    class_type: 'LTXAVTextEncoderLoader',
    _meta: {
      title: 'LTXV Audio Text Encoder Loader',
    },
  },
  '508': {
    inputs: {
      frame_idx: 0,
      strength: 0,
      crf: 0,
      blur_radius: 0,
      interpolation: 'PLACEHOLDER',
      crop: 'PLACEHOLDER',
      positive: ['348', 1],
      negative: ['348', 2],
      vae: ['504', 2],
      latent: ['265', 0],
      image: ['660', 0],
    },
    class_type: 'LTXVAddGuideAdvanced',
    _meta: {
      title: '🅛🅣🅧 LTXV Add Guide Advanced',
    },
  },
  '510': {
    inputs: {
      positive: ['508', 0],
      negative: ['508', 1],
      latent: ['384', 0],
    },
    class_type: 'LTXVCropGuides',
    _meta: {
      title: 'LTXVCropGuides',
    },
  },
  '511': {
    inputs: {
      strength: 0,
      cache_at_step: 0,
      similarity_threshold: 0,
      decay_with_distance: 0,
      energy_threshold: 0,
      bypass: false,
      debug: false,
      advanced_mode: false,
      cache_mode: 'PLACEHOLDER',
      forwards_per_step: 0,
      cache_warmup: 0,
      anchor_frame: 0,
      depth_curve: 'PLACEHOLDER',
      block_index_filter: 'PLACEHOLDER',
      model: ['680', 0],
      reference_image: ['86', 0],
      vae: ['504', 2],
      energy_latent: ['508', 2],
      sigmas: ['682', 0],
    },
    class_type: 'LTXLatentAnchorAware',
    _meta: {
      title: '🎯 LTX Latent Anchor Aware',
    },
  },
  '512': {
    inputs: {
      text: 'PLACEHOLDER',
      clip: ['506', 0],
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'video',
    },
  },
  '513': {
    inputs: {
      text: 'PLACEHOLDER',
      clip: ['506', 0],
    },
    class_type: 'CLIPTextEncode',
    _meta: {
      title: 'audio',
    },
  },
  '534': {
    inputs: {
      text_amplification: 0,
      spatial_focus: 0,
      block_index_filter: '',
      bypass: false,
      debug: false,
      model: ['681', 0],
    },
    class_type: 'LTXTextAttentionAmplifier',
    _meta: {
      title: '🔊 LTX Text Attention Amplifier',
    },
  },
  '536': {
    inputs: {
      model_name: 'PLACEHOLDER',
    },
    class_type: 'LatentUpscaleModelLoader',
    _meta: {
      title: 'Load Latent Upscale Model',
    },
  },
  '538': {
    inputs: {
      verbose: false,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['583', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (VRAM+Pinned)',
    },
  },
  '539': {
    inputs: {
      av_latent: ['538', 0],
    },
    class_type: 'LTXVSeparateAVLatent',
    _meta: {
      title: 'LTXVSeparateAVLatent',
    },
  },
  '540': {
    inputs: {
      samples: ['510', 2],
      upscale_model: ['536', 0],
      vae: ['504', 2],
    },
    class_type: 'LTXVLatentUpsampler',
    _meta: {
      title: 'LTXVLatentUpsampler',
    },
  },
  '543': {
    inputs: {
      video_latent: ['607', 2],
      audio_latent: ['384', 1],
    },
    class_type: 'LTXVConcatAVLatent',
    _meta: {
      title: 'LTXVConcatAVLatent',
    },
  },
  '555': {
    inputs: {
      video_cfg: 0,
      audio_cfg: 0,
      inactive_cfg: 0,
      active_steps: 0,
      video_stg: 0,
      audio_stg: 0,
      rescale: 0,
      modality_scale: 1,
      cross_attn: true,
      skip_blocks: '',
      debug: false,
      model: ['511', 0],
      positive: ['508', 0],
      negative: ['508', 1],
    },
    class_type: 'LTXScheduledMultimodalCFGGuider',
    _meta: {
      title: '🔊 LTX Scheduled Multimodal CFG Guider',
    },
  },
  '572': {
    inputs: {
      num_images: '1',
      'num_images.strength_1': 1,
      'num_images.index_1': 0,
      vae: ['504', 2],
      latent: ['540', 0],
      'num_images.image_1': ['575', 0],
    },
    class_type: 'LTXVImgToVideoInplaceKJ',
    _meta: {
      title: 'LTXVImgToVideoInplaceKJ',
    },
  },
  '575': {
    inputs: {
      upscale_method: 'PLACEHOLDER',
      scale_by: 0,
      image: ['86', 0],
    },
    class_type: 'ImageScaleBy',
    _meta: {
      title: 'Upscale Image By',
    },
  },
  '580': {
    inputs: {
      cfg: 0,
      model: ['534', 0],
      positive: ['607', 0],
      negative: ['607', 1],
    },
    class_type: 'CFGGuider',
    _meta: {
      title: 'CFGGuider',
    },
  },
  '582': {
    inputs: {
      sigmas: 'PLACEHOLDER',
    },
    class_type: 'ManualSigmas',
    _meta: {
      title: 'ManualSigmas',
    },
  },
  '583': {
    inputs: {
      noise: ['16', 0],
      guider: ['642', 0],
      sampler: ['654', 0],
      sigmas: ['582', 0],
      latent_image: ['543', 0],
    },
    class_type: 'SamplerCustomAdvanced',
    _meta: {
      title: '2-Pass',
    },
  },
  '587': {
    inputs: {
      samples: ['539', 1],
      audio_vae: ['611', 0],
    },
    class_type: 'LTXVAudioVAEDecode',
    _meta: {
      title: 'LTXV Audio VAE Decode',
    },
  },
  '607': {
    inputs: {
      frame_idx: 0,
      strength: 0,
      crf: 0,
      blur_radius: 0,
      interpolation: 'PLACEHOLDER',
      crop: 'PLACEHOLDER',
      positive: ['510', 0],
      negative: ['510', 1],
      vae: ['504', 2],
      latent: ['572', 0],
      image: ['661', 0],
    },
    class_type: 'LTXVAddGuideAdvanced',
    _meta: {
      title: '?뀤?뀭?뀱 LTXV Add Guide Advanced',
    },
  },
  '608': {
    inputs: {
      positive: ['607', 0],
      negative: ['607', 1],
      latent: ['539', 0],
    },
    class_type: 'LTXVCropGuides',
    _meta: {
      title: 'LTXVCropGuides',
    },
  },
  '658': {
    inputs: {
      sage_attention: 'PLACEHOLDER',
      allow_compile: false,
      model: ['504', 0],
    },
    class_type: 'PathchSageAttentionKJ',
    _meta: {
      title: 'Patch Sage Attention KJ',
    },
  },
  '660': {
    inputs: {
      img_compression: 0,
      image: ['86', 0],
    },
    class_type: 'LTXVPreprocess',
    _meta: {
      title: 'LTXVPreprocess',
    },
  },
  '661': {
    inputs: {
      img_compression: 0,
      image: ['575', 0],
    },
    class_type: 'LTXVPreprocess',
    _meta: {
      title: 'LTXVPreprocess',
    },
  },
  '672': {
    inputs: {
      triton_kernels: false,
      model: ['658', 0],
    },
    class_type: 'LTX2MemoryEfficientSageAttentionPatch',
    _meta: {
      title: 'LTX2 Memory Efficient Sage Attention Patch',
    },
  },
  '674': {
    inputs: {
      enable_fp16_accumulation: false,
      model: ['672', 0],
    },
    class_type: 'ModelPatchTorchSettings',
    _meta: {
      title: 'Model Patch Torch Settings',
    },
  },
  '675': {
    inputs: {
      expression: 'max(1, round(((a * b * c * 4) / 120000000)**1.3 * 0.5 * 2))',
      'values.a': ['498', 0],
      'values.b': ['86', 1],
      'values.c': ['86', 2],
    },
    class_type: 'ComfyMathExpression',
    _meta: {
      title: 'Chunk Count',
    },
  },
  '676': {
    inputs: {
      dim_threshold: 0,
      chunks: ['675', 1],
      model: ['674', 0],
    },
    class_type: 'LTXVChunkFeedForward',
    _meta: {
      title: 'LTXV Chunk Feed Forward',
    },
  },
  '677': {
    inputs: {
      video_scale: 0,
      video_to_audio_scale: 0,
      audio_scale: 0,
      audio_to_video_scale: 0,
      blocks: 'PLACEHOLDER',
      triton_kernels: false,
      model: ['676', 0],
    },
    class_type: 'LTX2AttentionTunerPatch',
    _meta: {
      title: 'LTX2 Attention Tuner Patch',
    },
  },
  '680': {
    inputs: {
      lora_name: 'PLACEHOLDER',
      strength_model: 0,
      video: 1,
      video_to_audio: 1,
      audio: 1,
      audio_to_video: 1,
      other: 1,
      model: ['476', 0],
    },
    class_type: 'LTX2LoraLoaderAdvanced',
    _meta: {
      title: '1 Pass Distilled LoRA',
    },
  },
  '681': {
    inputs: {
      lora_name: 'PLACEHOLDER',
      strength_model: 0,
      video: 1,
      video_to_audio: 1,
      audio: 1,
      audio_to_video: 1,
      other: 1,
      model: ['476', 0],
    },
    class_type: 'LTX2LoraLoaderAdvanced',
    _meta: {
      title: '2 Pass Distilled LoRA',
    },
  },
  '682': {
    inputs: {
      steps: 0,
      max_shift: 0,
      base_shift: 0,
      stretch: false,
      terminal: 0,
      latent: ['15', 0],
    },
    class_type: 'LTXVScheduler',
    _meta: {
      title: 'LTXVScheduler',
    },
  },
  '684': {
    inputs: {
      identity_guidance_scale: 0,
      start_percent: 0,
      end_percent: 1,
      model: ['492', 0],
      positive: ['510', 0],
      negative: ['510', 1],
      reference_audio: ['350', 0],
      audio_vae: ['611', 0],
    },
    class_type: 'LTXVReferenceAudio',
    _meta: {
      title: '2 Pass Conditions',
    },
  },
  '708': {
    inputs: {
      positive: ['510', 0],
      negative: ['510', 1],
      latent: ['539', 0],
    },
    class_type: 'LTXVCropGuides',
    _meta: {
      title: 'LTXVCropGuides',
    },
  },
  '641': {
    inputs: {
      verbose: false,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['555', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (First-Pass Guider)',
    },
  },
  '642': {
    inputs: {
      verbose: false,
      release_pinned_ram: true,
      aimdo_analyze: true,
      passthrough: ['580', 0],
    },
    class_type: 'ForceFullUnload',
    _meta: {
      title: 'Force Full Unload (Second-Pass Guider)',
    },
  },
} as ComfyUIWorkflow;
