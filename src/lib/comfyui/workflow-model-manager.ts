import type { ComfyUIWorkflow } from '@/types';
import { getModelSettings } from '@/lib/database/model-settings';

export async function applyModelSettings(workflow: ComfyUIWorkflow) {
  // 모델 설정을 데이터베이스에서 가져와 적용
  const modelSettings = await getModelSettings();
  
  // High Diffusion Model 적용 (노드 272)
  if (workflow['272']?.inputs) {
    workflow['272'].inputs.unet_name = modelSettings.highDiffusionModel;
  }
  
  // Low Diffusion Model 적용 (노드 275)
  if (workflow['275']?.inputs) {
    workflow['275'].inputs.unet_name = modelSettings.lowDiffusionModel;
  }
  
  // Text Encoder 적용 (노드 297)
  if (workflow['297']?.inputs) {
    workflow['297'].inputs.clip_name = modelSettings.textEncoder;
  }
  
  // VAE 적용 (노드 294)
  if (workflow['294']?.inputs) {
    workflow['294'].inputs.vae_name = modelSettings.vae;
  }
  
  // Upscale Model 적용 (노드 276)
  if (workflow['276']?.inputs) {
    workflow['276'].inputs.model_name = modelSettings.upscaleModel;
  }
  
  // CLIP Vision 적용 (노드 277)
  if (workflow['277']?.inputs) {
    workflow['277'].inputs.clip_name = modelSettings.clipVision;
  }
  
  // KSampler 설정 적용 (노드 295, 296, 301, 302)
  const ksamplerNodes = ['295', '296', '301', '302'];
  for (const nodeId of ksamplerNodes) {
    if (workflow[nodeId]?.inputs) {
      workflow[nodeId].inputs.sampler_name = modelSettings.ksampler;
    }
  }
  
  // CFG 설정 적용 (각 파이프라인의 첫 번째: 설정값, 두 번째: 1)
  // High 파이프라인: 295(설정값) → 296(1)
  if (workflow['295']?.inputs) {
    workflow['295'].inputs.cfg = modelSettings.highCfg;
  }
  if (workflow['296']?.inputs) {
    workflow['296'].inputs.cfg = 1;
  }
  
  // Low 파이프라인: 302(설정값) → 301(1) 
  if (workflow['302']?.inputs) {
    workflow['302'].inputs.cfg = modelSettings.lowCfg;
  }
  if (workflow['301']?.inputs) {
    workflow['301'].inputs.cfg = 1;
  }
  
  // Shift 설정 적용 (ModelSamplingSD3 노드 268, 282)
  if (workflow['268']?.inputs) {
    workflow['268'].inputs.shift = modelSettings.lowShift;
  }
  if (workflow['282']?.inputs) {
    workflow['282'].inputs.shift = modelSettings.highShift;
  }
  
  console.log('⚙️ 모델 설정 적용 완료:', {
    highModel: modelSettings.highDiffusionModel,
    lowModel: modelSettings.lowDiffusionModel,
    textEncoder: modelSettings.textEncoder,
    vae: modelSettings.vae,
    upscaleModel: modelSettings.upscaleModel,
    clipVision: modelSettings.clipVision,
    sampler: modelSettings.ksampler,
    highCfg: modelSettings.highCfg,
    lowCfg: modelSettings.lowCfg,
    highShift: modelSettings.highShift,
    lowShift: modelSettings.lowShift,
  });
  
  return modelSettings;
}