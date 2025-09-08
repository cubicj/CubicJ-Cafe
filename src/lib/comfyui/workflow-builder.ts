import type { ComfyUIWorkflow, GenerationParams } from '@/types'
import type { ComfyUIServer } from './server-manager'
import { applyModelSettings } from './workflow-model-manager'
import { applyLoraPreset } from './workflow-lora-manager'
import { 
  applyPromptSettings, 
  applyImageSettings, 
  applyGenerationSettings, 
  validateWorkflowNodes 
} from './workflow-node-utils'


export async function buildWanWorkflow(params: GenerationParams, server?: ComfyUIServer): Promise<ComfyUIWorkflow> {
  // WAN.json 원본 워크플로우를 깊은 복사
  const workflow = JSON.parse(JSON.stringify(WAN_WORKFLOW_TEMPLATE))
  
  // 워크플로우 유효성 검증
  if (!validateWorkflowNodes(workflow)) {
    throw new Error('워크플로우 템플릿이 유효하지 않습니다');
  }
  
  // 모델 설정 적용
  await applyModelSettings(workflow);
  
  // 프롬프트 설정 적용
  await applyPromptSettings(workflow, params);
  
  // 이미지 설정 적용
  await applyImageSettings(workflow, params);
  
  // 생성 설정 적용
  await applyGenerationSettings(workflow, params);
  
  // 시드를 랜덤으로 생성
  if (workflow['291']) {
    workflow['291'].inputs.seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF);
  }
  
  // 비디오 출력 파일명 설정
  if (workflow['285'] && params.inputImage) {
    const baseImageName = params.inputImage.replace(/\.(png|jpg|jpeg)$/i, '');
    workflow['285'].inputs.filename_prefix = `WAN/${baseImageName}`;
  }
  
  // LoRA 프리셋 적용
  if (params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    applyLoraPreset(workflow, params.loraPreset, server);
  }
  
  
  return workflow
}
const WAN_WORKFLOW_TEMPLATE = {
  "257": {
    "inputs": {
      "text": ["292", 0],
      "clip": ["305", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Positive Prompt)"
    }
  },
  "258": {
    "inputs": {
      "text": ["292", 0],
      "clip": ["306", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Positive Prompt)"
    }
  },
  "311": {
    "inputs": {
      "Value_A": 560,
      "Value_B": 560
    },
    "class_type": "DF_Multiply",
    "_meta": {
      "title": "Multiply"
    }
  },
  "314": {
    "inputs": {
      "image": ["299", 0]
    },
    "class_type": "GetImageSize+",
    "_meta": {
      "title": "🔧 Get Image Size"
    }
  },
  "316": {
    "inputs": {
      "int_a": ["314", 0],
      "int_b": ["314", 1]
    },
    "class_type": "Multiply Int Int (JPS)",
    "_meta": {
      "title": "Multiply Int Int (JPS)"
    }
  },
  "319": {
    "inputs": {
      "Numerator": ["311", 0],
      "Denominator": ["316", 1]
    },
    "class_type": "DF_Divide",
    "_meta": {
      "title": "Divide"
    }
  },
  "320": {
    "inputs": {
      "Value": ["319", 0]
    },
    "class_type": "DF_Square_root",
    "_meta": {
      "title": "Square root"
    }
  },
  "322": {
    "inputs": {
      "int_a": ["314", 0],
      "float_b": ["320", 0]
    },
    "class_type": "Multiply Int Float (JPS)",
    "_meta": {
      "title": "Multiply Int Float (JPS)"
    }
  },
  "323": {
    "inputs": {
      "int_a": ["314", 1],
      "float_b": ["320", 0]
    },
    "class_type": "Multiply Int Float (JPS)",
    "_meta": {
      "title": "Multiply Int Float (JPS)"
    }
  },
  "262": {
    "inputs": {
      "value": 8
    },
    "class_type": "easy int",
    "_meta": {
      "title": "Total Step"
    }
  },
  "263": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "image_pass": ["274", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "264": {
    "inputs": {
      "samples": ["286", 0],
      "vae": ["294", 0]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "265": {
    "inputs": {
      "crop": "none",
      "clip_vision": ["277", 0],
      "image": ["299", 0]
    },
    "class_type": "CLIPVisionEncode",
    "_meta": {
      "title": "CLIP Vision Encode"
    }
  },
  "266": {
    "inputs": {
      "negative": ""
    },
    "class_type": "easy negative",
    "_meta": {
      "title": "Negative"
    }
  },
  "267": {
    "inputs": {
      "text": ["266", 0],
      "clip": ["305", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Negative Prompt)"
    }
  },
  "268": {
    "inputs": {
      "shift": 8,
      "model": ["281", 0]
    },
    "class_type": "ModelSamplingSD3",
    "_meta": {
      "title": "ModelSamplingSD3"
    }
  },
  "269": {
    "inputs": {
      "value": 81
    },
    "class_type": "easy int",
    "_meta": {
      "title": "Length"
    }
  },
  "270": {
    "inputs": {
      "width": ["322", 0],
      "height": ["323", 0],
      "length": ["269", 0],
      "batch_size": 1,
      "positive": ["258", 0],
      "negative": ["288", 0],
      "vae": ["294", 0],
      "clip_vision_start_image": ["265", 0],
      "clip_vision_end_image": ["324", 0],
      "start_image": ["299", 0],
      "end_image": ["325", 0]
    },
    "class_type": "WanFirstLastFrameToVideo",
    "_meta": {
      "title": "WanFirstLastFrameToVideo"
    }
  },
  "272": {
    "inputs": {
      "unet_name": "Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors",
      "weight_dtype": "fp8_e4m3fn"
    },
    "class_type": "UNETLoader",
    "_meta": {
      "title": "Load Diffusion Model"
    }
  },
  "274": {
    "inputs": {
      "per_batch": 4,
      "upscale_model": ["276", 0],
      "images": ["264", 0]
    },
    "class_type": "ImageUpscaleWithModelBatched",
    "_meta": {
      "title": "Image Upscale With Model Batched"
    }
  },
  "275": {
    "inputs": {
      "unet_name": "Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors",
      "weight_dtype": "fp8_e4m3fn"
    },
    "class_type": "UNETLoader",
    "_meta": {
      "title": "Load Diffusion Model"
    }
  },
  "276": {
    "inputs": {
      "model_name": "2x-AnimeSharpV4_Fast_RCAN_PU.safetensors"
    },
    "class_type": "UpscaleModelLoader",
    "_meta": {
      "title": "Load Upscale Model"
    }
  },
  "277": {
    "inputs": {
      "clip_name": "wan21NSFWClipVisionH_v10.safetensors"
    },
    "class_type": "CLIPVisionLoader",
    "_meta": {
      "title": "Load CLIP Vision"
    }
  },
  "278": {
    "inputs": {
      "weight": 2.0000000000000004,
      "model": ["305", 0],
      "latent": ["289", 2]
    },
    "class_type": "WanVideoEnhanceAVideoKJ",
    "_meta": {
      "title": "WanVideo Enhance A Video (native)"
    }
  },
  "279": {
    "inputs": {
      "weight": 2.0000000000000004,
      "model": ["306", 0],
      "latent": ["296", 0]
    },
    "class_type": "WanVideoEnhanceAVideoKJ",
    "_meta": {
      "title": "WanVideo Enhance A Video (native)"
    }
  },
  "280": {
    "inputs": {
      "nag_scale": 11,
      "nag_alpha": 0.25,
      "nag_tau": 2.5,
      "input_type": "default",
      "model": ["278", 0],
      "conditioning": ["289", 1]
    },
    "class_type": "WanVideoNAG",
    "_meta": {
      "title": "WanVideoNAG"
    }
  },
  "281": {
    "inputs": {
      "nag_scale": 11,
      "nag_alpha": 0.25,
      "nag_tau": 2.5,
      "input_type": "default",
      "model": ["279", 0],
      "conditioning": ["288", 0]
    },
    "class_type": "WanVideoNAG",
    "_meta": {
      "title": "WanVideoNAG"
    }
  },
  "282": {
    "inputs": {
      "shift": 8,
      "model": ["280", 0]
    },
    "class_type": "ModelSamplingSD3",
    "_meta": {
      "title": "ModelSamplingSD3"
    }
  },
  "283": {
    "inputs": {
      "mode": "always",
      "system_notification": false,
      "notification_text": "Your notification has triggered.",
      "play_sound": true,
      "volume": 0.5,
      "file": "notify.mp3",
      "any": ["285", 0]
    },
    "class_type": "Notif-UnifiedNotification",
    "_meta": {
      "title": "찰칵"
    }
  },
  "284": {
    "inputs": {
      "engine": "rife49_ensemble_True_scale_1_sim.engine",
      "clear_cache_after_n_frames": 120,
      "multiplier": 2,
      "use_cuda_graph": true,
      "keep_model_loaded": false,
      "frames": ["263", 1]
    },
    "class_type": "RifeTensorrt",
    "_meta": {
      "title": "⚡ Rife Tensorrt"
    }
  },
  "285": {
    "inputs": {
      "frame_rate": 32,
      "loop_count": 0,
      "filename_prefix": "WAN/WanSample",
      "format": "video/h264-mp4",
      "pix_fmt": "yuv420p",
      "crf": 19,
      "save_metadata": false,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": false,
      "images": ["284", 0]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": {
      "title": "Video Combine 🎥🅥🅗🅢"
    }
  },
  "286": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["301", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "287": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["296", 0]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "288": {
    "inputs": {
      "text": ["266", 0],
      "clip": ["306", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Negative Prompt)"
    }
  },
  "289": {
    "inputs": {
      "width": ["322", 0],
      "height": ["323", 0],
      "length": ["269", 0],
      "batch_size": 1,
      "positive": ["257", 0],
      "negative": ["267", 0],
      "vae": ["294", 0],
      "clip_vision_start_image": ["265", 0],
      "clip_vision_end_image": ["324", 0],
      "start_image": ["299", 0],
      "end_image": ["325", 0]
    },
    "class_type": "WanFirstLastFrameToVideo",
    "_meta": {
      "title": "WanFirstLastFrameToVideo"
    }
  },
  "290": {
    "inputs": {
      "empty_cache": true,
      "gc_collect": true,
      "unload_all_models": true,
      "any_input": ["289", 2]
    },
    "class_type": "VRAM_Debug",
    "_meta": {
      "title": "VRAM Debug"
    }
  },
  "291": {
    "inputs": {
      "seed": 57475599964285
    },
    "class_type": "easy seed",
    "_meta": {
      "title": "Seed"
    }
  },
  "292": {
    "inputs": {
      "string_a": ["300", 0],
      "string_b": ["293", 0],
      "delimiter": ""
    },
    "class_type": "StringConcatenate",
    "_meta": {
      "title": "Concatenate"
    }
  },
  "293": {
    "inputs": {
      "positive": ""
    },
    "class_type": "easy positive",
    "_meta": {
      "title": "Quality"
    }
  },
  "294": {
    "inputs": {
      "vae_name": "wan_2.1_vae.safetensors"
    },
    "class_type": "VAELoader",
    "_meta": {
      "title": "Load VAE"
    }
  },
  "295": {
    "inputs": {
      "add_noise": "enable",
      "noise_seed": ["291", 0],
      "steps": ["262", 0],
      "cfg": 3,
      "sampler_name": "uni_pc",
      "scheduler": "beta",
      "start_at_step": 0,
      "end_at_step": 2,
      "return_with_leftover_noise": "enable",
      "model": ["282", 0],
      "positive": ["289", 0],
      "negative": ["289", 1],
      "latent_image": ["290", 0]
    },
    "class_type": "KSamplerAdvanced",
    "_meta": {
      "title": "KSampler (Advanced)"
    }
  },
  "296": {
    "inputs": {
      "add_noise": "disable",
      "noise_seed": ["291", 0],
      "steps": ["262", 0],
      "cfg": 1,
      "sampler_name": "uni_pc",
      "scheduler": "beta",
      "start_at_step": 2,
      "end_at_step": 4,
      "return_with_leftover_noise": "disable",
      "model": ["282", 0],
      "positive": ["289", 0],
      "negative": ["289", 1],
      "latent_image": ["295", 0]
    },
    "class_type": "KSamplerAdvanced",
    "_meta": {
      "title": "KSampler (Advanced)"
    }
  },
  "297": {
    "inputs": {
      "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
      "type": "wan",
      "device": "default"
    },
    "class_type": "CLIPLoader",
    "_meta": {
      "title": "Load CLIP"
    }
  },
  "299": {
    "inputs": {
      "image": "input_image.png"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "Start Image"
    }
  },
  "300": {
    "inputs": {
      "positive": ""
    },
    "class_type": "easy positive",
    "_meta": {
      "title": "Positive"
    }
  },
  "301": {
    "inputs": {
      "add_noise": "disable",
      "noise_seed": ["291", 0],
      "steps": ["262", 0],
      "cfg": 1,
      "sampler_name": "uni_pc",
      "scheduler": "beta",
      "start_at_step": 6,
      "end_at_step": ["262", 0],
      "return_with_leftover_noise": "disable",
      "model": ["268", 0],
      "positive": ["270", 0],
      "negative": ["270", 1],
      "latent_image": ["302", 0]
    },
    "class_type": "KSamplerAdvanced",
    "_meta": {
      "title": "KSampler (Advanced)"
    }
  },
  "302": {
    "inputs": {
      "add_noise": "enable",
      "noise_seed": ["291", 0],
      "steps": ["262", 0],
      "cfg": 3,
      "sampler_name": "uni_pc",
      "scheduler": "beta",
      "start_at_step": 4,
      "end_at_step": 6,
      "return_with_leftover_noise": "enable",
      "model": ["268", 0],
      "positive": ["270", 0],
      "negative": ["270", 1],
      "latent_image": ["287", 0]
    },
    "class_type": "KSamplerAdvanced",
    "_meta": {
      "title": "KSampler (Advanced)"
    }
  },
  "305": {
    "inputs": {
      "PowerLoraLoaderHeaderWidget": {
        "type": "PowerLoraLoaderHeaderWidget"
      },
      "➕ Add Lora": "",
      "model": ["272", 0],
      "clip": ["297", 0]
    },
    "class_type": "Power Lora Loader (rgthree)",
    "_meta": {
      "title": "Power Lora Loader (rgthree)"
    }
  },
  "306": {
    "inputs": {
      "PowerLoraLoaderHeaderWidget": {
        "type": "PowerLoraLoaderHeaderWidget"
      },
      "➕ Add Lora": "",
      "model": ["275", 0],
      "clip": ["297", 0]
    },
    "class_type": "Power Lora Loader (rgthree)",
    "_meta": {
      "title": "Power Lora Loader (rgthree)"
    }
  },
  "324": {
    "inputs": {
      "crop": "none",
      "clip_vision": ["277", 0],
      "image": ["325", 0]
    },
    "class_type": "CLIPVisionEncode",
    "_meta": {
      "title": "CLIP Vision Encode"
    }
  },
  "325": {
    "inputs": {
      "image": "end_image.png"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "End Image"
    }
  }
}