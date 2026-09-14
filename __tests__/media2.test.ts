import { WireType, encodeFields, fromBool, fromString, fromUint32 } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { Message } from '../src';

describe('VideoMessage (lazy)', () => {
  it('reads video fields including gifPlayback', () => {
    // VideoMessage: url=1, mimetype=2, fileLength=4, seconds=5, caption=7, gifPlayback=8, height=9, width=10
    const vid = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('https://cdn/v.enc') },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('video/mp4') },
      { fieldNumber: 4, wireType: WireType.Varint, varint: fromUint32(1048576) },
      { fieldNumber: 5, wireType: WireType.Varint, varint: fromUint32(30) },
      { fieldNumber: 7, wireType: WireType.Bytes, bytes: fromString('mi video') },
      { fieldNumber: 8, wireType: WireType.Varint, varint: fromBool(true) },
      { fieldNumber: 9, wireType: WireType.Varint, varint: fromUint32(720) },
      { fieldNumber: 10, wireType: WireType.Varint, varint: fromUint32(1280) },
    ]);
    const buf = encodeFields([{ fieldNumber: 9, wireType: WireType.Bytes, bytes: vid }]);
    const v = Message.decode(buf).videoMessage;
    if (v === null) throw new Error('expected videoMessage');
    expect(v.url).toBe('https://cdn/v.enc');
    expect(v.mimetype).toBe('video/mp4');
    expect(v.fileLength).toBe(1048576n);
    expect(v.seconds).toBe(30);
    expect(v.caption).toBe('mi video');
    expect(v.gifPlayback).toBe(true);
    expect(v.isGif).toBe(true);
    expect(v.height).toBe(720);
    expect(v.width).toBe(1280);
  });

  it('reads bytes/directPath/viewOnce and null when absent', () => {
    const vid = encodeFields([
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: Buffer.from([1, 2]) },
      { fieldNumber: 6, wireType: WireType.Bytes, bytes: Buffer.from([3, 4]) },
      { fieldNumber: 11, wireType: WireType.Bytes, bytes: Buffer.from([5, 6]) },
      { fieldNumber: 13, wireType: WireType.Bytes, bytes: fromString('/v/p') },
      { fieldNumber: 20, wireType: WireType.Varint, varint: fromBool(true) },
    ]);
    const buf = encodeFields([{ fieldNumber: 9, wireType: WireType.Bytes, bytes: vid }]);
    const v = Message.decode(buf).videoMessage;
    if (v === null) throw new Error('expected videoMessage');
    expect(v.fileSha256?.equals(Buffer.from([1, 2]))).toBe(true);
    expect(v.mediaKey?.equals(Buffer.from([3, 4]))).toBe(true);
    expect(v.fileEncSha256?.equals(Buffer.from([5, 6]))).toBe(true);
    expect(v.directPath).toBe('/v/p');
    expect(v.viewOnce).toBe(true);
    expect(v.caption).toBeNull();
    expect(v.isGif).toBe(false);
  });
});

describe('DocumentMessage (lazy)', () => {
  it('reads document fields', () => {
    // Document: url=1, mimetype=2, title=3, fileLength=5, pageCount=6, fileName=8, caption=20
    const doc = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('https://cdn/d.enc') },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('application/pdf') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('Informe') },
      { fieldNumber: 5, wireType: WireType.Varint, varint: fromUint32(524288) },
      { fieldNumber: 6, wireType: WireType.Varint, varint: fromUint32(12) },
      { fieldNumber: 8, wireType: WireType.Bytes, bytes: fromString('informe.pdf') },
      { fieldNumber: 20, wireType: WireType.Bytes, bytes: fromString('adjunto') },
    ]);
    const buf = encodeFields([{ fieldNumber: 7, wireType: WireType.Bytes, bytes: doc }]);
    const d = Message.decode(buf).documentMessage;
    if (d === null) throw new Error('expected documentMessage');
    expect(d.url).toBe('https://cdn/d.enc');
    expect(d.mimetype).toBe('application/pdf');
    expect(d.title).toBe('Informe');
    expect(d.fileLength).toBe(524288n);
    expect(d.pageCount).toBe(12);
    expect(d.fileName).toBe('informe.pdf');
    expect(d.caption).toBe('adjunto');
  });

  it('reads bytes fields and null when absent', () => {
    const doc = encodeFields([
      { fieldNumber: 4, wireType: WireType.Bytes, bytes: Buffer.from([9, 9]) },
      { fieldNumber: 7, wireType: WireType.Bytes, bytes: Buffer.from([8, 8]) },
      { fieldNumber: 9, wireType: WireType.Bytes, bytes: Buffer.from([7, 7]) },
      { fieldNumber: 10, wireType: WireType.Bytes, bytes: fromString('/d/p') },
    ]);
    const buf = encodeFields([{ fieldNumber: 7, wireType: WireType.Bytes, bytes: doc }]);
    const d = Message.decode(buf).documentMessage;
    if (d === null) throw new Error('expected documentMessage');
    expect(d.fileSha256?.equals(Buffer.from([9, 9]))).toBe(true);
    expect(d.mediaKey?.equals(Buffer.from([8, 8]))).toBe(true);
    expect(d.fileEncSha256?.equals(Buffer.from([7, 7]))).toBe(true);
    expect(d.directPath).toBe('/d/p');
    expect(d.title).toBeNull();
  });
});

describe('StickerMessage (lazy) — distinct field layout', () => {
  it('reads sticker fields (fileSha256=2, not 4!)', () => {
    // Sticker: url=1, fileSha256=2, fileEncSha256=3, mediaKey=4, mimetype=5, height=6, width=7, directPath=8, fileLength=9, isAnimated=13
    const stk = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('https://cdn/s.enc') },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: Buffer.from([1, 1]) },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: Buffer.from([2, 2]) },
      { fieldNumber: 4, wireType: WireType.Bytes, bytes: Buffer.from([3, 3]) },
      { fieldNumber: 5, wireType: WireType.Bytes, bytes: fromString('image/webp') },
      { fieldNumber: 6, wireType: WireType.Varint, varint: fromUint32(512) },
      { fieldNumber: 7, wireType: WireType.Varint, varint: fromUint32(512) },
      { fieldNumber: 8, wireType: WireType.Bytes, bytes: fromString('/s/p') },
      { fieldNumber: 9, wireType: WireType.Varint, varint: fromUint32(30720) },
      { fieldNumber: 13, wireType: WireType.Varint, varint: fromBool(true) },
    ]);
    const buf = encodeFields([{ fieldNumber: 26, wireType: WireType.Bytes, bytes: stk }]);
    const msg = Message.decode(buf);
    expect(msg.hasMedia).toBe(true);
    const s = msg.stickerMessage;
    if (s === null) throw new Error('expected stickerMessage');
    expect(s.url).toBe('https://cdn/s.enc');
    expect(s.fileSha256?.equals(Buffer.from([1, 1]))).toBe(true);
    expect(s.fileEncSha256?.equals(Buffer.from([2, 2]))).toBe(true);
    expect(s.mediaKey?.equals(Buffer.from([3, 3]))).toBe(true);
    expect(s.mimetype).toBe('image/webp');
    expect(s.height).toBe(512);
    expect(s.width).toBe(512);
    expect(s.directPath).toBe('/s/p');
    expect(s.fileLength).toBe(30720n);
    expect(s.isAnimated).toBe(true);
  });

  it('isAvatar and null when absent', () => {
    const stk = encodeFields([
      { fieldNumber: 19, wireType: WireType.Varint, varint: fromBool(true) },
    ]);
    const buf = encodeFields([{ fieldNumber: 26, wireType: WireType.Bytes, bytes: stk }]);
    const s = Message.decode(buf).stickerMessage;
    if (s === null) throw new Error('expected stickerMessage');
    expect(s.isAvatar).toBe(true);
    expect(s.isAnimated).toBeNull();
    expect(s.url).toBeNull();
  });
});

describe('Message: video/document/sticker null when absent', () => {
  it('all three are null on a text message', () => {
    const buf = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hi') },
    ]);
    const msg = Message.decode(buf);
    expect(msg.videoMessage).toBeNull();
    expect(msg.documentMessage).toBeNull();
    expect(msg.stickerMessage).toBeNull();
  });
});
