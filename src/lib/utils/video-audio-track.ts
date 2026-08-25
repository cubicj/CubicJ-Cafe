export type AudioTrackPresence = 'present' | 'absent' | 'unknown';

interface BmffBox {
  type: string;
  payloadStart: number;
  end: number;
}

interface EbmlVint {
  value: number;
  length: number;
  unknown: boolean;
}

interface EbmlElement {
  id: number;
  payloadStart: number;
  end: number;
  unknownSize: boolean;
}

const BMFF_FIRST_BOX_TYPES = new Set(['ftyp', 'moov', 'mdat', 'free', 'skip', 'wide', 'moof', 'pdin', 'uuid']);
const EBML_ID = 0x1a45dfa3;
const SEGMENT_ID = 0x18538067;
const TRACKS_ID = 0x1654ae6b;
const TRACK_ENTRY_ID = 0xae;
const TRACK_TYPE_ID = 0x83;

function readUint32(data: Uint8Array, offset: number): number {
  return data[offset] * 0x1000000 + data[offset + 1] * 0x10000 + data[offset + 2] * 0x100 + data[offset + 3];
}

function readUint64(data: Uint8Array, offset: number): number {
  return readUint32(data, offset) * 0x100000000 + readUint32(data, offset + 4);
}

function readAscii(data: Uint8Array, offset: number): string | null {
  if (offset < 0 || offset + 4 > data.length) return null;
  for (let index = offset; index < offset + 4; index += 1) {
    if (data[index] < 0x20 || data[index] > 0x7e) return null;
  }
  return String.fromCharCode(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
}

function readBmffBox(data: Uint8Array, offset: number, limit: number): BmffBox | null {
  if (offset < 0 || limit > data.length || offset + 8 > limit) return null;
  const size32 = readUint32(data, offset);
  const type = readAscii(data, offset + 4);
  if (!type) return null;

  let headerSize = 8;
  let size = size32;
  if (size32 === 1) {
    if (offset + 16 > limit) return null;
    headerSize = 16;
    size = readUint64(data, offset + 8);
  } else if (size32 === 0) {
    size = limit - offset;
  }

  if (!Number.isSafeInteger(size) || size < headerSize) return null;
  const end = offset + size;
  if (!Number.isSafeInteger(end) || end <= offset || end > limit) return null;
  return { type, payloadStart: offset + headerSize, end };
}

function inspectMdia(data: Uint8Array, start: number, end: number): { valid: boolean; audio: boolean } {
  let offset = start;
  let audio = false;
  while (offset < end) {
    const box = readBmffBox(data, offset, end);
    if (!box) return { valid: false, audio: false };
    if (box.type === 'hdlr') {
      if (box.payloadStart + 12 > box.end) return { valid: false, audio: false };
      const handlerType = readAscii(data, box.payloadStart + 8);
      if (!handlerType) return { valid: false, audio: false };
      audio ||= handlerType === 'soun';
    }
    offset = box.end;
  }
  return { valid: offset === end, audio };
}

function inspectTrak(data: Uint8Array, start: number, end: number): { valid: boolean; audio: boolean } {
  let offset = start;
  let audio = false;
  while (offset < end) {
    const box = readBmffBox(data, offset, end);
    if (!box) return { valid: false, audio: false };
    if (box.type === 'mdia') {
      const result = inspectMdia(data, box.payloadStart, box.end);
      if (!result.valid) return result;
      audio ||= result.audio;
    }
    offset = box.end;
  }
  return { valid: offset === end, audio };
}

function inspectMoov(data: Uint8Array, start: number, end: number): { valid: boolean; audio: boolean } {
  let offset = start;
  let audio = false;
  while (offset < end) {
    const box = readBmffBox(data, offset, end);
    if (!box) return { valid: false, audio: false };
    if (box.type === 'trak') {
      const result = inspectTrak(data, box.payloadStart, box.end);
      if (!result.valid) return result;
      audio ||= result.audio;
    }
    offset = box.end;
  }
  return { valid: offset === end, audio };
}

function detectBmffAudioTrack(data: Uint8Array): AudioTrackPresence {
  const firstType = readAscii(data, 4);
  if (!firstType || !BMFF_FIRST_BOX_TYPES.has(firstType)) return 'unknown';

  let offset = 0;
  let foundMoov = false;
  let foundAudio = false;
  while (offset < data.length) {
    const box = readBmffBox(data, offset, data.length);
    if (!box) return 'unknown';
    if (box.type === 'moov') {
      const result = inspectMoov(data, box.payloadStart, box.end);
      if (!result.valid) return 'unknown';
      foundMoov = true;
      foundAudio ||= result.audio;
    }
    offset = box.end;
  }

  if (offset !== data.length || !foundMoov) return 'unknown';
  return foundAudio ? 'present' : 'absent';
}

function readEbmlVint(data: Uint8Array, offset: number, limit: number, keepMarker: boolean): EbmlVint | null {
  if (offset < 0 || offset >= limit || limit > data.length) return null;
  const first = data[offset];
  let length = 1;
  let marker = 0x80;
  while (length <= 8 && (first & marker) === 0) {
    length += 1;
    marker >>= 1;
  }
  if (length > 8 || offset + length > limit || (keepMarker && length > 4)) return null;

  const firstPayload = first & (marker - 1);
  let allOnes = firstPayload === marker - 1;
  let value = keepMarker ? first : firstPayload;
  for (let index = 1; index < length; index += 1) {
    const byte = data[offset + index];
    allOnes &&= byte === 0xff;
    value = value * 0x100 + byte;
  }
  if (!Number.isSafeInteger(value)) return null;
  return { value, length, unknown: !keepMarker && allOnes };
}

function readEbmlElement(data: Uint8Array, offset: number, limit: number): EbmlElement | null {
  const id = readEbmlVint(data, offset, limit, true);
  if (!id) return null;
  const size = readEbmlVint(data, offset + id.length, limit, false);
  if (!size) return null;
  const payloadStart = offset + id.length + size.length;
  const end = size.unknown ? limit : payloadStart + size.value;
  if (!Number.isSafeInteger(end) || end < payloadStart || end > limit) return null;
  return { id: id.value, payloadStart, end, unknownSize: size.unknown };
}

function validateEbmlChildren(data: Uint8Array, start: number, end: number): boolean {
  let offset = start;
  while (offset < end) {
    const element = readEbmlElement(data, offset, end);
    if (!element || element.end <= offset) return false;
    offset = element.end;
  }
  return offset === end;
}

function readEbmlUnsigned(data: Uint8Array, start: number, end: number): number | null {
  const length = end - start;
  if (length < 1 || length > 8) return null;
  let value = 0;
  for (let offset = start; offset < end; offset += 1) {
    value = value * 0x100 + data[offset];
  }
  return Number.isSafeInteger(value) ? value : null;
}

function inspectTrackEntry(data: Uint8Array, start: number, end: number): { valid: boolean; audio: boolean } {
  let offset = start;
  let audio = false;
  while (offset < end) {
    const element = readEbmlElement(data, offset, end);
    if (!element || element.end <= offset) return { valid: false, audio: false };
    if (element.id === TRACK_TYPE_ID) {
      const trackType = readEbmlUnsigned(data, element.payloadStart, element.end);
      if (trackType === null) return { valid: false, audio: false };
      audio ||= trackType === 2;
    }
    offset = element.end;
  }
  return { valid: offset === end, audio };
}

function inspectTracks(data: Uint8Array, start: number, end: number): { valid: boolean; audio: boolean } {
  let offset = start;
  let audio = false;
  while (offset < end) {
    const element = readEbmlElement(data, offset, end);
    if (!element || element.end <= offset) return { valid: false, audio: false };
    if (element.id === TRACK_ENTRY_ID) {
      const result = inspectTrackEntry(data, element.payloadStart, element.end);
      if (!result.valid) return result;
      audio ||= result.audio;
    }
    offset = element.end;
  }
  return { valid: offset === end, audio };
}

function detectEbmlAudioTrack(data: Uint8Array): AudioTrackPresence {
  const header = readEbmlElement(data, 0, data.length);
  if (!header || header.id !== EBML_ID || header.unknownSize || !validateEbmlChildren(data, header.payloadStart, header.end)) {
    return 'unknown';
  }

  const segment = readEbmlElement(data, header.end, data.length);
  if (!segment || segment.id !== SEGMENT_ID) return 'unknown';

  let offset = segment.payloadStart;
  let foundTracks = false;
  let foundAudio = false;
  while (offset < segment.end) {
    const element = readEbmlElement(data, offset, segment.end);
    if (!element || element.end <= offset) return 'unknown';
    if (element.id === TRACKS_ID) {
      const result = inspectTracks(data, element.payloadStart, element.end);
      if (!result.valid) return 'unknown';
      foundTracks = true;
      foundAudio ||= result.audio;
    }
    offset = element.end;
  }

  if (offset !== segment.end || !foundTracks) return 'unknown';
  return foundAudio ? 'present' : 'absent';
}

function isGif(data: Uint8Array): boolean {
  if (data.length < 6) return false;
  const header = String.fromCharCode(data[0], data[1], data[2], data[3], data[4], data[5]);
  return header === 'GIF87a' || header === 'GIF89a';
}

export function detectVideoAudioTrack(data: Uint8Array): AudioTrackPresence {
  try {
    if (isGif(data)) return 'absent';
    if (data.length >= 4 && readUint32(data, 0) === EBML_ID) return detectEbmlAudioTrack(data);
    return detectBmffAudioTrack(data);
  } catch {
    return 'unknown';
  }
}
