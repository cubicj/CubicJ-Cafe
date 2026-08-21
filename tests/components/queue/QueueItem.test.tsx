import { formatAbsoluteTime } from '@/components/queue/QueueItem';

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
