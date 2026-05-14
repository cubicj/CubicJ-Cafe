import { getQueueDetailTags, getQueueDisplayDurationSeconds } from '@/components/queue/queue-detail-tags';

describe('getQueueDetailTags', () => {
  it('groups request metadata and optional flags into one ordered tag list', () => {
    const tags = getQueueDetailTags({
      modelLabel: 'LTX 2.3',
      modelClassName: 'model-class',
      modeLabel: 'Loop',
      modeClassName: 'mode-class',
      durationSeconds: 7,
      isNSFW: true,
      loraName: 'Fake LoRA',
      audioPresetName: 'Fake Audio',
    });

    expect(tags.map((tag) => tag.label)).toEqual([
      'LTX 2.3',
      'Loop',
      '7초',
      'NSFW',
      'LoRA: Fake LoRA',
      '오디오: Fake Audio',
    ]);
    expect(tags.find((tag) => tag.key === 'nsfw')?.variant).toBe('destructive');
  });

  it('omits optional tags when request options are absent', () => {
    const tags = getQueueDetailTags({
      modelLabel: 'WAN 2.2',
      modelClassName: 'model-class',
      modeLabel: 'Base',
      modeClassName: 'mode-class',
      durationSeconds: 5,
      isNSFW: false,
    });

    expect(tags.map((tag) => tag.key)).toEqual(['model', 'mode', 'duration']);
  });

  it('shows fractional actual seconds when provided', () => {
    const tags = getQueueDetailTags({
      modelLabel: 'LTX 2.3',
      modelClassName: 'model-class',
      modeLabel: 'Base',
      modeClassName: 'mode-class',
      durationSeconds: 7.7,
      isNSFW: false,
    });

    expect(tags.find((tag) => tag.key === 'duration')?.label).toBe('7.7초');
  });

  it('uses stored actual seconds before the model duration option value', () => {
    expect(getQueueDisplayDurationSeconds(24, 7.7)).toBe(7.7);
    expect(getQueueDisplayDurationSeconds(7, null)).toBe(7);
  });
});
