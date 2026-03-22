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
      "text": "worst quality, inconsistent motion, blurry, jittery, distorted, watermark, text, subtitles, caption, overlay effects, static image, morphing, flickering, artifacts",
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
      "noise_seed": 759646541118806
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
      "cfg": 2,
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
  "32": {
    "inputs": {
      "noise_seed": 1095007059472467
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
        "259",
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
  "72": {
    "inputs": {
      "nag_scale": 7,
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
      "megapixels": 0.15,
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
      "value": 8
    },
    "class_type": "PrimitiveInt",
    "_meta": {
      "title": "Second"
    }
  },
  "257": {
    "inputs": {
      "steps": 2,
      "start_y": 0.85,
      "end_y": 0.84,
      "curve_data": "{\"control_points\":[{\"x\":0,\"y\":1},{\"x\":1,\"y\":0}],\"samples\":[[0,1],[0.00029800000000000003,0.999702],[0.001184,0.998816],[0.002646,0.997354],[0.004672,0.995328],[0.007250000000000001,0.99275],[0.010367999999999999,0.989632],[0.014014000000000002,0.985986],[0.018176,0.981824],[0.022842,0.977158],[0.028,0.972],[0.033637999999999994,0.966362],[0.039744,0.960256],[0.046306,0.9536939999999999],[0.05331200000000001,0.9466880000000001],[0.06074999999999999,0.93925],[0.068608,0.931392],[0.07687400000000003,0.923126],[0.085536,0.914464],[0.094582,0.905418],[0.10400000000000002,0.896],[0.11377799999999999,0.886222],[0.12390399999999996,0.876096],[0.13436599999999999,0.865634],[0.145152,0.854848],[0.15625,0.84375],[0.16764800000000002,0.832352],[0.179334,0.820666],[0.19129600000000002,0.808704],[0.20352199999999998,0.796478],[0.216,0.784],[0.22871800000000003,0.7712819999999999],[0.241664,0.7583359999999999],[0.25482600000000005,0.745174],[0.26819200000000004,0.7318079999999999],[0.28174999999999994,0.71825],[0.295488,0.704512],[0.30939399999999995,0.690606],[0.323456,0.676544],[0.337662,0.662338],[0.35200000000000004,0.6479999999999999],[0.36645799999999995,0.633542],[0.3810239999999999,0.618976],[0.39568599999999987,0.6043140000000001],[0.4104319999999999,0.5895680000000001],[0.42524999999999996,0.5747500000000001],[0.4401279999999999,0.559872],[0.45505399999999996,0.544946],[0.470016,0.529984],[0.485002,0.5149980000000001],[0.5,0.5],[0.5149980000000001,0.485002],[0.529984,0.470016],[0.544946,0.45505399999999996],[0.559872,0.4401279999999999],[0.5747500000000001,0.42524999999999996],[0.5895680000000001,0.4104319999999999],[0.6043139999999999,0.3956860000000001],[0.618976,0.38102400000000003],[0.6335419999999999,0.36645800000000006],[0.6479999999999999,0.35200000000000004],[0.662338,0.337662],[0.676544,0.32345599999999997],[0.690606,0.309394],[0.704512,0.29548800000000003],[0.71825,0.28174999999999994],[0.731808,0.268192],[0.745174,0.25482599999999994],[0.7583360000000001,0.24166399999999988],[0.7712819999999999,0.2287180000000001],[0.7839999999999999,0.21600000000000003],[0.796478,0.20352200000000004],[0.808704,0.19129600000000002],[0.820666,0.17933400000000005],[0.832352,0.16764800000000002],[0.84375,0.15625],[0.854848,0.145152],[0.865634,0.13436599999999999],[0.876096,0.12390399999999996],[0.8862220000000001,0.11377799999999993],[0.896,0.10399999999999993],[0.9054180000000001,0.09458199999999997],[0.9144639999999999,0.08553600000000003],[0.9231259999999999,0.07687400000000005],[0.9313919999999999,0.06860800000000003],[0.9392499999999999,0.06075000000000014],[0.9466879999999999,0.05331200000000008],[0.9536939999999999,0.04630600000000007],[0.960256,0.03974400000000006],[0.9663619999999999,0.03363800000000006],[0.972,0.028000000000000053],[0.977158,0.02284200000000003],[0.981824,0.018176000000000053],[0.985986,0.014014000000000026],[0.989632,0.010368000000000016],[0.99275,0.0072500000000000064],[0.995328,0.0046720000000000095],[0.997354,0.0026460000000000025],[0.998816,0.0011839999999999976],[0.999702,0.00029799999999999965],[1,0]]}",
      "preset_selector": "Simple"
    },
    "class_type": "CustomSplineSigma",
    "_meta": {
      "title": "\uD83D\uDCC8 Custom Graph Sigma"
    }
  },
  "258": {
    "inputs": {
      "steps": 4,
      "start_y": 0.84,
      "end_y": 0,
      "curve_data": "{\"control_points\":[{\"x\":0,\"y\":1},{\"x\":1,\"y\":0}],\"samples\":[[0,1],[0.00029800000000000003,0.999702],[0.001184,0.998816],[0.002646,0.997354],[0.004672,0.995328],[0.007250000000000001,0.99275],[0.010367999999999999,0.989632],[0.014014000000000002,0.985986],[0.018176,0.981824],[0.022842,0.977158],[0.028,0.972],[0.033637999999999994,0.966362],[0.039744,0.960256],[0.046306,0.9536939999999999],[0.05331200000000001,0.9466880000000001],[0.06074999999999999,0.93925],[0.068608,0.931392],[0.07687400000000003,0.923126],[0.085536,0.914464],[0.094582,0.905418],[0.10400000000000002,0.896],[0.11377799999999999,0.886222],[0.12390399999999996,0.876096],[0.13436599999999999,0.865634],[0.145152,0.854848],[0.15625,0.84375],[0.16764800000000002,0.832352],[0.179334,0.820666],[0.19129600000000002,0.808704],[0.20352199999999998,0.796478],[0.216,0.784],[0.22871800000000003,0.7712819999999999],[0.241664,0.7583359999999999],[0.25482600000000005,0.745174],[0.26819200000000004,0.7318079999999999],[0.28174999999999994,0.71825],[0.295488,0.704512],[0.30939399999999995,0.690606],[0.323456,0.676544],[0.337662,0.662338],[0.35200000000000004,0.6479999999999999],[0.36645799999999995,0.633542],[0.3810239999999999,0.618976],[0.39568599999999987,0.6043140000000001],[0.4104319999999999,0.5895680000000001],[0.42524999999999996,0.5747500000000001],[0.4401279999999999,0.559872],[0.45505399999999996,0.544946],[0.470016,0.529984],[0.485002,0.5149980000000001],[0.5,0.5],[0.5149980000000001,0.485002],[0.529984,0.470016],[0.544946,0.45505399999999996],[0.559872,0.4401279999999999],[0.5747500000000001,0.42524999999999996],[0.5895680000000001,0.4104319999999999],[0.6043139999999999,0.3956860000000001],[0.618976,0.38102400000000003],[0.6335419999999999,0.36645800000000006],[0.6479999999999999,0.35200000000000004],[0.662338,0.337662],[0.676544,0.32345599999999997],[0.690606,0.309394],[0.704512,0.29548800000000003],[0.71825,0.28174999999999994],[0.731808,0.268192],[0.745174,0.25482599999999994],[0.7583360000000001,0.24166399999999988],[0.7712819999999999,0.2287180000000001],[0.7839999999999999,0.21600000000000003],[0.796478,0.20352200000000004],[0.808704,0.19129600000000002],[0.820666,0.17933400000000005],[0.832352,0.16764800000000002],[0.84375,0.15625],[0.854848,0.145152],[0.865634,0.13436599999999999],[0.876096,0.12390399999999996],[0.8862220000000001,0.11377799999999993],[0.896,0.10399999999999993],[0.9054180000000001,0.09458199999999997],[0.9144639999999999,0.08553600000000003],[0.9231259999999999,0.07687400000000005],[0.9313919999999999,0.06860800000000003],[0.9392499999999999,0.06075000000000014],[0.9466879999999999,0.05331200000000008],[0.9536939999999999,0.04630600000000007],[0.960256,0.03974400000000006],[0.9663619999999999,0.03363800000000006],[0.972,0.028000000000000053],[0.977158,0.02284200000000003],[0.981824,0.018176000000000053],[0.985986,0.014014000000000026],[0.989632,0.010368000000000016],[0.99275,0.0072500000000000064],[0.995328,0.0046720000000000095],[0.997354,0.0026460000000000025],[0.998816,0.0011839999999999976],[0.999702,0.00029799999999999965],[1,0]]}",
      "preset_selector": "Simple"
    },
    "class_type": "CustomSplineSigma",
    "_meta": {
      "title": "\uD83D\uDCC8 Custom Graph Sigma"
    }
  },
  "259": {
    "inputs": {
      "sigma_1": [
        "257",
        1
      ],
      "sigma_2": [
        "258",
        1
      ]
    },
    "class_type": "SigmaJoiner",
    "_meta": {
      "title": "Join Sigma Values"
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
      "title": "Math Expression \uD83D\uDC0D"
    }
  },
  "264": {
    "inputs": {
      "megapixels": 0.15,
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
      "img_compression": 20,
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
      "img_compression": 20,
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
      "audio_normalization_factors": "1,1,1,0.25,1,1,1",
      "model": [
        "81",
        0
      ]
    },
    "class_type": "LTX2AudioLatentNormalizingSampling",
    "_meta": {
      "title": "LTX2 Audio Latent Normalizing Sampling"
    }
  }
}
