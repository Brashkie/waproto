import { WireType, encodeFields, fromBool, fromString, fromUint32 } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { Message } from '../src';

describe('ImageMessage (lazy)', () => {
  it('reads image fields from a Message', () => {
    // ImageMessage { url=1, mimetype=2, caption=3, fileLength=5, height=6, width=7 }
    const img = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('https://cdn.wa/img.enc') },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('image/jpeg') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('una foto') },
      { fieldNumber: 5, wireType: WireType.Varint, varint: fromUint32(204800) },
      { fieldNumber: 6, wireType: WireType.Varint, varint: fromUint32(1080) },
      { fieldNumber: 7, wireType: WireType.Varint, varint: fromUint32(1920) },
    ]);
    // Message { imageMessage = <img> } (field 3)
    const buf = encodeFields([{ fieldNumber: 3, wireType: WireType.Bytes, bytes: img }]);

    const msg = Message.decode(buf);
    expect(msg.hasMedia).toBe(true);
    const image = msg.imageMessage;
    if (image === null) throw new Error('expected imageMessage');
    expect(image.url).toBe('https://cdn.wa/img.enc');
    expect(image.mimetype).toBe('image/jpeg');
    expect(image.caption).toBe('una foto');
    expect(image.fileLength).toBe(204800n);
    expect(image.height).toBe(1080);
    expect(image.width).toBe(1920);
  });

  it('returns null for absent image fields', () => {
    const img = encodeFields([
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('image/png') },
    ]);
    const buf = encodeFields([{ fieldNumber: 3, wireType: WireType.Bytes, bytes: img }]);
    const image = Message.decode(buf).imageMessage;
    if (image === null) throw new Error('expected imageMessage');
    expect(image.mimetype).toBe('image/png');
    expect(image.caption).toBeNull();
    expect(image.fileLength).toBeNull();
    expect(image.mediaKey).toBeNull();
  });
});

describe('AudioMessage (lazy)', () => {
  it('reads a voice note (ptt) with duration', () => {
    // AudioMessage { url=1, mimetype=2, fileLength=4, seconds=5, ptt=6 }
    const audio = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('https://cdn.wa/aud.enc') },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('audio/ogg; codecs=opus') },
      { fieldNumber: 4, wireType: WireType.Varint, varint: fromUint32(51200) },
      { fieldNumber: 5, wireType: WireType.Varint, varint: fromUint32(12) },
      { fieldNumber: 6, wireType: WireType.Varint, varint: fromBool(true) },
    ]);
    // Message { audioMessage = <audio> } (field 8)
    const buf = encodeFields([{ fieldNumber: 8, wireType: WireType.Bytes, bytes: audio }]);

    const msg = Message.decode(buf);
    expect(msg.hasMedia).toBe(true);
    const a = msg.audioMessage;
    if (a === null) throw new Error('expected audioMessage');
    expect(a.url).toBe('https://cdn.wa/aud.enc');
    expect(a.mimetype).toBe('audio/ogg; codecs=opus');
    expect(a.fileLength).toBe(51200n);
    expect(a.seconds).toBe(12);
    expect(a.ptt).toBe(true);
    expect(a.isVoiceNote).toBe(true);
  });

  it('distinguishes audio file from voice note', () => {
    // ptt absent → not a voice note
    const audio = encodeFields([
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('audio/mp4') },
    ]);
    const buf = encodeFields([{ fieldNumber: 8, wireType: WireType.Bytes, bytes: audio }]);
    const a = Message.decode(buf).audioMessage;
    if (a === null) throw new Error('expected audioMessage');
    expect(a.ptt).toBeNull();
    expect(a.isVoiceNote).toBe(false);
  });
});

describe('Media: full field coverage (validates every field number)', () => {
  it('ImageMessage reads all fields', () => {
    const img = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('url') },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('image/webp') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('cap') },
      { fieldNumber: 4, wireType: WireType.Bytes, bytes: Buffer.from([1, 2, 3, 4]) },
      { fieldNumber: 5, wireType: WireType.Varint, varint: fromUint32(999) },
      { fieldNumber: 6, wireType: WireType.Varint, varint: fromUint32(100) },
      { fieldNumber: 7, wireType: WireType.Varint, varint: fromUint32(200) },
      { fieldNumber: 8, wireType: WireType.Bytes, bytes: Buffer.from([5, 6]) },
      { fieldNumber: 9, wireType: WireType.Bytes, bytes: Buffer.from([7, 8]) },
      { fieldNumber: 11, wireType: WireType.Bytes, bytes: fromString('/v/path') },
    ]);
    const buf = encodeFields([{ fieldNumber: 3, wireType: WireType.Bytes, bytes: img }]);
    const i = Message.decode(buf).imageMessage;
    if (i === null) throw new Error('expected imageMessage');
    expect(i.fileSha256?.equals(Buffer.from([1, 2, 3, 4]))).toBe(true);
    expect(i.mediaKey?.equals(Buffer.from([5, 6]))).toBe(true);
    expect(i.fileEncSha256?.equals(Buffer.from([7, 8]))).toBe(true);
    expect(i.directPath).toBe('/v/path');
  });

  it('AudioMessage reads all fields', () => {
    const audio = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('aurl') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: Buffer.from([1, 1]) },
      { fieldNumber: 7, wireType: WireType.Bytes, bytes: Buffer.from([2, 2]) },
      { fieldNumber: 8, wireType: WireType.Bytes, bytes: Buffer.from([3, 3]) },
      { fieldNumber: 9, wireType: WireType.Bytes, bytes: fromString('/a/path') },
    ]);
    const buf = encodeFields([{ fieldNumber: 8, wireType: WireType.Bytes, bytes: audio }]);
    const a = Message.decode(buf).audioMessage;
    if (a === null) throw new Error('expected audioMessage');
    expect(a.url).toBe('aurl');
    expect(a.fileSha256?.equals(Buffer.from([1, 1]))).toBe(true);
    expect(a.mediaKey?.equals(Buffer.from([2, 2]))).toBe(true);
    expect(a.fileEncSha256?.equals(Buffer.from([3, 3]))).toBe(true);
    expect(a.directPath).toBe('/a/path');
  });
});

describe('Message media getters return null when absent', () => {
  it('imageMessage and audioMessage are null on a text-only message', () => {
    // Message { conversation = "hola" } — no image, no audio
    const buf = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hola') },
    ]);
    const msg = Message.decode(buf);
    expect(msg.imageMessage).toBeNull(); // covers the sub===null branch (image)
    expect(msg.audioMessage).toBeNull(); // covers the sub===null branch (audio)
    expect(msg.hasMedia).toBe(false);
  });
});
