export const WAN_WORKFLOW_TEMPLATE = {
  "82": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["89", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "Force Full Unload (VRAM+Pinned)" }
  },
  "83": {
    "inputs": {
      "model": ["92", 0],
      "block_swap_args": ["91", 0]
    },
    "class_type": "WanVideoSetBlockSwap",
    "_meta": { "title": "WanVideo Set BlockSwap" }
  },
  "84": {
    "inputs": {
      "width": ["119", 1],
      "height": ["119", 2],
      "num_frames": ["131", 0],
      "noise_aug_strength": 0,
      "start_latent_strength": 1,
      "end_latent_strength": 1,
      "force_offload": true,
      "fun_or_fl2v_model": false,
      "tiled_vae": false,
      "augment_empty_frames": 0,
      "vae": ["93", 0],
      "start_image": ["119", 0],
      "end_image": ["127", 0]
    },
    "class_type": "WanVideoImageToVideoEncode",
    "_meta": { "title": "WanVideo ImageToVideo Encode" }
  },
  "85": {
    "inputs": {
      "prompt": ["102", 0],
      "force_offload": true,
      "use_disk_cache": false,
      "device": "gpu",
      "t5": ["94", 0]
    },
    "class_type": "WanVideoTextEncodeSingle",
    "_meta": { "title": "WanVideo TextEncodeSingle" }
  },
  "86": {
    "inputs": {
      "context_schedule": "uniform_standard",
      "context_frames": 0,
      "context_stride": 0,
      "context_overlap": 0,
      "freenoise": true,
      "verbose": true,
      "fuse_method": "PLACEHOLDER"
    },
    "class_type": "WanVideoContextOptions",
    "_meta": { "title": "WanVideo Context Options" }
  },
  "88": {
    "inputs": {
      "nag_scale": 0,
      "nag_tau": 0,
      "nag_alpha": 0,
      "inplace": true,
      "original_text_embeds": ["85", 0],
      "nag_text_embeds": ["90", 0]
    },
    "class_type": "WanVideoApplyNAG",
    "_meta": { "title": "WanVideo Apply NAG" }
  },
  "89": {
    "inputs": {
      "steps": 0,
      "cfg": 1,
      "shift": 0,
      "seed": 0,
      "force_offload": true,
      "scheduler": "PLACEHOLDER",
      "riflex_freq_index": 0,
      "denoise_strength": 1,
      "batched_cfg": false,
      "rope_function": "comfy",
      "start_step": 0,
      "end_step": 0,
      "add_noise_to_samples": false,
      "model": ["83", 0],
      "image_embeds": ["84", 0],
      "text_embeds": ["88", 0],
      "samples": ["123", 0],
      "context_options": ["86", 0],
      "sigmas": ["141", 0]
    },
    "class_type": "WanVideoSampler",
    "_meta": { "title": "WanVideo Sampler" }
  },
  "90": {
    "inputs": {
      "prompt": ["95", 0],
      "force_offload": true,
      "use_disk_cache": true,
      "device": "gpu",
      "t5": ["94", 0]
    },
    "class_type": "WanVideoTextEncodeSingle",
    "_meta": { "title": "WanVideo TextEncodeSingle" }
  },
  "91": {
    "inputs": {
      "blocks_to_swap": 0,
      "offload_img_emb": false,
      "offload_txt_emb": false,
      "use_non_blocking": true,
      "vace_blocks_to_swap": 0,
      "prefetch_blocks": 0,
      "block_swap_debug": true
    },
    "class_type": "WanVideoBlockSwap",
    "_meta": { "title": "WanVideo Block Swap" }
  },
  "92": {
    "inputs": {
      "model": "PLACEHOLDER",
      "base_precision": "PLACEHOLDER",
      "quantization": "PLACEHOLDER",
      "load_device": "offload_device",
      "attention_mode": "PLACEHOLDER",
      "rms_norm_function": "default"
    },
    "class_type": "WanVideoModelLoader",
    "_meta": { "title": "WanVideo Model Loader" }
  },
  "93": {
    "inputs": {
      "model_name": "PLACEHOLDER",
      "precision": "bf16",
      "use_cpu_cache": false,
      "verbose": true
    },
    "class_type": "WanVideoVAELoader",
    "_meta": { "title": "WanVideo VAE Loader" }
  },
  "94": {
    "inputs": {
      "model_name": "PLACEHOLDER",
      "precision": "bf16",
      "load_device": "offload_device",
      "quantization": "disabled"
    },
    "class_type": "LoadWanVideoT5TextEncoder",
    "_meta": { "title": "WanVideo T5 Text Encoder Loader" }
  },
  "95": {
    "inputs": {
      "text": "PLACEHOLDER"
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "Negative WAN" }
  },
  "98": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["103", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "Force Full Unload (VRAM+Pinned)" }
  },
  "100": {
    "inputs": {
      "resize_type": "PLACEHOLDER",
      "resize_type.scale": 0,
      "quality": "PLACEHOLDER",
      "images": ["105", 0]
    },
    "class_type": "RTXVideoSuperResolution",
    "_meta": { "title": "RTX Video Super Resolution" }
  },
  "101": {
    "inputs": {
      "image": "PLACEHOLDER"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "Start Image" }
  },
  "102": {
    "inputs": {
      "text": "PLACEHOLDER"
    },
    "class_type": "Text Multiline",
    "_meta": { "title": "Positive" }
  },
  "103": {
    "inputs": {
      "frame_rate": ["133", 1],
      "loop_count": 0,
      "filename_prefix": "PLACEHOLDER",
      "format": "PLACEHOLDER",
      "pix_fmt": "PLACEHOLDER",
      "crf": 0,
      "save_metadata": false,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": false,
      "images": ["100", 0]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": { "title": "Video Combine 🎥🅥🅗🅢" }
  },
  "104": {
    "inputs": {
      "enable_vae_tiling": false,
      "tile_x": 272,
      "tile_y": 272,
      "tile_stride_x": 144,
      "tile_stride_y": 128,
      "normalization": "default",
      "vae": ["93", 0],
      "samples": ["82", 0]
    },
    "class_type": "WanVideoDecode",
    "_meta": { "title": "WanVideo Decode" }
  },
  "105": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["104", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "Force Full Unload (VRAM+Pinned)" }
  },
  "106": {
    "inputs": {
      "model": "PLACEHOLDER",
      "base_precision": "PLACEHOLDER",
      "quantization": "PLACEHOLDER",
      "load_device": "offload_device",
      "attention_mode": "PLACEHOLDER",
      "rms_norm_function": "default"
    },
    "class_type": "WanVideoModelLoader",
    "_meta": { "title": "WanVideo Model Loader" }
  },
  "119": {
    "inputs": {
      "megapixels": 0,
      "multiple_of": 0,
      "upscale_method": "PLACEHOLDER",
      "image": ["101", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "Resize Image (Megapixels + Alignment)" }
  },
  "120": {
    "inputs": {
      "steps": 0,
      "cfg": 1,
      "shift": 0,
      "seed": 0,
      "force_offload": true,
      "scheduler": "PLACEHOLDER",
      "riflex_freq_index": 0,
      "denoise_strength": 1,
      "batched_cfg": false,
      "rope_function": "comfy",
      "start_step": 0,
      "end_step": 0,
      "add_noise_to_samples": true,
      "model": ["121", 0],
      "image_embeds": ["84", 0],
      "text_embeds": ["125", 0],
      "context_options": ["86", 0],
      "sigmas": ["140", 0]
    },
    "class_type": "WanVideoSampler",
    "_meta": { "title": "WanVideo Sampler" }
  },
  "121": {
    "inputs": {
      "model": ["106", 0],
      "block_swap_args": ["91", 0]
    },
    "class_type": "WanVideoSetBlockSwap",
    "_meta": { "title": "WanVideo Set BlockSwap" }
  },
  "123": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["120", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "Force Full Unload (VRAM+Pinned)" }
  },
  "125": {
    "inputs": {
      "verbose": true,
      "release_pinned_ram": true,
      "aimdo_analyze": true,
      "passthrough": ["88", 0]
    },
    "class_type": "ForceFullUnload",
    "_meta": { "title": "Force Full Unload (VRAM+Pinned)" }
  },
  "126": {
    "inputs": {
      "image": "PLACEHOLDER"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "End Image" }
  },
  "127": {
    "inputs": {
      "megapixels": 0,
      "multiple_of": 0,
      "upscale_method": "PLACEHOLDER",
      "image": ["126", 0]
    },
    "class_type": "ResizeImageToMegapixels",
    "_meta": { "title": "Resize Image (Megapixels + Alignment)" }
  },
  "129": {
    "inputs": {
      "number_type": "integer",
      "number": 0
    },
    "class_type": "Constant Number",
    "_meta": { "title": "FPS" }
  },
  "130": {
    "inputs": {
      "number_type": "integer",
      "number": 0
    },
    "class_type": "Constant Number",
    "_meta": { "title": "Seconds" }
  },
  "131": {
    "inputs": {
      "expression": "a * b + 1",
      "a": ["129", 2],
      "b": ["130", 2]
    },
    "class_type": "MathExpression|pysssss",
    "_meta": { "title": "Generate Frame" }
  },
  "132": {
    "inputs": {
      "number_type": "integer",
      "number": 0
    },
    "class_type": "Constant Number",
    "_meta": { "title": "Multiplier" }
  },
  "133": {
    "inputs": {
      "expression": "a * b",
      "a": ["132", 2],
      "b": ["129", 2]
    },
    "class_type": "MathExpression|pysssss",
    "_meta": { "title": "Final FPS" }
  },
  "135": {
    "inputs": {
      "number_type": "integer",
      "number": 0
    },
    "class_type": "Constant Number",
    "_meta": { "title": "Overall Steps" }
  },
  "136": {
    "inputs": {
      "number_type": "integer",
      "number": 0
    },
    "class_type": "Constant Number",
    "_meta": { "title": "Split Steps" }
  },
  "140": {
    "inputs": {
      "sigmas": "PLACEHOLDER"
    },
    "class_type": "ManualSigmas",
    "_meta": { "title": "ManualSigmas" }
  },
  "141": {
    "inputs": {
      "sigmas": "PLACEHOLDER"
    },
    "class_type": "ManualSigmas",
    "_meta": { "title": "ManualSigmas" }
  }
} as const
