export interface WorkflowSummary {
  steps: number[];
  megapixels: number[];
  samplers: string[];
  schedulers: string[];
  models: string[];
  loras: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addUnique<T>(values: T[], value: T) {
  if (!values.includes(value)) values.push(value);
}

function addNumber(values: number[], value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    addUnique(values, value);
  }
}

function addString(values: string[], value: unknown) {
  if (typeof value === 'string' && value.length > 0 && value !== 'PLACEHOLDER') {
    addUnique(values, value);
  }
}

function resolveLinkedValue(workflow: Record<string, unknown>, value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  if (typeof value[0] !== 'string') return undefined;
  const target = workflow[value[0]];
  if (!isRecord(target) || !isRecord(target.inputs)) return undefined;
  return target.inputs.value;
}

export function summarizeWorkflowJson(workflowJson: string): WorkflowSummary | null {
  let workflow: unknown;

  try {
    workflow = JSON.parse(workflowJson);
  } catch {
    return null;
  }

  if (!isRecord(workflow)) return null;

  const summary: WorkflowSummary = {
    steps: [],
    megapixels: [],
    samplers: [],
    schedulers: [],
    models: [],
    loras: [],
  };

  for (const node of Object.values(workflow)) {
    if (!isRecord(node) || !isRecord(node.inputs)) continue;

    const inputs = node.inputs;
    addNumber(summary.steps, resolveLinkedValue(workflow, inputs.steps));
    addNumber(summary.megapixels, inputs.megapixels);
    addString(summary.samplers, inputs.sampler_name);
    addString(summary.schedulers, inputs.scheduler);
    addString(summary.models, inputs.unet_name);
    addString(summary.models, inputs.ckpt_name);
    addString(summary.models, inputs.model);
    addString(summary.loras, inputs.lora_name);

    for (const [key, value] of Object.entries(inputs)) {
      if (!/^lora_\d+$/.test(key) || !isRecord(value) || value.on === false) continue;
      addString(summary.loras, value.lora);
    }
  }

  return summary;
}
