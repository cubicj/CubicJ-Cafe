import type { ComfyUIWorkflow } from '@/types'

export const LTX_WAN_WORKFLOW_TEMPLATE: ComfyUIWorkflow = {
  "1": {
    "inputs": {
      "img_compression": 0,
      "image": ["20", 0]
    },
    "class_type": "LTXVPreprocess",
    "_meta": { "title": "LTX_WAN_1" }
  },
  "2": {
    "inputs": {
      "expression": "a * b + 1",
      "a": ["3", 2],
      "b": ["36", 0]
    },
    "class_type": "MathExpression|pysssss",
    "_meta": { "title": "LTX_WAN_2" }
  },
  "3": {
    "inputs": {
      "number_type": "integer",
      "number": 0
    },
    "class_type": "Constant Number",
    "_meta": { "title": "LTX_WAN_3" }
  },
  "6": {
    "inputs": {
      "image": "PLACEHOLDER"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "LTX_WAN_6" }
  },
  "7": {
    "inputs": {
      "frame_rate": ["3", 1],
      "positive": ["13", 0],
      "negative": ["27", 0]
    },
    "class_type": "LTXVConditioning",
    "_meta": { "title": "LTX_WAN_7" }
  },
  "8": {
    "inputs": {
      "image": "PLACEHOLDER"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "LTX_WAN_8" }
  },
  "9": {
    "inputs": {
      "frames_number": ["2", 0],
      "frame_rate": ["3", 2],
      "batch_size": 1,
      "audio_vae": ["37", 0]
    },
    "class_type": "LTXVEmptyLatentAudio",
    "_meta": { "title": "LTX_WAN_9" }
  },
  "10": {
    "inputs": {
      "samples": ["16", 0],
      "vae": ["38", 0]
    },
    "class_type": "VAEDecode",
    "_meta": { "title": "LTX_WAN_10" }
  },
  "11": {
    "inputs": {
      "samples": ["16", 1],
      "audio_vae": ["37", 0]
    },
    "class_type": "LTXVAudioVAEDecode",
    "_meta": { "title": "LTX_WAN_11" }
  },
  "12": {
    "inputs": {
      "noise": ["42", 0],
      "guider": ["29", 0],
      "sampler": ["41", 0],
      "sigmas": ["32", 0],
      "latent_image": ["24", 0]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "LTX_WAN_12" }
  },
  "13": {
    "inputs": {
      "text": ["55", 0],
      "clip": ["33", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "LTX_WAN_13" }
  },
  "16": {
    "inputs": {
      "av_latent": ["188", 0]
    },
    "class_type": "LTXVSeparateAVLatent",
    "_meta": { "title": "LTX_WAN_16" }
  },
  "17": {
    "inputs": {
      "img_compression": 0,
      "image": ["25", 0]
    },
    "class_type": "LTXVPreprocess",
    "_meta": { "title": "LTX_WAN_17" }
  },
  "18": {
    "inputs": {
      "num_images": "2",
      "num_images.strength_1": 1,
      "num_images.strength_2": 1,
      "num_images.index_1": 0,
      "num_images.index_2": ["31", 0],
      "vae": ["38", 0],
      "latent": ["19", 0],
      "num_images.image_1": ["17", 0],
      "num_images.image_2": ["1", 0]
    },
    "class_type": "LTXVImgToVideoInplaceKJ",
    "_meta": { "title": "LTX_WAN_18" }
  },
  "19": {
    "inputs": {
      "width": ["25", 1],
      "height": ["25", 2],
      "length": ["2", 0],
      "batch_size": 1
    },
    "class_type": "EmptyLTXVLatentVideo",
    "_meta": { "title": "LTX_WAN_19" }
  },
  "20": {
    "inputs": {
      "megapixels": 0,
      "multiple_of": 0,
      "upscale_method": "PLACEHOLDER",
      "image": ["6", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "LTX_WAN_20" }
  },
  "21": {
    "inputs": {
      "triton_kernels": true,
      "model": ["30", 0]
    },
    "class_type": "LTX2MemoryEfficientSageAttentionPatch",
    "_meta": { "title": "LTX_WAN_21" }
  },
  "23": {
    "inputs": {
      "nag_scale": 0,
      "nag_alpha": 0,
      "nag_tau": 0,
      "inplace": true,
      "model": ["33", 0],
      "nag_cond_video": ["7", 1],
      "nag_cond_audio": ["7", 1]
    },
    "class_type": "LTX2_NAG",
    "_meta": { "title": "LTX_WAN_23" }
  },
  "24": {
    "inputs": {
      "video_latent": ["18", 0],
      "audio_latent": ["9", 0]
    },
    "class_type": "LTXVConcatAVLatent",
    "_meta": { "title": "LTX_WAN_24" }
  },
  "25": {
    "inputs": {
      "megapixels": 0,
      "multiple_of": 0,
      "upscale_method": "PLACEHOLDER",
      "image": ["8", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "LTX_WAN_25" }
  },
  "27": {
    "inputs": {
      "text": ["161", 0],
      "clip": ["33", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "LTX_WAN_27" }
  },
  "29": {
    "inputs": {
      "cfg": 0,
      "model": ["157", 0],
      "positive": ["7", 0],
      "negative": ["7", 1]
    },
    "class_type": "CFGGuider",
    "_meta": { "title": "LTX_WAN_29" }
  },
  "30": {
    "inputs": {
      "unet_name": "PLACEHOLDER",
      "weight_dtype": "PLACEHOLDER"
    },
    "class_type": "UNETLoader",
    "_meta": { "title": "LTX_WAN_30" }
  },
  "31": {
    "inputs": {
      "expression": "a - 1",
      "a": ["2", 0]
    },
    "class_type": "MathExpression|pysssss",
    "_meta": { "title": "LTX_WAN_31" }
  },
  "32": {
    "inputs": {
      "steps": 0,
      "max_shift": 0,
      "base_shift": 0,
      "stretch": false,
      "terminal": 0,
      "latent": ["24", 0]
    },
    "class_type": "LTXVScheduler",
    "_meta": { "title": "LTX_WAN_32" }
  },
  "33": {
    "inputs": {
      "PowerLoraLoaderHeaderWidget": { "type": "PowerLoraLoaderHeaderWidget" },
      "lora_1": { "on": false, "lora": "PLACEHOLDER", "strength": 0 },
      "lora_2": { "on": false, "lora": "PLACEHOLDER", "strength": 0 },
      "lora_3": { "on": false, "lora": "PLACEHOLDER", "strength": 0 },
      "➕ Add Lora": "",
      "model": ["21", 0],
      "clip": ["39", 0]
    },
    "class_type": "Power Lora Loader (rgthree)",
    "_meta": { "title": "LTX_WAN_33" }
  },
  "34": {
    "inputs": {
      "value": 0
    },
    "class_type": "PrimitiveInt",
    "_meta": { "title": "LTX_WAN_34" }
  },
  "35": {
    "inputs": {
      "expression": "a * b",
      "a": ["3", 2],
      "b": ["34", 0]
    },
    "class_type": "MathExpression|pysssss",
    "_meta": { "title": "LTX_WAN_35" }
  },
  "36": {
    "inputs": {
      "value": 0
    },
    "class_type": "PrimitiveInt",
    "_meta": { "title": "LTX_WAN_36" }
  },
  "37": {
    "inputs": {
      "vae_name": "PLACEHOLDER",
      "device": "main_device",
      "weight_dtype": "bf16"
    },
    "class_type": "VAELoaderKJ",
    "_meta": { "title": "LTX_WAN_37" }
  },
  "38": {
    "inputs": {
      "vae_name": "PLACEHOLDER",
      "device": "main_device",
      "weight_dtype": "bf16"
    },
    "class_type": "VAELoaderKJ",
    "_meta": { "title": "LTX_WAN_38" }
  },
  "39": {
    "inputs": {
      "clip_name1": "PLACEHOLDER",
      "clip_name2": "PLACEHOLDER",
      "type": "ltxv",
      "device": "default"
    },
    "class_type": "DualCLIPLoader",
    "_meta": { "title": "LTX_WAN_39" }
  },
  "41": {
    "inputs": {
      "eta": 0,
      "sampler_name": "PLACEHOLDER",
      "seed": 0,
      "bongmath": false
    },
    "class_type": "ClownSampler_Beta",
    "_meta": { "title": "LTX_WAN_41" }
  },
  "42": {
    "inputs": {
      "noise_seed": 0
    },
    "class_type": "RandomNoise",
    "_meta": { "title": "LTX_WAN_42" }
  },
  "55": {
    "inputs": {
      "text": "PLACEHOLDER"
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "LTX_WAN_55" }
  },
  "56": {
    "inputs": {
      "text": "PLACEHOLDER"
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "LTX_WAN_56" }
  },
  "82": {
    "inputs": {
      "frame_rate": ["35", 1],
      "loop_count": 0,
      "filename_prefix": "PLACEHOLDER",
      "format": "PLACEHOLDER",
      "pix_fmt": "PLACEHOLDER",
      "crf": 0,
      "save_metadata": false,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": false,
      "images": ["84", 0],
      "audio": ["194", 0]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": { "title": "LTX_WAN_82" }
  },
  "84": {
    "inputs": {
      "resize_type": "PLACEHOLDER",
      "resize_type.scale": 0,
      "quality": "PLACEHOLDER",
      "images": ["168", 0]
    },
    "class_type": "RTXVideoSuperResolution",
    "_meta": { "title": "LTX_WAN_84" }
  },
  "157": {
    "inputs": {
      "audio_normalization_factors": "PLACEHOLDER",
      "model": ["23", 0]
    },
    "class_type": "LTX2AudioLatentNormalizingSampling",
    "_meta": { "title": "LTX_WAN_157" }
  },
  "161": {
    "inputs": {
      "text": "PLACEHOLDER"
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "LTX_WAN_161" }
  },
  "168": {
    "inputs": {
      "clear_cache_after_n_frames": 0,
      "multiplier": ["34", 0],
      "keep_model_loaded": false,
      "frames": ["198", 0],
      "rife_trt_model": ["169", 0]
    },
    "class_type": "AutoRifeTensorrt",
    "_meta": { "title": "LTX_WAN_168" }
  },
  "169": {
    "inputs": {
      "model": "PLACEHOLDER",
      "precision": "PLACEHOLDER",
      "resolution_profile": "PLACEHOLDER",
      "custom_config": ["170", 0]
    },
    "class_type": "AutoLoadRifeTensorrtModel",
    "_meta": { "title": "LTX_WAN_169" }
  },
  "170": {
    "inputs": {
      "min_dim": 0,
      "opt_dim": 0,
      "max_dim": 0
    },
    "class_type": "CustomResolutionConfig",
    "_meta": { "title": "LTX_WAN_170" }
  },
  "187": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["10", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "LTX_WAN_187" }
  },
  "188": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["12", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "LTX_WAN_188" }
  },
  "189": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["205", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "LTX_WAN_189" }
  },
  "190": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["82", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "LTX_WAN_190" }
  },
  "194": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["11", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "LTX_WAN_194" }
  },
  "197": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["7", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "LTX_WAN_197" }
  },
  "198": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["208", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "LTX_WAN_198" }
  },
  "205": {
    "inputs": {
      "steps": 0,
      "cfg": 0,
      "shift": 0,
      "seed": 0,
      "force_offload": true,
      "scheduler": "PLACEHOLDER",
      "riflex_freq_index": 0,
      "denoise_strength": 0,
      "batched_cfg": false,
      "rope_function": "comfy",
      "start_step": 0,
      "end_step": -1,
      "add_noise_to_samples": true,
      "model": ["221", 0],
      "image_embeds": ["234", 0],
      "text_embeds": ["213", 0],
      "samples": ["217", 0],
      "context_options": ["218", 0],
      "sigmas": ["228", 0]
    },
    "class_type": "WanVideoSampler",
    "_meta": { "title": "LTX_WAN_205" }
  },
  "206": {
    "inputs": {
      "model": "PLACEHOLDER",
      "base_precision": "bf16",
      "quantization": "fp8_e4m3fn_fast",
      "load_device": "offload_device",
      "attention_mode": "sageattn",
      "rms_norm_function": "default"
    },
    "class_type": "WanVideoModelLoader",
    "_meta": { "title": "LTX_WAN_206" }
  },
  "207": {
    "inputs": {
      "model_name": "PLACEHOLDER",
      "precision": "bf16",
      "use_cpu_cache": false,
      "verbose": true
    },
    "class_type": "WanVideoVAELoader",
    "_meta": { "title": "LTX_WAN_207" }
  },
  "208": {
    "inputs": {
      "enable_vae_tiling": false,
      "tile_x": 272,
      "tile_y": 272,
      "tile_stride_x": 144,
      "tile_stride_y": 128,
      "normalization": "default",
      "vae": ["207", 0],
      "samples": ["189", 0]
    },
    "class_type": "WanVideoDecode",
    "_meta": { "title": "LTX_WAN_208" }
  },
  "212": {
    "inputs": {
      "model_name": "PLACEHOLDER",
      "precision": "bf16",
      "load_device": "offload_device",
      "quantization": "disabled"
    },
    "class_type": "LoadWanVideoT5TextEncoder",
    "_meta": { "title": "LTX_WAN_212" }
  },
  "213": {
    "inputs": {
      "nag_scale": 0,
      "nag_tau": 0,
      "nag_alpha": 0,
      "inplace": true,
      "original_text_embeds": ["214", 0],
      "nag_text_embeds": ["215", 0]
    },
    "class_type": "WanVideoApplyNAG",
    "_meta": { "title": "LTX_WAN_213" }
  },
  "214": {
    "inputs": {
      "prompt": ["55", 0],
      "force_offload": true,
      "use_disk_cache": false,
      "device": "gpu",
      "t5": ["212", 0]
    },
    "class_type": "WanVideoTextEncodeSingle",
    "_meta": { "title": "LTX_WAN_214" }
  },
  "215": {
    "inputs": {
      "prompt": ["56", 0],
      "force_offload": true,
      "use_disk_cache": true,
      "device": "gpu",
      "t5": ["212", 0]
    },
    "class_type": "WanVideoTextEncodeSingle",
    "_meta": { "title": "LTX_WAN_215" }
  },
  "217": {
    "inputs": {
      "enable_vae_tiling": false,
      "tile_x": 272,
      "tile_y": 272,
      "tile_stride_x": 144,
      "tile_stride_y": 128,
      "noise_aug_strength": 0,
      "latent_strength": 1,
      "vae": ["207", 0],
      "image": ["187", 0]
    },
    "class_type": "WanVideoEncode",
    "_meta": { "title": "LTX_WAN_217" }
  },
  "218": {
    "inputs": {
      "context_schedule": "static_standard",
      "context_frames": 81,
      "context_stride": 4,
      "context_overlap": 32,
      "freenoise": true,
      "verbose": true,
      "fuse_method": "pyramid"
    },
    "class_type": "WanVideoContextOptions",
    "_meta": { "title": "LTX_WAN_218" }
  },
  "221": {
    "inputs": {
      "model": ["206", 0],
      "block_swap_args": ["222", 0]
    },
    "class_type": "WanVideoSetBlockSwap",
    "_meta": { "title": "LTX_WAN_221" }
  },
  "222": {
    "inputs": {
      "blocks_to_swap": 20,
      "offload_img_emb": false,
      "offload_txt_emb": false,
      "use_non_blocking": true,
      "vace_blocks_to_swap": 0,
      "prefetch_blocks": 0,
      "block_swap_debug": true
    },
    "class_type": "WanVideoBlockSwap",
    "_meta": { "title": "LTX_WAN_222" }
  },
  "228": {
    "inputs": {
      "sigmas": "PLACEHOLDER"
    },
    "class_type": "ManualSigmas",
    "_meta": { "title": "LTX_WAN_228" }
  },
  "234": {
    "inputs": {
      "disable_window_reinject": true,
      "propagate_x0": false,
      "propagate_x0_strength": 0.5,
      "image_embeds": ["241", 0]
    },
    "class_type": "WanVideoContextRefineMode",
    "_meta": { "title": "LTX_WAN_234" }
  },
  "241": {
    "inputs": {
      "num_frames": ["2", 0],
      "start_latent_strength": 1,
      "latent_samples": ["217", 0]
    },
    "class_type": "WanVideoRefineImageEmbeds",
    "_meta": { "title": "LTX_WAN_241" }
  }
}
