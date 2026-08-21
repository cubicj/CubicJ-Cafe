import { formatAbsoluteTime, QueueItem } from '@/components/queue/QueueItem';
import { renderToStaticMarkup } from 'react-dom/server';

describe('formatAbsoluteTime', () => {
  it('formats local date and time components with zero padding', () => {
    const date = new Date(2026, 0, 5, 7, 8, 9);

    expect(formatAbsoluteTime(date.toISOString())).toBe('01-05 07:08:09');
  });

  it('preserves double-digit date and time components', () => {
    const date = new Date(2026, 11, 31, 23, 59, 58);

    expect(formatAbsoluteTime(date.toISOString())).toBe('12-31 23:59:58');
  });
});

describe('QueueItem audio status', () => {
  const baseRequest = {
    id: 'request-1',
    nickname: 'TestUser',
    status: 'PENDING' as const,
    prompt: 'test prompt',
    position: 1,
    createdAt: new Date(2026, 0, 5, 7, 8, 9).toISOString(),
    videoModel: 'ltxa',
    generationMode: 'START_ONLY',
    videoDuration: 5,
    isNSFW: false,
  };

  function renderQueueItem(videoModel: string, audioFile?: string) {
    return renderToStaticMarkup(
      <QueueItem
        request={{ ...baseRequest, videoModel, audioFile }}
        isCurrentUser={false}
        canDelete={false}
        isDeleting={false}
        onDelete={() => undefined}
      />
    );
  }

  it('shows audio status only for audio-capable models', () => {
    expect(renderQueueItem('ltxa', 'reference.wav')).toContain('lucide-volume-2');
    expect(renderQueueItem('ltxa')).toContain('lucide-volume-x');
  });

  it.each(['wan', 'h3-fl2va', 'h3-ref2va'])('omits audio status for %s', (videoModel) => {
    const markup = renderQueueItem(videoModel, 'reference.wav');

    expect(markup).not.toContain('lucide-volume-2');
    expect(markup).not.toContain('lucide-volume-x');
  });
});
