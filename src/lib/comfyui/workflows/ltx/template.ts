export const LTX_WORKFLOW_TEMPLATE = {
  "1": {
    "inputs": {
      "vae_name": "REDACTED_MODEL.safetensors",
      "device": "main_device",
      "weight_dtype": "bf16"
    },
    "class_type": "VAELoaderKJ",
    "_meta": {
      "title": "VAELoader KJ"
    }
  },
  "2": {
    "inputs": {
      "vae_name": "REDACTED_MODEL.safetensors",
      "device": "main_device",
      "weight_dtype": "bf16"
    },
    "class_type": "VAELoaderKJ",
    "_meta": {
      "title": "VAELoader KJ"
    }
  },
  "3": {
    "inputs": {
      "unet_name": "REDACTED_MODEL.gguf"
    },
    "class_type": "UnetLoaderGGUF",
    "_meta": {
      "title": "Unet Loader (GGUF)"
    }
  },
  "5": {
    "inputs": {
      "text": "",
      "clip": [
        "47",
        0
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "6": {
    "inputs": {
      "text": "worst quality, inconsistent motion, blurry, jittery, distorted, watermark, text, subtitles, morphing, flickering, artifacts",
      "clip": [
        "47",
        0
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "10": {
    "inputs": {
      "value": [
        "101",
        0
      ]
    },
    "class_type": "PrimitiveInt",
    "_meta": {
      "title": "Length"
    }
  },
  "11": {
    "inputs": {
      "value": 24
    },
    "class_type": "PrimitiveInt",
    "_meta": {
      "title": "Frame Rate(int)"
    }
  },
  "12": {
    "inputs": {
      "value": 24
    },
    "class_type": "PrimitiveFloat",
    "_meta": {
      "title": "Frame Rate(float)"
    }
  },
  "13": {
    "inputs": {
      "frames_number": [
        "10",
        0
      ],
      "frame_rate": [
        "11",
        0
      ],
      "batch_size": 1,
      "audio_vae": [
        "1",
        0
      ]
    },
    "class_type": "LTXVEmptyLatentAudio",
    "_meta": {
      "title": "LTXV Empty Latent Audio"
    }
  },
  "15": {
    "inputs": {
      "video_latent": [
        "96",
        0
      ],
      "audio_latent": [
        "13",
        0
      ]
    },
    "class_type": "LTXVConcatAVLatent",
    "_meta": {
      "title": "LTXVConcatAVLatent"
    }
  },
  "16": {
    "inputs": {
      "noise_seed": 407322233314947
    },
    "class_type": "RandomNoise",
    "_meta": {
      "title": "RandomNoise"
    }
  },
  "17": {
    "inputs": {
      "noise": [
        "16",
        0
      ],
      "guider": [
        "18",
        0
      ],
      "sampler": [
        "20",
        0
      ],
      "sigmas": [
        "22",
        0
      ],
      "latent_image": [
        "15",
        0
      ]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": {
      "title": "SamplerCustomAdvanced"
    }
  },
  "18": {
    "inputs": {
      "cfg": 4,
      "model": [
        "72",
        0
      ],
      "positive": [
        "23",
        0
      ],
      "negative": [
        "23",
        1
      ]
    },
    "class_type": "CFGGuider",
    "_meta": {
      "title": "CFGGuider"
    }
  },
  "19": {
    "inputs": {
      "av_latent": [
        "82",
        0
      ]
    },
    "class_type": "LTXVSeparateAVLatent",
    "_meta": {
      "title": "LTXVSeparateAVLatent"
    }
  },
  "20": {
    "inputs": {
      "sampler_name": "test_sampler"
    },
    "class_type": "KSamplerSelect",
    "_meta": {
      "title": "KSamplerSelect"
    }
  },
  "21": {
    "inputs": {
      "positive": [
        "23",
        0
      ],
      "negative": [
        "23",
        1
      ],
      "latent": [
        "19",
        0
      ]
    },
    "class_type": "LTXVCropGuides",
    "_meta": {
      "title": "LTXVCropGuides"
    }
  },
  "22": {
    "inputs": {
      "steps": 12,
      "max_shift": 2.05,
      "base_shift": 0.95,
      "stretch": true,
      "terminal": 0.1,
      "latent": [
        "15",
        0
      ]
    },
    "class_type": "LTXVScheduler",
    "_meta": {
      "title": "LTXVScheduler"
    }
  },
  "23": {
    "inputs": {
      "frame_rate": [
        "12",
        0
      ],
      "positive": [
        "59",
        0
      ],
      "negative": [
        "61",
        0
      ]
    },
    "class_type": "LTXVConditioning",
    "_meta": {
      "title": "LTXVConditioning"
    }
  },
  "25": {
    "inputs": {
      "samples": [
        "21",
        2
      ],
      "upscale_model": [
        "63",
        0
      ],
      "vae": [
        "2",
        0
      ]
    },
    "class_type": "LTXVLatentUpsampler",
    "_meta": {
      "title": "spatial"
    }
  },
  "27": {
    "inputs": {
      "lora_name": "LTX\\REDACTED_MODEL.safetensors",
      "strength_model": 0.6,
      "model": [
        "3",
        0
      ]
    },
    "class_type": "LoraLoaderModelOnly",
    "_meta": {
      "title": "Load LoRA"
    }
  },
  "28": {
    "inputs": {
      "video_latent": [
        "25",
        0
      ],
      "audio_latent": [
        "19",
        1
      ]
    },
    "class_type": "LTXVConcatAVLatent",
    "_meta": {
      "title": "LTXVConcatAVLatent"
    }
  },
  "30": {
    "inputs": {
      "sigmas": "0.85, 0.725, 0.4219, 0.0"
    },
    "class_type": "ManualSigmas",
    "_meta": {
      "title": "ManualSigmas"
    }
  },
  "32": {
    "inputs": {
      "noise_seed": 809542877813341
    },
    "class_type": "RandomNoise",
    "_meta": {
      "title": "RandomNoise"
    }
  },
  "33": {
    "inputs": {
      "noise": [
        "32",
        0
      ],
      "guider": [
        "67",
        0
      ],
      "sampler": [
        "98",
        0
      ],
      "sigmas": [
        "30",
        0
      ],
      "latent_image": [
        "28",
        0
      ]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": {
      "title": "SamplerCustomAdvanced"
    }
  },
  "34": {
    "inputs": {
      "av_latent": [
        "62",
        0
      ]
    },
    "class_type": "LTXVSeparateAVLatent",
    "_meta": {
      "title": "LTXVSeparateAVLatent"
    }
  },
  "35": {
    "inputs": {
      "samples": [
        "34",
        1
      ],
      "audio_vae": [
        "1",
        0
      ]
    },
    "class_type": "LTXVAudioVAEDecode",
    "_meta": {
      "title": "LTXV Audio VAE Decode"
    }
  },
  "36": {
    "inputs": {
      "fps": [
        "12",
        0
      ],
      "images": [
        "73",
        0
      ],
      "audio": [
        "35",
        0
      ]
    },
    "class_type": "CreateVideo",
    "_meta": {
      "title": "Create Video"
    }
  },
  "38": {
    "inputs": {
      "filename_prefix": "LTX/ComfyUI_LTX2.3",
      "format": "mp4",
      "codec": "h264",
      "video": [
        "74",
        0
      ]
    },
    "class_type": "SaveVideo",
    "_meta": {
      "title": "Save Video"
    }
  },
  "47": {
    "inputs": {
      "clip_name1": "REDACTED_MODEL.gguf",
      "clip_name2": "REDACTED_MODEL.safetensors",
      "type": "ltxv"
    },
    "class_type": "DualCLIPLoaderGGUF",
    "_meta": {
      "title": "DualCLIPLoader (GGUF)"
    }
  },
  "59": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": [
        "5",
        0
      ]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "61": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": [
        "6",
        0
      ]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "62": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": [
        "33",
        1
      ]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "63": {
    "inputs": {
      "model_name": "REDACTED_MODEL.safetensors"
    },
    "class_type": "LatentUpscaleModelLoader",
    "_meta": {
      "title": "Load Latent Upscale Model"
    }
  },
  "67": {
    "inputs": {
      "model": [
        "27",
        0
      ],
      "conditioning": [
        "21",
        0
      ]
    },
    "class_type": "BasicGuider",
    "_meta": {
      "title": "BasicGuider"
    }
  },
  "70": {
    "inputs": {
      "preview_rate": 8,
      "model": [
        "81",
        0
      ],
      "latent_upscale_model": [
        "63",
        0
      ],
      "vae": [
        "71",
        0
      ]
    },
    "class_type": "LTX2SamplingPreviewOverride",
    "_meta": {
      "title": "LTX2 Sampling Preview Override"
    }
  },
  "71": {
    "inputs": {
      "vae_name": "REDACTED_MODEL.safetensors",
      "device": "main_device",
      "weight_dtype": "bf16"
    },
    "class_type": "VAELoaderKJ",
    "_meta": {
      "title": "VAELoader KJ"
    }
  },
  "72": {
    "inputs": {
      "nag_scale": 11,
      "nag_alpha": 0.25,
      "nag_tau": 2.5,
      "inplace": true,
      "model": [
        "70",
        0
      ],
      "nag_cond_video": [
        "23",
        1
      ]
    },
    "class_type": "LTX2_NAG",
    "_meta": {
      "title": "LTX2 NAG"
    }
  },
  "73": {
    "inputs": {
      "spatial_tiles": 2,
      "spatial_overlap": 1,
      "temporal_tile_length": 32,
      "temporal_overlap": 2,
      "last_frame_fix": false,
      "working_device": "auto",
      "working_dtype": "auto",
      "vae": [
        "2",
        0
      ],
      "latents": [
        "34",
        0
      ]
    },
    "class_type": "LTXVSpatioTemporalTiledVAEDecode",
    "_meta": {
      "title": "\uD83C\uDD5B\uD83C\uDD63\uD83C\uDD67 LTXV Spatio Temporal Tiled VAE Decode"
    }
  },
  "74": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": [
        "36",
        0
      ]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "81": {
    "inputs": {
      "lora_name": "LTX\\REDACTED_MODEL.safetensors",
      "strength_model": 0.25,
      "model": [
        "3",
        0
      ]
    },
    "class_type": "LoraLoaderModelOnly",
    "_meta": {
      "title": "Load LoRA"
    }
  },
  "82": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": [
        "17",
        0
      ]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "86": {
    "inputs": {
      "megapixels": 0.26,
      "multiple_of": 32,
      "upscale_method": "lanczos",
      "image": [
        "87",
        0
      ]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": {
      "title": "Resize Image (Megapixels + Alignment)"
    }
  },
  "87": {
    "inputs": {
      "image": "ComfyUI_Sample_00589_.png"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "Load Image"
    }
  },
  "90": {
    "inputs": {
      "width": [
        "86",
        1
      ],
      "height": [
        "86",
        2
      ],
      "length": [
        "10",
        0
      ],
      "batch_size": 1
    },
    "class_type": "EmptyLTXVLatentVideo",
    "_meta": {
      "title": "EmptyLTXVLatentVideo"
    }
  },
  "96": {
    "inputs": {
      "num_images": "2",
      "num_images.strength_1": 1,
      "num_images.strength_2": 0.98,
      "num_images.index_1": 0,
      "num_images.index_2": 1,
      "vae": [
        "2",
        0
      ],
      "latent": [
        "90",
        0
      ],
      "num_images.image_1": [
        "86",
        0
      ],
      "num_images.image_2": [
        "86",
        0
      ]
    },
    "class_type": "LTXVImgToVideoInplaceKJ",
    "_meta": {
      "title": "LTXVImgToVideoInplaceKJ"
    }
  },
  "98": {
    "inputs": {
      "sampler_name": "test_sampler_ode"
    },
    "class_type": "KSamplerSelect",
    "_meta": {
      "title": "KSamplerSelect"
    }
  },
  "101": {
    "inputs": {
      "expression": "a * b + 1",
      "a": [
        "11",
        0
      ],
      "b": [
        "103",
        0
      ]
    },
    "class_type": "MathExpression|pysssss",
    "_meta": {
      "title": "Math Expression \uD83D\uDC0D"
    }
  },
  "103": {
    "inputs": {
      "value": 5
    },
    "class_type": "PrimitiveInt",
    "_meta": {
      "title": "Second"
    }
  }
}
