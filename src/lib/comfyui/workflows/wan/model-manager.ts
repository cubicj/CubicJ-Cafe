import type { ComfyUIWorkflow } from '@/types';
import { getModelSettings } from '@/lib/database/model-settings';

export async function applyModelSettings(workflow: ComfyUIWorkflow) {
  const modelSettings = await getModelSettings();

  if (workflow['272']?.inputs) {
    workflow['272'].inputs.unet_name = modelSettings.highDiffusionModel;
  }

  if (workflow['275']?.inputs) {
    workflow['275'].inputs.unet_name = modelSettings.lowDiffusionModel;
  }

  if (workflow['297']?.inputs) {
    workflow['297'].inputs.clip_name = modelSettings.textEncoder;
  }

  if (workflow['294']?.inputs) {
    workflow['294'].inputs.vae_name = modelSettings.vae;
  }

  if (workflow['276']?.inputs) {
    workflow['276'].inputs.model_name = modelSettings.upscaleModel;
  }

  if (workflow['277']?.inputs) {
    workflow['277'].inputs.clip_name = modelSettings.clipVision;
  }

  const ksamplerNodes = ['295', '296', '301', '302'];
  for (const nodeId of ksamplerNodes) {
    if (workflow[nodeId]?.inputs) {
      workflow[nodeId].inputs.sampler_name = modelSettings.ksampler;
    }
  }

  if (workflow['295']?.inputs) {
    workflow['295'].inputs.cfg = modelSettings.highCfg;
  }
  if (workflow['296']?.inputs) {
    workflow['296'].inputs.cfg = 1;
  }

  if (workflow['302']?.inputs) {
    workflow['302'].inputs.cfg = modelSettings.lowCfg;
  }
  if (workflow['301']?.inputs) {
    workflow['301'].inputs.cfg = 1;
  }

  if (workflow['268']?.inputs) {
    workflow['268'].inputs.shift = modelSettings.lowShift;
  }
  if (workflow['282']?.inputs) {
    workflow['282'].inputs.shift = modelSettings.highShift;
  }

  console.log('⚙️ Model settings applied:', {
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
