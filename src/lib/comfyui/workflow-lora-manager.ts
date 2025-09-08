import type { ComfyUIWorkflow, LoRAPresetItem } from '@/types';
import type { ComfyUIServer } from './server-manager';

interface LoRAPreset {
  presetName: string;
  loraItems: LoRAPresetItem[];
}

interface WorkflowNode {
  inputs: Record<string, unknown>;
  class_type: string;
  _meta?: { title: string };
}

export function applyLoraPreset(workflow: ComfyUIWorkflow, loraPreset: LoRAPreset, server?: ComfyUIServer) {
  // HIGH와 LOW 그룹을 독립적으로 처리하고 각 그룹 내에서 중복 제거
  const processedHighLoras = processLoraGroup(
    loraPreset.loraItems.filter((item: LoRAPresetItem) => item.group === 'HIGH'),
    'HIGH'
  );
  const processedLowLoras = processLoraGroup(
    loraPreset.loraItems.filter((item: LoRAPresetItem) => item.group === 'LOW'),
    'LOW'
  );
  
  // 305번 노드 (HIGH 모델용 LoRA) - HIGH 그룹만 적용
  if (workflow['305'] && workflow['305'].inputs) {
    applyLorasToNode(workflow['305'] as WorkflowNode, processedHighLoras, 'HIGH', 305, server);
  }
  
  // 306번 노드 (LOW 모델용 LoRA) - LOW 그룹만 적용
  if (workflow['306'] && workflow['306'].inputs) {
    applyLorasToNode(workflow['306'] as WorkflowNode, processedLowLoras, 'LOW', 306, server);
  }
  
  console.log('🎨 LoRA 프리셋 적용 완료:', {
    presetName: loraPreset.presetName,
    totalProcessed: processedHighLoras.length + processedLowLoras.length,
    highCount: processedHighLoras.length,
    lowCount: processedLowLoras.length,
    highDuplicatesRemoved: loraPreset.loraItems.filter((item: LoRAPresetItem) => item.group === 'HIGH').length - processedHighLoras.length,
    lowDuplicatesRemoved: loraPreset.loraItems.filter((item: LoRAPresetItem) => item.group === 'LOW').length - processedLowLoras.length
  });
}

function processLoraGroup(groupItems: LoRAPresetItem[], groupName: string) {
  // 각 그룹 내에서 중복된 LoRA 파일명 처리 (가장 마지막 order가 우선)
  const loraMap = new Map();
  
  // order 기준으로 정렬하여 가장 마지막 설정이 우선되도록 함
  const sortedItems = groupItems.sort((a: LoRAPresetItem, b: LoRAPresetItem) => a.order - b.order);
  
  sortedItems.forEach((item: LoRAPresetItem) => {
    // 동일한 파일명이 있으면 나중 order가 덮어쓰기
    loraMap.set(item.loraFilename, item);
  });
  
  const uniqueLoras = Array.from(loraMap.values());
  
  if (groupItems.length > uniqueLoras.length) {
    console.log(`🔄 ${groupName} 그룹에서 중복 제거:`, {
      원본개수: groupItems.length,
      중복제거후: uniqueLoras.length,
      제거된개수: groupItems.length - uniqueLoras.length,
      중복된파일들: groupItems.filter(item => 
        !uniqueLoras.some(unique => unique.id === item.id)
      ).map(item => item.loraFilename)
    });
  }
  
  return uniqueLoras;
}

function applyLorasToNode(node: WorkflowNode, loras: LoRAPresetItem[], groupName: string, nodeNumber: number, server?: ComfyUIServer) {
  const nodeInputs = node.inputs;
  
  // 기존 lora_X 필드들을 모두 제거 (PowerLoraLoaderHeaderWidget와 "➕ Add Lora"는 유지)
  Object.keys(nodeInputs).forEach(key => {
    if (key.startsWith('lora_')) {
      delete nodeInputs[key];
    }
  });
  
  // 처리된 LoRA들을 순서대로 적용
  loras.forEach((lora: LoRAPresetItem, index: number) => {
    const loraKey = `lora_${index + 1}`;
    
    // 서버 타입에 따라 경로 구분자 처리
    let processedFilename = lora.loraFilename;
    
    if (server?.type === 'RUNPOD') {
      // Runpod 환경: 백슬래시를 슬래시로 변환
      processedFilename = lora.loraFilename.replace(/\\/g, '/');
    }
    
    nodeInputs[loraKey] = {
      on: true,
      lora: processedFilename,
      strength: lora.strength
    };
  });
  
  console.log(`🔗 ${groupName} LoRA 적용 (노드 ${nodeNumber}):`, {
    count: loras.length,
    loras: loras.map(lora => ({
      filename: lora.loraFilename,
      name: lora.loraName,
      strength: lora.strength,
      order: lora.order
    }))
  });
}