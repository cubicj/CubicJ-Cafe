import type { ComfyUIWorkflow, LoRAPresetItem } from '@/types';
import type { ComfyUIServer } from '../../server-manager';
import { LoRABundleService } from '@/lib/database/lora-bundles';

interface LoRAPreset {
  presetName: string;
  loraItems: LoRAPresetItem[];
}

interface WorkflowNode {
  inputs: Record<string, unknown>;
  class_type: string;
  _meta?: { title: string };
}

export async function applyLoraPreset(workflow: ComfyUIWorkflow, loraPreset: LoRAPreset, server?: ComfyUIServer) {
  const resolvedLoraItems = await resolveLoRAItems(loraPreset.loraItems);

  const processedHighLoras = processLoraGroup(
    resolvedLoraItems.filter((item: LoRAPresetItem) => item.group === 'HIGH'),
    'HIGH'
  );
  const processedLowLoras = processLoraGroup(
    resolvedLoraItems.filter((item: LoRAPresetItem) => item.group === 'LOW'),
    'LOW'
  );

  if (workflow['305'] && workflow['305'].inputs) {
    applyLorasToNode(workflow['305'] as WorkflowNode, processedHighLoras, 'HIGH', 305, server);
  }

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
  const loraMap = new Map();

  const sortedItems = groupItems.sort((a: LoRAPresetItem, b: LoRAPresetItem) => a.order - b.order);

  sortedItems.forEach((item: LoRAPresetItem) => {
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

  Object.keys(nodeInputs).forEach(key => {
    if (key.startsWith('lora_')) {
      delete nodeInputs[key];
    }
  });

  loras.forEach((lora: LoRAPresetItem, index: number) => {
    const loraKey = `lora_${index + 1}`;

    let processedFilename = lora.loraFilename;

    if (server?.type === 'RUNPOD') {
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

async function resolveLoRAItems(loraItems: LoRAPresetItem[]): Promise<LoRAPresetItem[]> {
  const bundleItems = loraItems.filter(item => item.bundleId);
  const nonBundleItems = loraItems.filter(item => !item.bundleId);

  if (bundleItems.length === 0) {
    return loraItems;
  }

  try {
    const resolveInputs = bundleItems.map(item => ({
      bundleId: item.bundleId!,
      group: item.group,
      originalFilename: item.loraFilename
    }));

    const resolved = await LoRABundleService.resolveMultipleLoRAs(resolveInputs);

    const resolvedBundleItems = bundleItems.map((item, index) => {
      const resolvedData = resolved[index];
      const needsUpdate = resolvedData.resolvedFilename !== item.loraFilename;

      if (needsUpdate) {
        console.log(`🔄 LoRA 번들 동적 업데이트: ${item.loraName}`, {
          bundleId: item.bundleId,
          originalFilename: item.loraFilename,
          resolvedFilename: resolvedData.resolvedFilename,
          bundleDisplayName: resolvedData.bundleDisplayName
        });

        return {
          ...item,
          loraFilename: resolvedData.resolvedFilename,
          loraName: resolvedData.bundleDisplayName
            ? `${resolvedData.bundleDisplayName} (${item.group === 'HIGH' ? 'High' : 'Low'})`
            : item.loraName
        };
      }

      return item;
    });

    return [...resolvedBundleItems, ...nonBundleItems];

  } catch (error) {
    console.error('❌ LoRA 동적 해결 실패, 원본 데이터 사용:', error);
    return loraItems;
  }
}
