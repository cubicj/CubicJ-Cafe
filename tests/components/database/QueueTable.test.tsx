import { QueueTable } from '@/components/database/QueueTable';
import { renderToStaticMarkup } from 'react-dom/server';

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
  });
});
