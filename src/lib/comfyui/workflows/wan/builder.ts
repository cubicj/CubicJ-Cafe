import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import type { WanGenerationParams } from '../types'
import { applyModelSettings } from './model-manager'
import { applyLoraPreset } from './lora-manager'
import {
  applyPromptSettings,
  applyImageSettings,
  applyGenerationSettings,
  validateWorkflowNodes
} from '../../workflow-node-utils'
import { WAN_WORKFLOW_TEMPLATE } from './template'


export async function buildWanWorkflow(params: WanGenerationParams, server?: ComfyUIServer): Promise<ComfyUIWorkflow> {
  const workflow = JSON.parse(JSON.stringify(WAN_WORKFLOW_TEMPLATE))

  if (!validateWorkflowNodes(workflow)) {
    throw new Error('워크플로우 템플릿이 유효하지 않습니다');
  }

  await applyModelSettings(workflow);

  await applyPromptSettings(workflow, params);

  await applyImageSettings(workflow, params);

  await applyGenerationSettings(workflow, params);

  if (workflow['291']) {
    workflow['291'].inputs.seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF);
  }

  if (workflow['285'] && params.inputImage) {
    const baseImageName = params.inputImage.replace(/\.(png|jpg|jpeg)$/i, '');
    workflow['285'].inputs.filename_prefix = `WAN/${baseImageName}`;
  }

  if (params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    await applyLoraPreset(workflow, params.loraPreset, server);
  }


  return workflow
}
