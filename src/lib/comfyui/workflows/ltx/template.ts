export const LTX_WORKFLOW_TEMPLATE = {
  "1": {
    "inputs": {
      "vae_name": "PLACEHOLDER",
      "device": "main_device",
      "weight_dtype": "bf16"
    },
    "class_type": "VAELoaderKJ",
    "_meta": { "title": "LTX_1" }
  },
  "2": {
    "inputs": {
      "vae_name": "PLACEHOLDER",
      "device": "main_device",
      "weight_dtype": "bf16"
    },
    "class_type": "VAELoaderKJ",
    "_meta": { "title": "LTX_2" }
  },
  "5": {
    "inputs": {
      "text": "",
      "clip": ["47", 0]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "LTX_5" }
  },
  "6": {
    "inputs": {
      "text": "",
      "clip": ["47", 0]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "LTX_6" }
  },
  "10": {
    "inputs": {
      "value": ["101", 0]
    },
    "class_type": "PrimitiveInt",
    "_meta": { "title": "LTX_10" }
  },
  "11": {
    "inputs": {
      "value": 0
    },
    "class_type": "PrimitiveInt",
    "_meta": { "title": "LTX_11" }
  },
  "12": {
    "inputs": {
      "value": 0
    },
    "class_type": "PrimitiveFloat",
    "_meta": { "title": "LTX_12" }
  },
  "13": {
    "inputs": {
      "frames_number": ["10", 0],
      "frame_rate": ["11", 0],
      "batch_size": 1,
      "audio_vae": ["1", 0]
    },
    "class_type": "LTXVEmptyLatentAudio",
    "_meta": { "title": "LTX_13" }
  },
  "15": {
    "inputs": {
      "video_latent": ["265", 0],
      "audio_latent": ["13", 0]
    },
    "class_type": "LTXVConcatAVLatent",
    "_meta": { "title": "LTX_15" }
  },
  "16": {
    "inputs": {
      "noise_seed": 0
    },
    "class_type": "RandomNoise",
    "_meta": { "title": "LTX_16" }
  },
  "17": {
    "inputs": {
      "noise": ["16", 0],
      "guider": ["18", 0],
      "sampler": ["20", 0],
      "sigmas": ["304", 0],
      "latent_image": ["15", 0]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "LTX_17" }
  },
  "18": {
    "inputs": {
      "cfg": 0,
      "model": ["72", 0],
      "positive": ["23", 0],
      "negative": ["23", 1]
    },
    "class_type": "CFGGuider",
    "_meta": { "title": "LTX_18" }
  },
  "19": {
    "inputs": {
      "av_latent": ["82", 0]
    },
    "class_type": "LTXVSeparateAVLatent",
    "_meta": { "title": "LTX_19" }
  },
  "20": {
    "inputs": {
      "sampler_name": "PLACEHOLDER"
    },
    "class_type": "KSamplerSelect",
    "_meta": { "title": "LTX_20" }
  },
  "21": {
    "inputs": {
      "positive": ["23", 0],
      "negative": ["23", 1],
      "latent": ["19", 0]
    },
    "class_type": "LTXVCropGuides",
    "_meta": { "title": "LTX_21" }
  },
  "23": {
    "inputs": {
      "frame_rate": ["12", 0],
      "positive": ["59", 0],
      "negative": ["61", 0]
    },
    "class_type": "LTXVConditioning",
    "_meta": { "title": "LTX_23" }
  },
  "25": {
    "inputs": {
      "samples": ["21", 2],
      "upscale_model": ["63", 0],
      "vae": ["2", 0]
    },
    "class_type": "LTXVLatentUpsampler",
    "_meta": { "title": "LTX_25" }
  },
  "28": {
    "inputs": {
      "video_latent": ["25", 0],
      "audio_latent": ["19", 1]
    },
    "class_type": "LTXVConcatAVLatent",
    "_meta": { "title": "LTX_28" }
  },
  "32": {
    "inputs": {
      "noise_seed": 0
    },
    "class_type": "RandomNoise",
    "_meta": { "title": "LTX_32" }
  },
  "33": {
    "inputs": {
      "noise": ["32", 0],
      "guider": ["67", 0],
      "sampler": ["98", 0],
      "sigmas": ["303", 0],
      "latent_image": ["28", 0]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "LTX_33" }
  },
  "34": {
    "inputs": {
      "av_latent": ["62", 0]
    },
    "class_type": "LTXVSeparateAVLatent",
    "_meta": { "title": "LTX_34" }
  },
  "35": {
    "inputs": {
      "samples": ["34", 1],
      "audio_vae": ["1", 0]
    },
    "class_type": "LTXVAudioVAEDecode",
    "_meta": { "title": "LTX_35" }
  },
  "47": {
    "inputs": {
      "clip_name1": "PLACEHOLDER",
      "clip_name2": "PLACEHOLDER",
      "type": "ltxv"
    },
    "class_type": "DualCLIPLoaderGGUF",
    "_meta": { "title": "LTX_47" }
  },
  "59": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["5", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "LTX_59" }
  },
  "61": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["6", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "LTX_61" }
  },
  "62": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["33", 1]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "LTX_62" }
  },
  "63": {
    "inputs": {
      "model_name": "PLACEHOLDER"
    },
    "class_type": "LatentUpscaleModelLoader",
    "_meta": { "title": "LTX_63" }
  },
  "67": {
    "inputs": {
      "model": ["307", 0],
      "conditioning": ["21", 0]
    },
    "class_type": "BasicGuider",
    "_meta": { "title": "LTX_67" }
  },
  "72": {
    "inputs": {
      "nag_scale": 0,
      "nag_alpha": 0.25,
      "nag_tau": 2.5,
      "inplace": true,
      "model": ["268", 0],
      "nag_cond_video": ["23", 1],
      "nag_cond_audio": ["23", 1]
    },
    "class_type": "LTX2_NAG",
    "_meta": { "title": "LTX_72" }
  },
  "73": {
    "inputs": {
      "spatial_tiles": 0,
      "spatial_overlap": 0,
      "temporal_tile_length": 0,
      "temporal_overlap": 0,
      "last_frame_fix": false,
      "working_device": "auto",
      "working_dtype": "auto",
      "vae": ["2", 0],
      "latents": ["34", 0]
    },
    "class_type": "LTXVSpatioTemporalTiledVAEDecode",
    "_meta": { "title": "LTX_73" }
  },
  "74": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["300", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "LTX_74" }
  },
  "82": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["17", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "LTX_82" }
  },
  "86": {
    "inputs": {
      "megapixels": 0,
      "multiple_of": 0,
      "upscale_method": "PLACEHOLDER",
      "image": ["87", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "LTX_86" }
  },
  "87": {
    "inputs": {
      "image": "PLACEHOLDER"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "LTX_87" }
  },
  "90": {
    "inputs": {
      "width": ["86", 1],
      "height": ["86", 2],
      "length": ["10", 0],
      "batch_size": 1
    },
    "class_type": "EmptyLTXVLatentVideo",
    "_meta": { "title": "LTX_90" }
  },
  "98": {
    "inputs": {
      "sampler_name": "PLACEHOLDER"
    },
    "class_type": "KSamplerSelect",
    "_meta": { "title": "LTX_98" }
  },
  "101": {
    "inputs": {
      "expression": "a * b + 1",
      "a": ["11", 0],
      "b": ["103", 0]
    },
    "class_type": "MathExpression|pysssss",
    "_meta": { "title": "LTX_101" }
  },
  "103": {
    "inputs": {
      "value": 0
    },
    "class_type": "PrimitiveInt",
    "_meta": { "title": "LTX_103" }
  },
  "260": {
    "inputs": {
      "image": "PLACEHOLDER"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "LTX_260" }
  },
  "261": {
    "inputs": {
      "expression": "a - 1",
      "a": ["101", 0]
    },
    "class_type": "MathExpression|pysssss",
    "_meta": { "title": "LTX_261" }
  },
  "264": {
    "inputs": {
      "megapixels": 0,
      "multiple_of": 0,
      "upscale_method": "PLACEHOLDER",
      "image": ["260", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "LTX_264" }
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
      "num_images.image_1": ["266", 0],
      "num_images.image_2": ["267", 0]
    },
    "class_type": "LTXVImgToVideoInplaceKJ",
    "_meta": { "title": "LTX_265" }
  },
  "266": {
    "inputs": {
      "img_compression": 0,
      "image": ["86", 0]
    },
    "class_type": "LTXVPreprocess",
    "_meta": { "title": "LTX_266" }
  },
  "267": {
    "inputs": {
      "img_compression": 0,
      "image": ["264", 0]
    },
    "class_type": "LTXVPreprocess",
    "_meta": { "title": "LTX_267" }
  },
  "268": {
    "inputs": {
      "audio_normalization_factors": "PLACEHOLDER",
      "model": ["296", 0]
    },
    "class_type": "LTX2AudioLatentNormalizingSampling",
    "_meta": { "title": "LTX_268" }
  },
  "296": {
    "inputs": {
      "lora_name": "LTX\\Custom\\REDACTED_MODEL.safetensors",
      "strength_model": 1,
      "model": ["298", 0]
    },
    "class_type": "LoraLoaderModelOnly",
    "_meta": { "title": "LTX_296" }
  },
  "297": {
    "inputs": {
      "unet_name": "PLACEHOLDER",
      "weight_dtype": "PLACEHOLDER"
    },
    "class_type": "UNETLoader",
    "_meta": { "title": "LTX_297" }
  },
  "298": {
    "inputs": {
      "triton_kernels": true,
      "model": ["297", 0]
    },
    "class_type": "LTX2MemoryEfficientSageAttentionPatch",
    "_meta": { "title": "LTX_298" }
  },
  "300": {
    "inputs": {
      "frame_rate": ["12", 0],
      "loop_count": 0,
      "filename_prefix": "PLACEHOLDER",
      "format": "video/h264-mp4",
      "pix_fmt": "yuv420p",
      "crf": 20,
      "save_metadata": false,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": false,
      "images": ["301", 0],
      "audio": ["35", 0]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": { "title": "LTX_300" }
  },
  "301": {
    "inputs": {
      "resize_type": "PLACEHOLDER",
      "resize_type.scale": 0,
      "quality": "PLACEHOLDER",
      "images": ["302", 1]
    },
    "class_type": "RTXVideoSuperResolution",
    "_meta": { "title": "LTX_301" }
  },
  "302": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "image_pass": ["73", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "LTX_302" }
  },
  "303": {
    "inputs": {
      "sigmas": "PLACEHOLDER"
    },
    "class_type": "ManualSigmas",
    "_meta": { "title": "LTX_303" }
  },
  "304": {
    "inputs": {
      "sigmas": "PLACEHOLDER"
    },
    "class_type": "ManualSigmas",
    "_meta": { "title": "LTX_304" }
  },
  "306": {
    "inputs": {
      "audio_normalization_factors": "PLACEHOLDER",
      "model": ["296", 0]
    },
    "class_type": "LTX2AudioLatentNormalizingSampling",
    "_meta": { "title": "LTX_306" }
  },
  "307": {
    "inputs": {
      "nag_scale": 0,
      "nag_alpha": 0.25,
      "nag_tau": 2.5,
      "inplace": true,
      "model": ["306", 0],
      "nag_cond_video": ["23", 1],
      "nag_cond_audio": ["23", 1]
    },
    "class_type": "LTX2_NAG",
    "_meta": { "title": "LTX_307" }
  }
}
