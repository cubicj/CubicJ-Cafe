import type { ComfyUIWorkflow } from '@/types'

export const LTX_WORKFLOW_TEMPLATE: ComfyUIWorkflow = {
  "1": {
    "inputs": { "vae_name": "PLACEHOLDER", "device": "main_device", "weight_dtype": "bf16" },
    "class_type": "VAELoaderKJ",
    "_meta": { "title": "LTX_01" }
  },
  "2": {
    "inputs": { "vae_name": "PLACEHOLDER", "device": "main_device", "weight_dtype": "bf16" },
    "class_type": "VAELoaderKJ",
    "_meta": { "title": "LTX_02" }
  },
  "5": {
    "inputs": { "text": "PLACEHOLDER", "clip": ["390", 0] },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "LTX_05" }
  },
  "6": {
    "inputs": { "text": "PLACEHOLDER", "clip": ["390", 0] },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "LTX_06" }
  },
  "13": {
    "inputs": { "frames_number": ["101", 0], "frame_rate": ["416", 2], "batch_size": 1, "audio_vae": ["1", 0] },
    "class_type": "LTXVEmptyLatentAudio",
    "_meta": { "title": "LTX_13" }
  },
  "15": {
    "inputs": { "video_latent": ["265", 0], "audio_latent": ["13", 0] },
    "class_type": "LTXVConcatAVLatent",
    "_meta": { "title": "LTX_15" }
  },
  "16": {
    "inputs": { "noise_seed": 0 },
    "class_type": "RandomNoise",
    "_meta": { "title": "LTX_16" }
  },
  "17": {
    "inputs": {
      "noise": ["16", 0],
      "guider": ["355", 0],
      "sampler": ["20", 0],
      "sigmas": ["403", 0],
      "latent_image": ["15", 0]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "LTX_17" }
  },
  "20": {
    "inputs": { "sampler_name": "PLACEHOLDER" },
    "class_type": "KSamplerSelect",
    "_meta": { "title": "LTX_20" }
  },
  "23": {
    "inputs": { "frame_rate": ["416", 1], "positive": ["5", 0], "negative": ["6", 0] },
    "class_type": "LTXVConditioning",
    "_meta": { "title": "LTX_23" }
  },
  "72": {
    "inputs": {
      "nag_scale": 0,
      "nag_alpha": 0,
      "nag_tau": 0,
      "inplace": true,
      "model": ["354", 0],
      "nag_cond_video": ["23", 1],
      "nag_cond_audio": ["23", 1]
    },
    "class_type": "LTX2_NAG",
    "_meta": { "title": "LTX_72" }
  },
  "86": {
    "inputs": { "megapixels": 0, "multiple_of": 0, "upscale_method": "PLACEHOLDER", "image": ["87", 0] },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "LTX_86" }
  },
  "87": {
    "inputs": { "image": "PLACEHOLDER" },
    "class_type": "LoadImage",
    "_meta": { "title": "LTX_87" }
  },
  "90": {
    "inputs": { "width": ["86", 1], "height": ["86", 2], "length": ["101", 0], "batch_size": 1 },
    "class_type": "EmptyLTXVLatentVideo",
    "_meta": { "title": "LTX_90" }
  },
  "101": {
    "inputs": { "expression": "a * b + 1", "a": ["416", 2], "b": ["103", 0] },
    "class_type": "MathExpression|pysssss",
    "_meta": { "title": "LTX_101" }
  },
  "103": {
    "inputs": { "value": 0 },
    "class_type": "PrimitiveInt",
    "_meta": { "title": "LTX_103" }
  },
  "265": {
    "inputs": {
      "num_images": "2",
      "num_images.strength_1": 1,
      "num_images.strength_2": 1,
      "num_images.index_1": 0,
      "num_images.index_2": ["261", 0],
      "vae": ["2", 0],
      "latent": ["90", 0],
      "num_images.image_1": ["86", 0],
      "num_images.image_2": ["264", 0]
    },
    "class_type": "LTXVImgToVideoInplaceKJ",
    "_meta": { "title": "LTX_265" }
  },
  "297": {
    "inputs": { "unet_name": "PLACEHOLDER", "weight_dtype": "PLACEHOLDER" },
    "class_type": "UNETLoader",
    "_meta": { "title": "LTX_297" }
  },
  "298": {
    "inputs": { "triton_kernels": true, "model": ["297", 0] },
    "class_type": "LTX2MemoryEfficientSageAttentionPatch",
    "_meta": { "title": "LTX_298" }
  },
  "321": {
    "inputs": { "samples": ["384", 1], "audio_vae": ["1", 0] },
    "class_type": "LTXVAudioVAEDecode",
    "_meta": { "title": "LTX_321" }
  },
  "322": {
    "inputs": { "resize_type": "PLACEHOLDER", "resize_type.scale": 0, "quality": "PLACEHOLDER", "images": ["444", 0] },
    "class_type": "RTXVideoSuperResolution",
    "_meta": { "title": "LTX_322" }
  },
  "325": {
    "inputs": { "empty_cache": true, "gc_collect": true, "unload_all_models": true, "any_input": ["345", 0] },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "LTX_325" }
  },
  "333": {
    "inputs": { "samples": ["384", 0], "vae": ["2", 0] },
    "class_type": "VAEDecode",
    "_meta": { "title": "LTX_333" }
  },
  "339": {
    "inputs": { "value": 0 },
    "class_type": "PrimitiveInt",
    "_meta": { "title": "LTX_339" }
  },
  "340": {
    "inputs": { "expression": "a * b", "a": ["416", 2], "b": ["339", 0] },
    "class_type": "MathExpression|pysssss",
    "_meta": { "title": "LTX_340" }
  },
  "345": {
    "inputs": {
      "frame_rate": ["340", 1],
      "loop_count": 0,
      "filename_prefix": "PLACEHOLDER",
      "format": "PLACEHOLDER",
      "pix_fmt": "PLACEHOLDER",
      "crf": 0,
      "save_metadata": false,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": false,
      "images": ["322", 0],
      "audio": ["321", 0]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": { "title": "LTX_345" }
  },
  "354": {
    "inputs": { "enable_fp16_accumulation": true, "model": ["298", 0] },
    "class_type": "ModelPatchTorchSettings",
    "_meta": { "title": "LTX_354" }
  },
  "355": {
    "inputs": { "cfg": 1, "model": ["439", 0], "positive": ["23", 0], "negative": ["23", 1] },
    "class_type": "CFGGuider",
    "_meta": { "title": "LTX_355" }
  },
  "373": {
    "inputs": { "empty_cache": true, "gc_collect": true, "unload_all_models": true, "any_input": ["17", 0] },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "LTX_373" }
  },
  "384": {
    "inputs": { "av_latent": ["409", 0] },
    "class_type": "LTXVSeparateAVLatent",
    "_meta": { "title": "LTX_384" }
  },
  "390": {
    "inputs": { "clip_name1": "PLACEHOLDER", "clip_name2": "PLACEHOLDER", "type": "ltxv", "device": "default" },
    "class_type": "DualCLIPLoader",
    "_meta": { "title": "LTX_390" }
  },
  "443": {
    "inputs": {
      "model": "PLACEHOLDER",
      "precision": "PLACEHOLDER",
      "resolution_profile": "PLACEHOLDER"
    },
    "class_type": "AutoLoadRifeTensorrtModel",
    "_meta": { "title": "LTX_443" }
  },
  "444": {
    "inputs": {
      "clear_cache_after_n_frames": 0,
      "multiplier": ["339", 0],
      "keep_model_loaded": false,
      "frames": ["437", 0],
      "rife_trt_model": ["443", 0]
    },
    "class_type": "AutoRifeTensorrt",
    "_meta": { "title": "LTX_444" }
  },
  "403": {
    "inputs": {
      "steps": 0,
      "max_shift": 0,
      "base_shift": 0,
      "stretch": true,
      "terminal": 0,
      "latent": ["15", 0]
    },
    "class_type": "LTXVScheduler",
    "_meta": { "title": "LTX_403" }
  },
  "406": {
    "inputs": {
      "noise": ["16", 0],
      "guider": ["407", 0],
      "sampler": ["20", 0],
      "sigmas": ["431", 0],
      "latent_image": ["419", 0]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "LTX_406" }
  },
  "407": {
    "inputs": { "cfg": 1, "model": ["440", 0], "positive": ["23", 0], "negative": ["23", 1] },
    "class_type": "CFGGuider",
    "_meta": { "title": "LTX_407" }
  },
  "409": {
    "inputs": { "empty_cache": true, "gc_collect": true, "unload_all_models": true, "any_input": ["406", 0] },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "LTX_409" }
  },
  "416": {
    "inputs": { "number_type": "integer", "number": 0 },
    "class_type": "Constant Number",
    "_meta": { "title": "LTX_416" }
  },
  "417": {
    "inputs": {
      "num_images": "2",
      "num_images.strength_1": 1,
      "num_images.strength_2": 1,
      "num_images.index_1": 0,
      "num_images.index_2": ["261", 0],
      "vae": ["2", 0],
      "latent": ["422", 0],
      "num_images.image_1": ["86", 0],
      "num_images.image_2": ["264", 0]
    },
    "class_type": "LTXVImgToVideoInplaceKJ",
    "_meta": { "title": "LTX_417" }
  },
  "418": {
    "inputs": { "av_latent": ["373", 0] },
    "class_type": "LTXVSeparateAVLatent",
    "_meta": { "title": "LTX_418" }
  },
  "419": {
    "inputs": { "video_latent": ["417", 0], "audio_latent": ["418", 1] },
    "class_type": "LTXVConcatAVLatent",
    "_meta": { "title": "LTX_419" }
  },
  "421": {
    "inputs": { "model_name": "PLACEHOLDER" },
    "class_type": "LatentUpscaleModelLoader",
    "_meta": { "title": "LTX_421" }
  },
  "422": {
    "inputs": { "samples": ["418", 0], "upscale_model": ["421", 0], "vae": ["2", 0] },
    "class_type": "LTXVLatentUpsampler",
    "_meta": { "title": "LTX_422" }
  },
  "431": {
    "inputs": { "sigmas": "PLACEHOLDER" },
    "class_type": "ManualSigmas",
    "_meta": { "title": "LTX_431" }
  },
  "433": {
    "inputs": { "lora_name": "PLACEHOLDER", "strength_model": 0, "model": ["72", 0] },
    "class_type": "LoraLoaderModelOnly",
    "_meta": { "title": "LTX_433" }
  },
  "437": {
    "inputs": {
      "method": "PLACEHOLDER",
      "strength": 0,
      "multithread": true,
      "image_target": ["333", 0],
      "image_ref": ["87", 0]
    },
    "class_type": "ColorMatchV2",
    "_meta": { "title": "LTX_437" }
  },
  "439": {
    "inputs": {
      "audio_normalization_factors": "PLACEHOLDER",
      "model": ["433", 0]
    },
    "class_type": "LTX2AudioLatentNormalizingSampling",
    "_meta": { "title": "LTX_439" }
  },
  "440": {
    "inputs": {
      "audio_normalization_factors": "PLACEHOLDER",
      "model": ["72", 0]
    },
    "class_type": "LTX2AudioLatentNormalizingSampling",
    "_meta": { "title": "LTX_440" }
  }
}
