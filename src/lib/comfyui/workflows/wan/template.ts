export const WAN_WORKFLOW_TEMPLATE = {
  "1": {
    "inputs": {
      "unet_name": "PLACEHOLDER",
      "weight_dtype": "default"
    },
    "class_type": "UNETLoader",
    "_meta": { "title": "WAN_1" }
  },
  "2": {
    "inputs": {
      "unet_name": "PLACEHOLDER",
      "weight_dtype": "default"
    },
    "class_type": "UNETLoader",
    "_meta": { "title": "WAN_2" }
  },
  "3": {
    "inputs": {
      "noise_seed": 0
    },
    "class_type": "RandomNoise",
    "_meta": { "title": "WAN_3" }
  },
  "4": {
    "inputs": {
      "model": ["20", 0],
      "conditioning": ["31", 0]
    },
    "class_type": "BasicGuider",
    "_meta": { "title": "WAN_4" }
  },
  "5": {
    "inputs": {
      "image": "PLACEHOLDER"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "WAN_5" }
  },
  "6": {
    "inputs": {
      "sage_attention": "auto",
      "allow_compile": false,
      "model": ["32", 0]
    },
    "class_type": "PathchSageAttentionKJ",
    "_meta": { "title": "WAN_6" }
  },
  "9": {
    "inputs": {
      "enable_fp16_accumulation": true,
      "model": ["12", 0]
    },
    "class_type": "ModelPatchTorchSettings",
    "_meta": { "title": "WAN_9" }
  },
  "10": {
    "inputs": {
      "text": ""
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "WAN_10" }
  },
  "11": {
    "inputs": {
      "image": "PLACEHOLDER"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "WAN_11" }
  },
  "12": {
    "inputs": {
      "sage_attention": "auto",
      "allow_compile": false,
      "model": ["33", 0]
    },
    "class_type": "PathchSageAttentionKJ",
    "_meta": { "title": "WAN_12" }
  },
  "13": {
    "inputs": {
      "clip_name": "PLACEHOLDER",
      "type": "wan",
      "device": "default"
    },
    "class_type": "CLIPLoader",
    "_meta": { "title": "WAN_13" }
  },
  "14": {
    "inputs": {
      "sampler_name": "PLACEHOLDER"
    },
    "class_type": "KSamplerSelect",
    "_meta": { "title": "WAN_14" }
  },
  "15": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["16", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "WAN_15" }
  },
  "16": {
    "inputs": {
      "noise": ["3", 0],
      "guider": ["4", 0],
      "sampler": ["14", 0],
      "sigmas": ["52", 1],
      "latent_image": ["31", 2]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "WAN_16" }
  },
  "17": {
    "inputs": {
      "model": ["19", 0],
      "conditioning": ["30", 0]
    },
    "class_type": "BasicGuider",
    "_meta": { "title": "WAN_17" }
  },
  "18": {
    "inputs": {
      "megapixels": 0,
      "multiple_of": 0,
      "upscale_method": "PLACEHOLDER",
      "image": ["11", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "WAN_18" }
  },
  "19": {
    "inputs": {
      "nag_scale": 0,
      "nag_alpha": 0,
      "nag_tau": 0,
      "input_type": "default",
      "model": ["66", 0],
      "conditioning": ["28", 0]
    },
    "class_type": "WanVideoNAG",
    "_meta": { "title": "WAN_19" }
  },
  "20": {
    "inputs": {
      "nag_scale": 0,
      "nag_alpha": 0,
      "nag_tau": 0,
      "input_type": "default",
      "model": ["65", 0],
      "conditioning": ["24", 0]
    },
    "class_type": "WanVideoNAG",
    "_meta": { "title": "WAN_20" }
  },
  "22": {
    "inputs": {
      "enable_fp16_accumulation": true,
      "model": ["6", 0]
    },
    "class_type": "ModelPatchTorchSettings",
    "_meta": { "title": "WAN_22" }
  },
  "23": {
    "inputs": {
      "text": ["10", 0],
      "clip": ["65", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "WAN_23" }
  },
  "24": {
    "inputs": {
      "text": ["41", 0],
      "clip": ["65", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "WAN_24" }
  },
  "25": {
    "inputs": {
      "megapixels": 0,
      "multiple_of": 0,
      "upscale_method": "PLACEHOLDER",
      "image": ["5", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "WAN_25" }
  },
  "26": {
    "inputs": {
      "vae_name": "PLACEHOLDER"
    },
    "class_type": "VAELoader",
    "_meta": { "title": "WAN_26" }
  },
  "27": {
    "inputs": {
      "text": ["10", 0],
      "clip": ["66", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "WAN_27" }
  },
  "28": {
    "inputs": {
      "text": ["41", 0],
      "clip": ["66", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "WAN_28" }
  },
  "30": {
    "inputs": {
      "width": ["25", 1],
      "height": ["25", 2],
      "length": 0,
      "batch_size": 1,
      "positive": ["27", 0],
      "negative": ["28", 0],
      "vae": ["26", 0],
      "start_image": ["25", 0],
      "end_image": ["18", 0]
    },
    "class_type": "WanFirstLastFrameToVideo",
    "_meta": { "title": "WAN_30" }
  },
  "31": {
    "inputs": {
      "width": ["25", 1],
      "height": ["25", 2],
      "length": 0,
      "batch_size": 1,
      "positive": ["23", 0],
      "negative": ["24", 0],
      "vae": ["26", 0],
      "start_image": ["25", 0],
      "end_image": ["18", 0]
    },
    "class_type": "WanFirstLastFrameToVideo",
    "_meta": { "title": "WAN_31" }
  },
  "32": {
    "inputs": {
      "shift": 0,
      "model": ["1", 0]
    },
    "class_type": "ModelSamplingSD3",
    "_meta": { "title": "WAN_32" }
  },
  "33": {
    "inputs": {
      "shift": 0,
      "model": ["2", 0]
    },
    "class_type": "ModelSamplingSD3",
    "_meta": { "title": "WAN_33" }
  },
  "36": {
    "inputs": {
      "noise": ["40", 0],
      "guider": ["17", 0],
      "sampler": ["14", 0],
      "sigmas": ["53", 1],
      "latent_image": ["15", 0]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "WAN_36" }
  },
  "38": {
    "inputs": {
      "samples": ["39", 0],
      "vae": ["26", 0]
    },
    "class_type": "VAEDecode",
    "_meta": { "title": "WAN_38" }
  },
  "39": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["36", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "WAN_39" }
  },
  "40": {
    "inputs": {},
    "class_type": "DisableNoise",
    "_meta": { "title": "WAN_40" }
  },
  "41": {
    "inputs": {
      "text": ""
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "WAN_41" }
  },
  "42": {
    "inputs": {
      "resize_type": "PLACEHOLDER",
      "resize_type.scale": 0,
      "quality": "PLACEHOLDER",
      "images": ["45", 1]
    },
    "class_type": "RTXVideoSuperResolution",
    "_meta": { "title": "WAN_42" }
  },
  "45": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "image_pass": ["62", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "WAN_45" }
  },
  "52": {
    "inputs": {
      "steps": 0,
      "start_y": 0,
      "end_y": 0,
      "curve_data": "PLACEHOLDER",
      "preset_selector": "PLACEHOLDER"
    },
    "class_type": "CustomSplineSigma",
    "_meta": { "title": "WAN_52" }
  },
  "53": {
    "inputs": {
      "steps": 0,
      "start_y": 0,
      "end_y": 0,
      "curve_data": "PLACEHOLDER",
      "preset_selector": "PLACEHOLDER"
    },
    "class_type": "CustomSplineSigma",
    "_meta": { "title": "WAN_53" }
  },
  "62": {
    "inputs": {
      "ckpt_name": "PLACEHOLDER",
      "clear_cache_after_n_frames": 0,
      "multiplier": 0,
      "frames": ["38", 0]
    },
    "class_type": "GMFSS Fortuna VFI",
    "_meta": { "title": "WAN_62" }
  },
  "63": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["64", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "WAN_63" }
  },
  "64": {
    "inputs": {
      "frame_rate": 0,
      "loop_count": 0,
      "filename_prefix": "PLACEHOLDER",
      "format": "PLACEHOLDER",
      "pix_fmt": "PLACEHOLDER",
      "crf": 0,
      "save_metadata": false,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": false,
      "images": ["42", 0]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": { "title": "WAN_64" }
  },
  "65": {
    "inputs": {
      "PowerLoraLoaderHeaderWidget": {
        "type": "PowerLoraLoaderHeaderWidget"
      },
      "lora_1": {
        "on": true,
        "lora": "PLACEHOLDER",
        "strength": 1
      },
      "➕ Add Lora": "",
      "model": ["22", 0],
      "clip": ["13", 0]
    },
    "class_type": "Power Lora Loader (rgthree)",
    "_meta": { "title": "WAN_65" }
  },
  "66": {
    "inputs": {
      "PowerLoraLoaderHeaderWidget": {
        "type": "PowerLoraLoaderHeaderWidget"
      },
      "lora_1": {
        "on": true,
        "lora": "PLACEHOLDER",
        "strength": 1
      },
      "➕ Add Lora": "",
      "model": ["9", 0],
      "clip": ["13", 0]
    },
    "class_type": "Power Lora Loader (rgthree)",
    "_meta": { "title": "WAN_66" }
  }
}
