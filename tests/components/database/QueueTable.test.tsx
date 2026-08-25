import { vi } from 'vitest';
import { CollapsiblePrompt, QueueTable } from '@/components/database/QueueTable';
import { renderToStaticMarkup } from 'react-dom/server';

const promptExpansionState = vi.hoisted(() => ({ value: false }));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();

  return {
    ...actual,
    useState: <T,>(initialValue: T) => {
      const currentValue = promptExpansionState.value ? true as T : initialValue;

      return [
        currentValue,
        (nextValue: T | ((previousValue: T) => T)) => {
          const resolvedValue = typeof nextValue === 'function'
            ? (nextValue as (previousValue: T) => T)(currentValue)
            : nextValue;
          promptExpansionState.value = resolvedValue as boolean;
        },
      ];
    },
  };
});

beforeEach(() => {
  promptExpansionState.value = false;
});

describe('CollapsiblePrompt', () => {
  it('renders a multiline prompt collapsed and expands it on click', () => {
    const prompt = 'fake first line\nfake second line\nfake third line';
    const collapsed = CollapsiblePrompt({ prompt });

    expect(collapsed.props.children).toBe(prompt);
    expect(collapsed.props.className).toContain('whitespace-pre-wrap');
    expect(collapsed.props.className).toContain('line-clamp-2');

    collapsed.props.onClick();

    const expanded = CollapsiblePrompt({ prompt });
    expect(expanded.props.children).toBe(prompt);
    expect(expanded.props.className).toContain('whitespace-pre-wrap');
    expect(expanded.props.className).not.toContain('line-clamp-2');
  });
});

describe('QueueTable H3 metadata', () => {
  it('renders reference metadata and separate start and end images by model capability', () => {
    const markup = renderToStaticMarkup(
      <QueueTable
        data={[
          {
            id: 'reference-request',
            position: 1,
            nickname: 'ReferenceUser',
            status: 'PENDING',
            prompt: 'fake reference prompt',
            videoModel: 'h3-ref2va',
            generationMode: 'REFERENCE',
            resolutionMode: 'first_image',
            workflowSummary: {
              steps: [19, 31],
              megapixels: [1.25],
              samplers: ['fake_sampler_a', 'fake_sampler_b'],
              schedulers: ['fake_scheduler_a'],
              models: ['fake_model_a.safetensors', 'fake_model_b.safetensors'],
              loras: ['fake_lora_a.safetensors', 'fake_lora_b.safetensors'],
            },
            referenceFiles: [
              {
                kind: 'IMAGE',
                slot: 0,
                filename: 'fake-reference.png',
                includeSoundtrack: false,
                audioPresetName: null,
              },
              {
                kind: 'VIDEO',
                slot: 1,
                filename: 'fake-reference.mp4',
                includeSoundtrack: true,
                audioPresetName: null,
              },
              {
                kind: 'AUDIO',
                slot: 0,
                filename: 'fake-reference.wav',
                includeSoundtrack: false,
                audioPresetName: 'Fake Audio Preset',
              },
            ],
          },
          {
            id: 'start-end-request',
            position: 2,
            nickname: 'StartEndUser',
            status: 'PENDING',
            prompt: 'fake start and end prompt',
            videoModel: 'h3-fl2va',
            generationMode: 'START_END',
            imageFile: 'fake-start.png',
            endImageFile: 'fake-end.png',
            workflowSummary: null,
          },
        ]}
        sort={{ orderBy: null, orderDirection: 'desc' }}
        expandedItems={new Set(['queue-0', 'queue-1'])}
        onSort={() => undefined}
        onToggleExpand={() => undefined}
      />
    );

    expect(markup).toContain('이미지 1 · 영상 1 · 오디오 1');
    expect(markup).toContain('레퍼런스:');
    expect(markup).toContain('이미지 #0: fake-reference.png');
    expect(markup).toContain('영상 #1: fake-reference.mp4 (사운드트랙)');
    expect(markup).toContain('오디오 #0: fake-reference.wav · Fake Audio Preset');
    expect(markup).toContain('해상도:');
    expect(markup).toContain('첫 이미지 비율');
    expect(markup).toContain('시작 이미지:');
    expect(markup).toContain('fake-start.png');
    expect(markup).toContain('끝 이미지:');
    expect(markup).toContain('fake-end.png');
    expect(markup).toContain('생성 설정:');
    expect(markup).toContain('Steps:');
    expect(markup).toContain('19 / 31');
    expect(markup).toContain('MP:');
    expect(markup).toContain('1.25');
    expect(markup).toContain('샘플러:');
    expect(markup).toContain('fake_sampler_a / fake_sampler_b');
    expect(markup).toContain('스케줄러:');
    expect(markup).toContain('fake_scheduler_a');
    expect(markup).toContain('fake_model_a.safetensors');
    expect(markup).toContain('fake_model_b.safetensors');
    expect(markup).toContain('fake_lora_a.safetensors');
    expect(markup).toContain('fake_lora_b.safetensors');
    expect(markup.match(/생성 설정:/g)).toHaveLength(1);
  });
});
