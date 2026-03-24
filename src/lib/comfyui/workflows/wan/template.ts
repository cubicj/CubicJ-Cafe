export const WAN_WORKFLOW_TEMPLATE = {
  "517": {
    "inputs": {
      "unet_name": "REDACTED_MODEL.safetensors",
      "weight_dtype": "default"
    },
    "class_type": "UNETLoader",
    "_meta": { "title": "Load Diffusion Model (HIGH)" }
  },
  "518": {
    "inputs": {
      "unet_name": "REDACTED_MODEL.safetensors",
      "weight_dtype": "default"
    },
    "class_type": "UNETLoader",
    "_meta": { "title": "Load Diffusion Model (LOW)" }
  },
  "519": {
    "inputs": {
      "clip_name": "REDACTED_MODEL.safetensors",
      "type": "wan",
      "device": "default"
    },
    "class_type": "CLIPLoader",
    "_meta": { "title": "Load CLIP" }
  },
  "520": {
    "inputs": {
      "vae_name": "REDACTED_MODEL.safetensors"
    },
    "class_type": "VAELoader",
    "_meta": { "title": "Load VAE" }
  },
  "521": {
    "inputs": {
      "sage_attention": "auto",
      "allow_compile": false,
      "model": ["539", 0]
    },
    "class_type": "PathchSageAttentionKJ",
    "_meta": { "title": "Patch Sage Attention KJ (HIGH)" }
  },
  "522": {
    "inputs": {
      "sage_attention": "auto",
      "allow_compile": false,
      "model": ["541", 0]
    },
    "class_type": "PathchSageAttentionKJ",
    "_meta": { "title": "Patch Sage Attention KJ (LOW)" }
  },
  "525": {
    "inputs": {
      "PowerLoraLoaderHeaderWidget": { "type": "PowerLoraLoaderHeaderWidget" },
      "lora_1": {
        "on": false,
        "lora": "WAN\\REDACTED_MODEL.safetensors",
        "strength": 1
      },
      "➕ Add Lora": "",
      "model": ["558", 0],
      "clip": ["519", 0]
    },
    "class_type": "Power Lora Loader (rgthree)",
    "_meta": { "title": "Power Lora Loader (HIGH)" }
  },
  "526": {
    "inputs": {
      "PowerLoraLoaderHeaderWidget": { "type": "PowerLoraLoaderHeaderWidget" },
      "lora_1": {
        "on": false,
        "lora": "WAN\\REDACTED_MODEL.safetensors",
        "strength": 1
      },
      "➕ Add Lora": "",
      "model": ["559", 0],
      "clip": ["519", 0]
    },
    "class_type": "Power Lora Loader (rgthree)",
    "_meta": { "title": "Power Lora Loader (LOW)" }
  },
  "527": {
    "inputs": {
      "width": ["533", 1],
      "height": ["533", 2],
      "length": 121,
      "batch_size": 1,
      "positive": ["530", 0],
      "negative": ["536", 0],
      "vae": ["520", 0],
      "start_image": ["533", 0],
      "end_image": ["534", 0]
    },
    "class_type": "WanFirstLastFrameToVideo",
    "_meta": { "title": "WanFirstLastFrameToVideo (HIGH)" }
  },
  "529": {
    "inputs": {
      "text": ["543", 0],
      "clip": ["526", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "positive low" }
  },
  "530": {
    "inputs": {
      "text": ["543", 0],
      "clip": ["525", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "positive high" }
  },
  "531": {
    "inputs": {
      "image": "input_image.png"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "start" }
  },
  "532": {
    "inputs": {
      "image": "input_image.png"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "end" }
  },
  "533": {
    "inputs": {
      "megapixels": 0.66,
      "multiple_of": 16,
      "upscale_method": "lanczos",
      "image": ["531", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "Resize Start Image" }
  },
  "534": {
    "inputs": {
      "megapixels": 0.66,
      "multiple_of": 16,
      "upscale_method": "lanczos",
      "image": ["532", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "Resize End Image" }
  },
  "536": {
    "inputs": {
      "text": ["544", 0],
      "clip": ["525", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "negative high" }
  },
  "537": {
    "inputs": {
      "text": ["544", 0],
      "clip": ["526", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "negative low" }
  },
  "538": {
    "inputs": {
      "width": ["533", 1],
      "height": ["533", 2],
      "length": 121,
      "batch_size": 1,
      "positive": ["529", 0],
      "negative": ["537", 0],
      "vae": ["520", 0],
      "start_image": ["533", 0],
      "end_image": ["534", 0]
    },
    "class_type": "WanFirstLastFrameToVideo",
    "_meta": { "title": "WanFirstLastFrameToVideo (LOW)" }
  },
  "539": {
    "inputs": {
      "shift": 5,
      "model": ["517", 0]
    },
    "class_type": "ModelSamplingSD3",
    "_meta": { "title": "ModelSamplingSD3 (HIGH)" }
  },
  "540": {
    "inputs": {
      "nag_scale": 7,
      "nag_alpha": 0.25,
      "nag_tau": 2.373,
      "input_type": "default",
      "model": ["525", 0],
      "conditioning": ["536", 0]
    },
    "class_type": "WanVideoNAG",
    "_meta": { "title": "WanVideoNAG (HIGH)" }
  },
  "541": {
    "inputs": {
      "shift": 5,
      "model": ["518", 0]
    },
    "class_type": "ModelSamplingSD3",
    "_meta": { "title": "ModelSamplingSD3 (LOW)" }
  },
  "542": {
    "inputs": {
      "nag_scale": 7,
      "nag_alpha": 0.25,
      "nag_tau": 2.373,
      "input_type": "default",
      "model": ["526", 0],
      "conditioning": ["537", 0]
    },
    "class_type": "WanVideoNAG",
    "_meta": { "title": "WanVideoNAG (LOW)" }
  },
  "543": {
    "inputs": {
      "text": ""
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "Positive" }
  },
  "544": {
    "inputs": {
      "text": "test negative prompt, static image, inconsistent motion, jittery, distorted, morphing, flickering, watermark, text, subtitles, artifacts"
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "Negative" }
  },
  "545": {
    "inputs": {
      "sampler_name": "euler"
    },
    "class_type": "KSamplerSelect",
    "_meta": { "title": "KSamplerSelect" }
  },
  "546": {
    "inputs": {
      "noise": ["549", 0],
      "guider": ["550", 0],
      "sampler": ["545", 0],
      "sigmas": ["553", 1],
      "latent_image": ["527", 2]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "SamplerCustomAdvanced (HIGH)" }
  },
  "547": {
    "inputs": {
      "noise": ["557", 0],
      "guider": ["551", 0],
      "sampler": ["545", 0],
      "sigmas": ["554", 1],
      "latent_image": ["564", 0]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": { "title": "SamplerCustomAdvanced (LOW)" }
  },
  "549": {
    "inputs": {
      "noise_seed": 0
    },
    "class_type": "RandomNoise",
    "_meta": { "title": "RandomNoise" }
  },
  "550": {
    "inputs": {
      "model": ["540", 0],
      "conditioning": ["527", 0]
    },
    "class_type": "BasicGuider",
    "_meta": { "title": "BasicGuider (HIGH)" }
  },
  "551": {
    "inputs": {
      "model": ["542", 0],
      "conditioning": ["538", 0]
    },
    "class_type": "BasicGuider",
    "_meta": { "title": "BasicGuider (LOW)" }
  },
  "553": {
    "inputs": {
      "steps": 3,
      "start_y": 1,
      "end_y": 0.9,
      "curve_data": "{\"control_points\":[{\"x\":0,\"y\":1},{\"x\":1,\"y\":0}],\"samples\":[[0,1],[0.00029800000000000003,0.999702],[0.001184,0.998816],[0.002646,0.997354],[0.004672,0.995328],[0.007250000000000001,0.99275],[0.010367999999999999,0.989632],[0.014014000000000002,0.985986],[0.018176,0.981824],[0.022842,0.977158],[0.028,0.972],[0.033637999999999994,0.966362],[0.039744,0.960256],[0.046306,0.9536939999999999],[0.05331200000000001,0.9466880000000001],[0.06074999999999999,0.93925],[0.068608,0.931392],[0.07687400000000003,0.923126],[0.085536,0.914464],[0.094582,0.905418],[0.10400000000000002,0.896],[0.11377799999999999,0.886222],[0.12390399999999996,0.876096],[0.13436599999999999,0.865634],[0.145152,0.854848],[0.15625,0.84375],[0.16764800000000002,0.832352],[0.179334,0.820666],[0.19129600000000002,0.808704],[0.20352199999999998,0.796478],[0.216,0.784],[0.22871800000000003,0.7712819999999999],[0.241664,0.7583359999999999],[0.25482600000000005,0.745174],[0.26819200000000004,0.7318079999999999],[0.28174999999999994,0.71825],[0.295488,0.704512],[0.30939399999999995,0.690606],[0.323456,0.676544],[0.337662,0.662338],[0.35200000000000004,0.6479999999999999],[0.36645799999999995,0.633542],[0.3810239999999999,0.618976],[0.39568599999999987,0.6043140000000001],[0.4104319999999999,0.5895680000000001],[0.42524999999999996,0.5747500000000001],[0.4401279999999999,0.559872],[0.45505399999999996,0.544946],[0.470016,0.529984],[0.485002,0.5149980000000001],[0.5,0.5],[0.5149980000000001,0.485002],[0.529984,0.470016],[0.544946,0.45505399999999996],[0.559872,0.4401279999999999],[0.5747500000000001,0.42524999999999996],[0.5895680000000001,0.4104319999999999],[0.6043139999999999,0.3956860000000001],[0.618976,0.38102400000000003],[0.6335419999999999,0.36645800000000006],[0.6479999999999999,0.35200000000000004],[0.662338,0.337662],[0.676544,0.32345599999999997],[0.690606,0.309394],[0.704512,0.29548800000000003],[0.71825,0.28174999999999994],[0.731808,0.268192],[0.745174,0.25482599999999994],[0.7583360000000001,0.24166399999999988],[0.7712819999999999,0.2287180000000001],[0.7839999999999999,0.21600000000000003],[0.796478,0.20352200000000004],[0.808704,0.19129600000000002],[0.820666,0.17933400000000005],[0.832352,0.16764800000000002],[0.84375,0.15625],[0.854848,0.145152],[0.865634,0.13436599999999999],[0.876096,0.12390399999999996],[0.8862220000000001,0.11377799999999993],[0.896,0.10399999999999993],[0.9054180000000001,0.09458199999999997],[0.9144639999999999,0.08553600000000003],[0.9231259999999999,0.07687400000000005],[0.9313919999999999,0.06860800000000003],[0.9392499999999999,0.06075000000000014],[0.9466879999999999,0.05331200000000008],[0.9536939999999999,0.04630600000000007],[0.960256,0.03974400000000006],[0.9663619999999999,0.03363800000000006],[0.972,0.028000000000000053],[0.977158,0.02284200000000003],[0.981824,0.018176000000000053],[0.985986,0.014014000000000026],[0.989632,0.010368000000000016],[0.99275,0.0072500000000000064],[0.995328,0.0046720000000000095],[0.997354,0.0026460000000000025],[0.998816,0.0011839999999999976],[0.999702,0.00029799999999999965],[1,0]]}",
      "preset_selector": "Simple"
    },
    "class_type": "CustomSplineSigma",
    "_meta": { "title": "Custom Graph Sigma (HIGH)" }
  },
  "554": {
    "inputs": {
      "steps": 3,
      "start_y": 0.9,
      "end_y": 0,
      "curve_data": "{\"control_points\":[{\"x\":0,\"y\":1},{\"x\":1,\"y\":0}],\"samples\":[[0,1],[0.00029800000000000003,0.999702],[0.001184,0.998816],[0.002646,0.997354],[0.004672,0.995328],[0.007250000000000001,0.99275],[0.010367999999999999,0.989632],[0.014014000000000002,0.985986],[0.018176,0.981824],[0.022842,0.977158],[0.028,0.972],[0.033637999999999994,0.966362],[0.039744,0.960256],[0.046306,0.9536939999999999],[0.05331200000000001,0.9466880000000001],[0.06074999999999999,0.93925],[0.068608,0.931392],[0.07687400000000003,0.923126],[0.085536,0.914464],[0.094582,0.905418],[0.10400000000000002,0.896],[0.11377799999999999,0.886222],[0.12390399999999996,0.876096],[0.13436599999999999,0.865634],[0.145152,0.854848],[0.15625,0.84375],[0.16764800000000002,0.832352],[0.179334,0.820666],[0.19129600000000002,0.808704],[0.20352199999999998,0.796478],[0.216,0.784],[0.22871800000000003,0.7712819999999999],[0.241664,0.7583359999999999],[0.25482600000000005,0.745174],[0.26819200000000004,0.7318079999999999],[0.28174999999999994,0.71825],[0.295488,0.704512],[0.30939399999999995,0.690606],[0.323456,0.676544],[0.337662,0.662338],[0.35200000000000004,0.6479999999999999],[0.36645799999999995,0.633542],[0.3810239999999999,0.618976],[0.39568599999999987,0.6043140000000001],[0.4104319999999999,0.5895680000000001],[0.42524999999999996,0.5747500000000001],[0.4401279999999999,0.559872],[0.45505399999999996,0.544946],[0.470016,0.529984],[0.485002,0.5149980000000001],[0.5,0.5],[0.5149980000000001,0.485002],[0.529984,0.470016],[0.544946,0.45505399999999996],[0.559872,0.4401279999999999],[0.5747500000000001,0.42524999999999996],[0.5895680000000001,0.4104319999999999],[0.6043139999999999,0.3956860000000001],[0.618976,0.38102400000000003],[0.6335419999999999,0.36645800000000006],[0.6479999999999999,0.35200000000000004],[0.662338,0.337662],[0.676544,0.32345599999999997],[0.690606,0.309394],[0.704512,0.29548800000000003],[0.71825,0.28174999999999994],[0.731808,0.268192],[0.745174,0.25482599999999994],[0.7583360000000001,0.24166399999999988],[0.7712819999999999,0.2287180000000001],[0.7839999999999999,0.21600000000000003],[0.796478,0.20352200000000004],[0.808704,0.19129600000000002],[0.820666,0.17933400000000005],[0.832352,0.16764800000000002],[0.84375,0.15625],[0.854848,0.145152],[0.865634,0.13436599999999999],[0.876096,0.12390399999999996],[0.8862220000000001,0.11377799999999993],[0.896,0.10399999999999993],[0.9054180000000001,0.09458199999999997],[0.9144639999999999,0.08553600000000003],[0.9231259999999999,0.07687400000000005],[0.9313919999999999,0.06860800000000003],[0.9392499999999999,0.06075000000000014],[0.9466879999999999,0.05331200000000008],[0.9536939999999999,0.04630600000000007],[0.960256,0.03974400000000006],[0.9663619999999999,0.03363800000000006],[0.972,0.028000000000000053],[0.977158,0.02284200000000003],[0.981824,0.018176000000000053],[0.985986,0.014014000000000026],[0.989632,0.010368000000000016],[0.99275,0.0072500000000000064],[0.995328,0.0046720000000000095],[0.997354,0.0026460000000000025],[0.998816,0.0011839999999999976],[0.999702,0.00029799999999999965],[1,0]]}",
      "preset_selector": "Simple"
    },
    "class_type": "CustomSplineSigma",
    "_meta": { "title": "Custom Graph Sigma (LOW)" }
  },
  "555": {
    "inputs": {
      "samples": ["563", 0],
      "vae": ["520", 0]
    },
    "class_type": "VAEDecode",
    "_meta": { "title": "VAE Decode" }
  },
  "562": {
    "inputs": {
      "frame_rate": 24,
      "loop_count": 0,
      "filename_prefix": "WAN\\ComfyUI_WAN",
      "format": "video/h264-mp4",
      "pix_fmt": "yuv420p",
      "crf": 20,
      "save_metadata": false,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": false,
      "images": ["555", 0],
      "vae": ["520", 0]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": { "title": "Video Combine" }
  },
  "563": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["547", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "VRAM Debug" }
  },
  "557": {
    "inputs": {},
    "class_type": "DisableNoise",
    "_meta": { "title": "DisableNoise" }
  },
  "558": {
    "inputs": {
      "enable_fp16_accumulation": true,
      "model": ["521", 0]
    },
    "class_type": "ModelPatchTorchSettings",
    "_meta": { "title": "Model Patch Torch Settings (HIGH)" }
  },
  "559": {
    "inputs": {
      "enable_fp16_accumulation": true,
      "model": ["522", 0]
    },
    "class_type": "ModelPatchTorchSettings",
    "_meta": { "title": "Model Patch Torch Settings (LOW)" }
  },
  "564": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["546", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": { "title": "VRAM Debug (between passes)" }
  },
  "565": {
    "inputs": {
      "width": ["533", 1],
      "height": ["533", 2],
      "length": 121,
      "batch_size": 1,
      "positive": ["530", 0],
      "negative": ["536", 0],
      "vae": ["520", 0],
      "start_image": ["533", 0]
    },
    "class_type": "WanImageToVideo",
    "_meta": { "title": "WanImageToVideo (HIGH)" }
  },
  "567": {
    "inputs": {
      "width": ["533", 1],
      "height": ["533", 2],
      "length": 121,
      "batch_size": 1,
      "positive": ["529", 0],
      "negative": ["537", 0],
      "vae": ["520", 0],
      "start_image": ["533", 0]
    },
    "class_type": "WanImageToVideo",
    "_meta": { "title": "WanImageToVideo (LOW)" }
  }
}
