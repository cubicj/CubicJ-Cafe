import type { ComfyUIWorkflow, GenerationParams } from '@/types';
import { getNegativePrompt, getQualityPrompt, getVideoResolution } from '@/lib/database/system-settings';

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
    console.log('🗑️ 노드 324 (End Image CLIP Vision Encode) 제거');
  }
  
  if (workflow['325']?.inputs) {
    delete workflow['325'];
    console.log('🗑️ 노드 325 (End Image LoadImage) 제거');
  }
  
  console.log('✅ End Image 우회 처리 완료');
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
  
  console.log('📝 프롬프트 설정 적용 완료:', {
    prompt: params.prompt,
    negativePrompt: negativePrompt,
  });
}

export async function applyImageSettings(workflow: ComfyUIWorkflow, params: GenerationParams) {
  // 이미지 업로드 처리 (노드 299: Start Image)
  if (workflow['299']?.inputs) {
    workflow['299'].inputs.image = params.inputImage;
  }
  
  // End Image 처리
  if (params.endImage) {
    if (workflow['325']?.inputs) {
      workflow['325'].inputs.image = params.endImage;
    }
  } else {
    handleEndImageBypass(workflow);
  }
  
  console.log('🖼️ 이미지 설정 적용 완료:', {
    inputImage: params.inputImage ? '설정됨' : '없음',
    endImage: params.endImage ? '설정됨' : '없음 (우회 처리)',
  });
}

export async function applyGenerationSettings(workflow: ComfyUIWorkflow, params: GenerationParams) {
  // 비디오 길이 설정 (노드 269: Length)
  if (params.videoLength) {
    if (workflow['269']?.inputs) {
      workflow['269'].inputs.value = params.videoLength;
    }
  }
  
  // 영상 해상도 설정 (노드 311: DF_Multiply - 목표 해상도)
  const videoResolution = await getVideoResolution();
  if (workflow['311']?.inputs) {
    workflow['311'].inputs.Value_A = videoResolution;
    workflow['311'].inputs.Value_B = videoResolution;
  }
  
  // 품질 프롬프트 추가 (노드 293: Quality)
  const qualityPrompt = await getQualityPrompt();
  if (qualityPrompt && workflow['293']?.inputs) {
    workflow['293'].inputs.positive = qualityPrompt;
  }
  
  console.log('⚙️ 생성 설정 적용 완료:', {
    videoLength: params.videoLength || '기본값 사용',
    videoResolution: videoResolution,
    qualityPrompt: qualityPrompt || '없음',
  });
}

export function validateWorkflowNodes(workflow: ComfyUIWorkflow): boolean {
  const requiredNodes = ['266', '269', '272', '275', '293', '294', '297', '299', '300'];
  const missingNodes = requiredNodes.filter(nodeId => !workflow[nodeId]);
  
  if (missingNodes.length > 0) {
    console.error('❌ 필수 워크플로우 노드 누락:', missingNodes);
    return false;
  }
  
  console.log('✅ 워크플로우 노드 유효성 검사 통과');
  return true;
}