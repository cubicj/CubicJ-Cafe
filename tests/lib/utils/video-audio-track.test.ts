import { detectVideoAudioTrack } from '@/lib/utils/video-audio-track';

function concat(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function ascii(value: string): Uint8Array {
  return Uint8Array.from(value, (character) => character.charCodeAt(0));
}

function uint32(value: number): Uint8Array {
  return Uint8Array.from([
    Math.floor(value / 0x1000000) & 0xff,
    Math.floor(value / 0x10000) & 0xff,
    Math.floor(value / 0x100) & 0xff,
    value & 0xff,
  ]);
}

function uint64(value: number): Uint8Array {
  return concat(uint32(Math.floor(value / 0x100000000)), uint32(value % 0x100000000));
}

function box(type: string, ...payload: Uint8Array[]): Uint8Array {
  const body = concat(...payload);
  return concat(uint32(body.length + 8), ascii(type), body);
}

function largeBox(type: string, ...payload: Uint8Array[]): Uint8Array {
  const body = concat(...payload);
  return concat(uint32(1), ascii(type), uint64(body.length + 16), body);
}

function track(handlerType: string, large = false): Uint8Array {
  const handler = box('hdlr', uint32(0), uint32(0), ascii(handlerType));
  const media = box('mdia', handler);
  return large ? largeBox('trak', media) : box('trak', media);
}

function ebmlId(value: number): Uint8Array {
  const bytes: number[] = [];
  let remaining = value;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining = Math.floor(remaining / 0x100);
  }
  return Uint8Array.from(bytes);
}

function ebmlSize(value: number): Uint8Array {
  if (value < 0x7f) return Uint8Array.of(0x80 | value);
  if (value < 0x3fff) return Uint8Array.of(0x40 | Math.floor(value / 0x100), value & 0xff);
  throw new Error('Test element is too large');
}

function ebmlElement(id: number, ...payload: Uint8Array[]): Uint8Array {
  const body = concat(...payload);
  return concat(ebmlId(id), ebmlSize(body.length), body);
}

function unknownSizeEbmlElement(id: number, ...payload: Uint8Array[]): Uint8Array {
  return concat(ebmlId(id), Uint8Array.of(0xff), ...payload);
}

function webmWithTracks(...entries: Uint8Array[]): Uint8Array {
  const header = ebmlElement(0x1a45dfa3);
  const tracks = ebmlElement(0x1654ae6b, ...entries);
  return concat(header, unknownSizeEbmlElement(0x18538067, tracks));
}

function webmTrackEntry(type: number): Uint8Array {
  return ebmlElement(0xae, ebmlElement(0x83, Uint8Array.of(type)));
}

describe('detectVideoAudioTrack', () => {
  it('detects an audio track in an MP4 with video and sound tracks', () => {
    const data = concat(box('ftyp', ascii('isom')), box('moov', track('vide'), track('soun')));

    expect(detectVideoAudioTrack(data)).toBe('present');
  });

  it('reports an MP4 with only a video track as absent', () => {
    const data = concat(box('ftyp', ascii('isom')), box('moov', track('vide')));

    expect(detectVideoAudioTrack(data)).toBe('absent');
  });

  it('finds an MP4 moov box placed after mdat', () => {
    const data = concat(box('ftyp', ascii('isom')), box('mdat', Uint8Array.of(1, 2, 3)), box('moov', track('soun')));

    expect(detectVideoAudioTrack(data)).toBe('present');
  });

  it('parses a 64-bit largesize box on the MP4 track path', () => {
    const data = concat(box('ftyp', ascii('isom')), box('moov', track('soun', true)));

    expect(detectVideoAudioTrack(data)).toBe('present');
  });

  it('reports an MP4 truncated before moov as unknown', () => {
    const data = concat(box('ftyp', ascii('isom')), Uint8Array.of(0, 0, 0, 16, 0x6d, 0x6f));

    expect(detectVideoAudioTrack(data)).toBe('unknown');
  });

  it('detects an audio TrackEntry in an unknown-size WebM Segment', () => {
    expect(detectVideoAudioTrack(webmWithTracks(webmTrackEntry(2)))).toBe('present');
  });

  it('reports WebM Tracks containing only video as absent', () => {
    expect(detectVideoAudioTrack(webmWithTracks(webmTrackEntry(1)))).toBe('absent');
  });

  it('reports WebM without a Tracks element as unknown', () => {
    const data = concat(ebmlElement(0x1a45dfa3), unknownSizeEbmlElement(0x18538067));

    expect(detectVideoAudioTrack(data)).toBe('unknown');
  });

  it('reports garbage and empty buffers as unknown', () => {
    expect(detectVideoAudioTrack(Uint8Array.of(1, 2, 3, 4))).toBe('unknown');
    expect(detectVideoAudioTrack(new Uint8Array())).toBe('unknown');
  });

  it('returns unknown for a zero-size box without hanging', () => {
    expect(detectVideoAudioTrack(concat(uint32(0), ascii('ftyp')))).toBe('unknown');
  });
});
