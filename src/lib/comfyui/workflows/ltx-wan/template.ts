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
  "5": {
    "inputs": {
      "purge_cache": true,
      "purge_models": true,
      "anything": ["10", 0]
    },
    "class_type": "LayerUtility: PurgeVRAM",
    "_meta": { "title": "LTX_WAN_5" }
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
  "15": {
    "inputs": {
      "purge_cache": true,
      "purge_models": true,
      "anything": ["12", 0]
    },
    "class_type": "LayerUtility: PurgeVRAM",
    "_meta": { "title": "LTX_WAN_15" }
  },
  "16": {
    "inputs": {
      "av_latent": ["15", 0]
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
  "43": {
    "inputs": {
      "sage_attention": "auto",
      "allow_compile": false,
      "model": ["59", 0]
    },
    "class_type": "PathchSageAttentionKJ",
    "_meta": { "title": "LTX_WAN_43" }
  },
  "51": {
    "inputs": {
      "text": ["55", 0],
      "clip": ["72", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "LTX_WAN_51" }
  },
  "52": {
    "inputs": {
      "text": ["56", 0],
      "clip": ["72", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "LTX_WAN_52" }
  },
  "53": {
    "inputs": {
      "width": ["25", 1],
      "height": ["25", 2],
      "length": ["2", 0],
      "batch_size": 1,
      "positive": ["51", 0],
      "negative": ["52", 0],
      "vae": ["74", 0],
      "start_image": ["91", 0],
      "end_image": ["92", 0]
    },
    "class_type": "WanFirstLastFrameToVideo",
    "_meta": { "title": "LTX_WAN_53" }
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
  "59": {
    "inputs": {
      "shift": 0,
      "model": ["75", 0]
    },
    "class_type": "ModelSamplingSD3",
    "_meta": { "title": "LTX_WAN_59" }
  },
  "60": {
    "inputs": {
      "samples": ["78", 0],
      "vae": ["74", 0]
    },
    "class_type": "VAEDecode",
    "_meta": { "title": "LTX_WAN_60" }
  },
  "64": {
    "inputs": {
      "purge_cache": true,
      "purge_models": true,
      "anything": ["82", 0]
    },
    "class_type": "LayerUtility: PurgeVRAM",
    "_meta": { "title": "LTX_WAN_64" }
  },
  "66": {
    "inputs": {
      "model": ["77", 0],
      "conditioning": ["53", 0]
    },
    "class_type": "BasicGuider",
    "_meta": { "title": "LTX_WAN_66" }
  },
  "67": {
    "inputs": {
      "noise": ["95", 0],
      "guider": ["66", 0],
      "sampler": ["166", 0],
      "sigmas": ["154", 0],
      "latent_image": ["93", 0]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "LTX_WAN_67" }
  },
  "72": {
    "inputs": {
      "PowerLoraLoaderHeaderWidget": { "type": "PowerLoraLoaderHeaderWidget" },
      "lora_1": { "on": false, "lora": "PLACEHOLDER", "strength": 0 },
      "lora_2": { "on": false, "lora": "PLACEHOLDER", "strength": 0 },
      "lora_3": { "on": false, "lora": "PLACEHOLDER", "strength": 0 },
      "➕ Add Lora": "",
      "model": ["43", 0],
      "clip": ["73", 0]
    },
    "class_type": "Power Lora Loader (rgthree)",
    "_meta": { "title": "LTX_WAN_72" }
  },
  "73": {
    "inputs": {
      "clip_name": "PLACEHOLDER",
      "type": "wan",
      "device": "default"
    },
    "class_type": "CLIPLoader",
    "_meta": { "title": "LTX_WAN_73" }
  },
  "74": {
    "inputs": {
      "vae_name": "PLACEHOLDER"
    },
    "class_type": "VAELoader",
    "_meta": { "title": "LTX_WAN_74" }
  },
  "75": {
    "inputs": {
      "unet_name": "PLACEHOLDER",
      "weight_dtype": "PLACEHOLDER"
    },
    "class_type": "UNETLoader",
    "_meta": { "title": "LTX_WAN_75" }
  },
  "77": {
    "inputs": {
      "nag_scale": 0,
      "nag_alpha": 0,
      "nag_tau": 0,
      "input_type": "default",
      "model": ["72", 0],
      "conditioning": ["52", 0]
    },
    "class_type": "WanVideoNAG",
    "_meta": { "title": "LTX_WAN_77" }
  },
  "78": {
    "inputs": {
      "purge_cache": true,
      "purge_models": true,
      "anything": ["67", 0]
    },
    "class_type": "LayerUtility: PurgeVRAM",
    "_meta": { "title": "LTX_WAN_78" }
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
      "audio": ["11", 0]
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
  "91": {
    "inputs": {
      "batch_index": 0,
      "length": 1,
      "image": ["5", 0]
    },
    "class_type": "ImageFromBatch",
    "_meta": { "title": "LTX_WAN_91" }
  },
  "92": {
    "inputs": {
      "batch_index": ["31", 0],
      "length": 1,
      "image": ["5", 0]
    },
    "class_type": "ImageFromBatch",
    "_meta": { "title": "LTX_WAN_92" }
  },
  "93": {
    "inputs": {
      "pixels": ["5", 0],
      "vae": ["74", 0]
    },
    "class_type": "VAEEncode",
    "_meta": { "title": "LTX_WAN_93" }
  },
  "95": {
    "inputs": {
      "noise_seed": 0
    },
    "class_type": "RandomNoise",
    "_meta": { "title": "LTX_WAN_95" }
  },
  "154": {
    "inputs": {
      "start": 0,
      "end": 0,
      "sigmas": ["160", 0]
    },
    "class_type": "Sigmas Rescale",
    "_meta": { "title": "LTX_WAN_154" }
  },
  "157": {
    "inputs": {
      "audio_normalization_factors": "PLACEHOLDER",
      "model": ["23", 0]
    },
    "class_type": "LTX2AudioLatentNormalizingSampling",
    "_meta": { "title": "LTX_WAN_157" }
  },
  "160": {
    "inputs": {
      "scheduler": "PLACEHOLDER",
      "steps": 0,
      "denoise": 0,
      "model": ["77", 0]
    },
    "class_type": "BasicScheduler",
    "_meta": { "title": "LTX_WAN_160" }
  },
  "161": {
    "inputs": {
      "text": "PLACEHOLDER"
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "LTX_WAN_161" }
  },
  "166": {
    "inputs": {
      "eta": 0,
      "sampler_name": "PLACEHOLDER",
      "seed": 0,
      "bongmath": false
    },
    "class_type": "ClownSampler_Beta",
    "_meta": { "title": "LTX_WAN_166" }
  },
  "168": {
    "inputs": {
      "clear_cache_after_n_frames": 0,
      "multiplier": ["34", 0],
      "keep_model_loaded": false,
      "frames": ["60", 0],
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
  }
}
