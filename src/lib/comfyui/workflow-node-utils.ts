import type { ComfyUIWorkflow, GenerationParams } from '@/types';
import { getNegativePrompt, getQualityPrompt, getVideoResolution } from '@/lib/database/system-settings';
import { createLogger } from '@/lib/logger';

const log = createLogger('comfyui');

export function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  // End Image가 없을 때 관련 노드들을 우회하는 로직
  
  // 노드 270, 289에서 end_image와 clip_vision_end_image 연결을 제거하고 start_image로 대체
  if (workflow['270']?.inputs) {
    delete workflow['270'].inputs.clip_vision_end_image;
    delete workflow['270'].inputs.end_image;
  }
  
  if (workflow['289']?.inputs) {
    delete workflow['289'].inputs.clip_vision_end_image;
    delete workflow['289'].inputs.end_image;
  }
  
  // End Image 관련 노드들을 워크플로우에서 제거
  if (workflow['324']?.inputs) {
    delete workflow['324'];
    log.info('Node 324 (End Image CLIP Vision Encode) removed');
  }
  
  if (workflow['325']?.inputs) {
    delete workflow['325'];
    log.info('Node 325 (End Image LoadImage) removed');
  }
  
  log.info('End Image bypass complete');
}

export async function applyPromptSettings(workflow: ComfyUIWorkflow, params: GenerationParams) {
  // 프롬프트 설정 적용 (노드 300: Positive)
  if (workflow['300']?.inputs) {
    workflow['300'].inputs.positive = params.prompt;
  }
  
  // 네거티브 프롬프트 설정 (노드 266: Negative)
  const negativePrompt = await getNegativePrompt();
  if (workflow['266']?.inputs) {
    workflow['266'].inputs.negative = negativePrompt;
  }
  
  log.info('Prompt settings applied', {
    prompt: params.prompt,
    negativePrompt,
  });
}

export async function applyImageSettings(workflow: ComfyUIWorkflow, params: GenerationParams) {
  if (workflow['299']?.inputs) {
    workflow['299'].inputs.image = params.inputImage;
  }

  const endImage = 'endImage' in params ? params.endImage : undefined;
  if (endImage) {
    if (workflow['325']?.inputs) {
      workflow['325'].inputs.image = endImage;
    }
  } else {
    handleEndImageBypass(workflow);
  }

  log.info('Image settings applied', {
    inputImage: params.inputImage ? '설정됨' : '없음',
    endImage: endImage ? '설정됨' : '없음 (우회 처리)',
  });
}

export async function applyGenerationSettings(workflow: ComfyUIWorkflow, params: GenerationParams) {
  const videoLength = 'videoLength' in params ? params.videoLength : undefined;
  if (videoLength) {
    if (workflow['269']?.inputs) {
      workflow['269'].inputs.value = videoLength;
    }
  }

  const videoResolution = await getVideoResolution();
  if (workflow['311']?.inputs) {
    workflow['311'].inputs.Value_A = videoResolution;
    workflow['311'].inputs.Value_B = videoResolution;
  }

  const qualityPrompt = await getQualityPrompt();
  if (qualityPrompt && workflow['293']?.inputs) {
    workflow['293'].inputs.positive = qualityPrompt;
  }

  log.info('Generation settings applied', {
    videoLength: videoLength || '기본값 사용',
    videoResolution,
    qualityPrompt: qualityPrompt || '없음',
  });
}

export function validateWorkflowNodes(workflow: ComfyUIWorkflow): boolean {
  const requiredNodes = ['266', '269', '272', '275', '293', '294', '297', '299', '300'];
  const missingNodes = requiredNodes.filter(nodeId => !workflow[nodeId]);
  
  if (missingNodes.length > 0) {
    log.error('Required workflow nodes missing', { missingNodes });
    return false;
  }
  
  log.info('Workflow node validation passed');
  return true;
}