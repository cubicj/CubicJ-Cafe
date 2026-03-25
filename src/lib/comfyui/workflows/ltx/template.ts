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
        "265",
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
      "noise_seed": 76216652269565
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
        "304",
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
      "cfg": 3,
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
  "32": {
    "inputs": {
      "noise_seed": 175965402432608
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
        "303",
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
        "307",
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
  "72": {
    "inputs": {
      "nag_scale": 9,
      "nag_alpha": 0.25,
      "nag_tau": 2.5,
      "inplace": true,
      "model": [
        "268",
        0
      ],
      "nag_cond_video": [
        "23",
        1
      ],
      "nag_cond_audio": [
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
      "spatial_overlap": 4,
      "temporal_tile_length": 32,
      "temporal_overlap": 4,
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
      "title": "🅛🅣🅧 LTXV Spatio Temporal Tiled VAE Decode"
    }
  },
  "74": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": [
        "300",
        0
      ]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
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
      "megapixels": 0.3,
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
      "image": "example.png"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "Start Image"
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
  "98": {
    "inputs": {
      "sampler_name": "test_sampler"
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
      "title": "Math Expression 🐍"
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
  },
  "260": {
    "inputs": {
      "image": "example.png"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "End Image"
    }
  },
  "261": {
    "inputs": {
      "expression": "a - 1",
      "a": [
        "101",
        0
      ]
    },
    "class_type": "MathExpression|pysssss",
    "_meta": {
      "title": "Math Expression 🐍"
    }
  },
  "264": {
    "inputs": {
      "megapixels": 0.3,
      "multiple_of": 32,
      "upscale_method": "lanczos",
      "image": [
        "260",
        0
      ]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": {
      "title": "Resize Image (Megapixels + Alignment)"
    }
  },
  "265": {
    "inputs": {
      "num_images": "2",
      "num_images.strength_1": 1,
      "num_images.strength_2": 1,
      "num_images.index_1": 0,
      "num_images.index_2": [
        "261",
        0
      ],
      "vae": [
        "2",
        0
      ],
      "latent": [
        "90",
        0
      ],
      "num_images.image_1": [
        "266",
        0
      ],
      "num_images.image_2": [
        "267",
        0
      ]
    },
    "class_type": "LTXVImgToVideoInplaceKJ",
    "_meta": {
      "title": "LTXVImgToVideoInplaceKJ"
    }
  },
  "266": {
    "inputs": {
      "img_compression": 18,
      "image": [
        "86",
        0
      ]
    },
    "class_type": "LTXVPreprocess",
    "_meta": {
      "title": "LTXVPreprocess"
    }
  },
  "267": {
    "inputs": {
      "img_compression": 18,
      "image": [
        "264",
        0
      ]
    },
    "class_type": "LTXVPreprocess",
    "_meta": {
      "title": "LTXVPreprocess"
    }
  },
  "268": {
    "inputs": {
      "audio_normalization_factors": "1,1,1",
      "model": [
        "296",
        0
      ]
    },
    "class_type": "LTX2AudioLatentNormalizingSampling",
    "_meta": {
      "title": "LTX2 Audio Latent Normalizing Sampling"
    }
  },
  "296": {
    "inputs": {
      "lora_name": "LTX\\Custom\\REDACTED_MODEL.safetensors",
      "strength_model": 1,
      "model": [
        "298",
        0
      ]
    },
    "class_type": "LoraLoaderModelOnly",
    "_meta": {
      "title": "Load LoRA"
    }
  },
  "297": {
    "inputs": {
      "unet_name": "REDACTED_MODEL.safetensors",
      "weight_dtype": "default"
    },
    "class_type": "UNETLoader",
    "_meta": {
      "title": "Load Diffusion Model"
    }
  },
  "298": {
    "inputs": {
      "triton_kernels": true,
      "model": [
        "297",
        0
      ]
    },
    "class_type": "LTX2MemoryEfficientSageAttentionPatch",
    "_meta": {
      "title": "LTX2 Mem Eff Sage Attention Patch"
    }
  },
  "300": {
    "inputs": {
      "frame_rate": [
        "12",
        0
      ],
      "loop_count": 0,
      "filename_prefix": "LTX\\ComfyUI_LTX2.3",
      "format": "video/h264-mp4",
      "pix_fmt": "yuv420p",
      "crf": 20,
      "save_metadata": false,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": false,
      "images": [
        "301",
        0
      ],
      "audio": [
        "35",
        0
      ]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": {
      "title": "Video Combine 🎥🅥🅗🅢"
    }
  },
  "301": {
    "inputs": {
      "resize_type": "scale by multiplier",
      "resize_type.scale": 2,
      "quality": "ULTRA",
      "images": [
        "302",
        1
      ]
    },
    "class_type": "RTXVideoSuperResolution",
    "_meta": {
      "title": "RTX Video Super Resolution"
    }
  },
  "302": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "image_pass": [
        "73",
        0
      ]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "303": {
    "inputs": {
      "sigmas": "0.85, 0.725, 0.4219, 0.0"
    },
    "class_type": "ManualSigmas",
    "_meta": {
      "title": "ManualSigmas"
    }
  },
  "304": {
    "inputs": {
      "sigmas": "1.0, 0.9, 0.8, 0.7, 0.975, 0.6, 0.725, 0.3, 0.0"
    },
    "class_type": "ManualSigmas",
    "_meta": {
      "title": "ManualSigmas"
    }
  },
  "306": {
    "inputs": {
      "audio_normalization_factors": "1,1,1",
      "model": [
        "296",
        0
      ]
    },
    "class_type": "LTX2AudioLatentNormalizingSampling",
    "_meta": {
      "title": "LTX2 Audio Latent Normalizing Sampling"
    }
  },
  "307": {
    "inputs": {
      "nag_scale": 9,
      "nag_alpha": 0.25,
      "nag_tau": 2.5,
      "inplace": true,
      "model": [
        "306",
        0
      ],
      "nag_cond_video": [
        "23",
        1
      ],
      "nag_cond_audio": [
        "23",
        1
      ]
    },
    "class_type": "LTX2_NAG",
    "_meta": {
      "title": "LTX2 NAG"
    }
  }
}
