import type { ComfyUIWorkflow, LoRAPresetItem } from '@/types';
import type { ComfyUIServer } from '../../server-manager';
import { LoRABundleService } from '@/lib/database/lora-bundles';
import { createLogger } from '@/lib/logger';
import { deduplicateByFilename } from '../lora-utils';

const log = createLogger('comfyui');

interface LoRAPreset {
  presetName: string;
  loraItems: LoRAPresetItem[];
}

interface WorkflowNode {
  inputs: Record<string, unknown>;
  class_type: string;
  _meta?: { title: string };
}

const HIGH_NODE_ID = '65';
const LOW_NODE_ID = '66';

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

  if (workflow[HIGH_NODE_ID] && workflow[HIGH_NODE_ID].inputs) {
    applyLorasToNode(workflow[HIGH_NODE_ID] as WorkflowNode, processedHighLoras, 'HIGH', HIGH_NODE_ID, server);
  }

  if (workflow[LOW_NODE_ID] && workflow[LOW_NODE_ID].inputs) {
    applyLorasToNode(workflow[LOW_NODE_ID] as WorkflowNode, processedLowLoras, 'LOW', LOW_NODE_ID, server);
  }

  log.info('LoRA preset applied', {
    presetName: loraPreset.presetName,
    totalProcessed: processedHighLoras.length + processedLowLoras.length,
    highCount: processedHighLoras.length,
    lowCount: processedLowLoras.length,
    highDuplicatesRemoved: loraPreset.loraItems.filter((item: LoRAPresetItem) => item.group === 'HIGH').length - processedHighLoras.length,
    lowDuplicatesRemoved: loraPreset.loraItems.filter((item: LoRAPresetItem) => item.group === 'LOW').length - processedLowLoras.length
  });
}

export function removeLoraPlaceholder(workflow: ComfyUIWorkflow) {
  delete workflow[HIGH_NODE_ID];
  delete workflow[LOW_NODE_ID];

  if (workflow['20']?.inputs) {
    workflow['20'].inputs.model = ['22', 0];
  }
  if (workflow['19']?.inputs) {
    workflow['19'].inputs.model = ['9', 0];
  }
  if (workflow['23']?.inputs) {
    workflow['23'].inputs.clip = ['13', 0];
  }
  if (workflow['24']?.inputs) {
    workflow['24'].inputs.clip = ['13', 0];
  }
  if (workflow['27']?.inputs) {
    workflow['27'].inputs.clip = ['13', 0];
  }
  if (workflow['28']?.inputs) {
    workflow['28'].inputs.clip = ['13', 0];
  }

  log.info('LoRA placeholder removed — wiring restored to direct model/clip chain');
}

function processLoraGroup(groupItems: LoRAPresetItem[], groupName: string) {
  return deduplicateByFilename(groupItems, groupName);
}

function applyLorasToNode(node: WorkflowNode, loras: LoRAPresetItem[], groupName: string, nodeId: string, server?: ComfyUIServer) {
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

  log.info('LoRA applied to node', {
    group: groupName,
    nodeId,
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
        log.info('LoRA bundle dynamic update', {
          loraName: item.loraName,
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
    log.error('LoRA dynamic resolution failed, using original data', { error: error instanceof Error ? error.message : String(error) });
    return loraItems;
  }
}
