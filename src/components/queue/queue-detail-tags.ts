import type { BadgeProps } from '@/components/ui/badge';

export interface QueueDetailTag {
  key: string;
  label: string;
  variant?: BadgeProps['variant'];
  className?: string;
}

interface QueueDetailTagInput {
  modelLabel: string;
  modelClassName: string;
  modeLabel: string;
  modeClassName: string;
  durationSeconds: number;
  isNSFW: boolean;
  loraName?: string | null;
  audioPresetName?: string | null;
}

export function getQueueDisplayDurationSeconds(videoDuration: number, videoDurationSeconds?: number | null): number {
  return videoDurationSeconds ?? videoDuration;
}

export function getQueueDetailTags(input: QueueDetailTagInput): QueueDetailTag[] {
  const tags: QueueDetailTag[] = [
    {
      key: 'model',
      label: input.modelLabel,
      variant: 'outline',
      className: input.modelClassName,
    },
    {
      key: 'mode',
      label: input.modeLabel,
      variant: 'outline',
      className: input.modeClassName,
    },
    {
      key: 'duration',
      label: `${input.durationSeconds}초`,
      variant: 'outline',
    },
  ];

  if (input.isNSFW) {
    tags.push({
      key: 'nsfw',
      label: 'NSFW',
      variant: 'destructive',
    });
  }

  if (input.loraName) {
    tags.push({
      key: 'lora',
      label: `LoRA: ${input.loraName}`,
      variant: 'outline',
    });
  }

  if (input.audioPresetName) {
    tags.push({
      key: 'audio-preset',
      label: `오디오: ${input.audioPresetName}`,
      variant: 'outline',
    });
  }

  return tags;
}
