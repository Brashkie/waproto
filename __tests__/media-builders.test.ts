import { describe, expect, it } from 'vitest';

import { Message, buildMessage } from '../src';

describe('Media builders — round-trip (build → decode → match)', () => {
  it('builds an image with common + image-specific fields', () => {
    const buf = buildMessage()
      .image({
        url: 'https://cdn/i.enc',
        mimetype: 'image/jpeg',
        caption: 'una foto',
        fileLength: 204800,
        height: 1080,
        width: 1920,
        mediaKey: Buffer.from([1, 2, 3]),
      })
      .build();
    const img = Message.decode(buf).imageMessage;
    if (img === null) throw new Error('expected imageMessage');
    expect(img.url).toBe('https://cdn/i.enc');
    expect(img.mimetype).toBe('image/jpeg');
    expect(img.caption).toBe('una foto');
    expect(img.fileLength).toBe(204800n);
    expect(img.height).toBe(1080);
    expect(img.width).toBe(1920);
    expect(img.mediaKey?.equals(Buffer.from([1, 2, 3]))).toBe(true);
  });

  it('builds a video with gifPlayback', () => {
    const buf = buildMessage()
      .video({
        url: 'v.enc',
        mimetype: 'video/mp4',
        seconds: 30,
        gifPlayback: true,
        height: 720,
        width: 1280,
        caption: 'clip',
      })
      .build();
    const v = Message.decode(buf).videoMessage;
    if (v === null) throw new Error('expected videoMessage');
    expect(v.mimetype).toBe('video/mp4');
    expect(v.seconds).toBe(30);
    expect(v.gifPlayback).toBe(true);
    expect(v.isGif).toBe(true);
    expect(v.caption).toBe('clip');
    expect(v.height).toBe(720);
    expect(v.width).toBe(1280);
  });

  it('builds an audio voice note (ptt)', () => {
    const buf = buildMessage()
      .audio({
        url: 'a.enc',
        mimetype: 'audio/ogg; codecs=opus',
        seconds: 12,
        ptt: true,
        fileLength: 51200,
      })
      .build();
    const a = Message.decode(buf).audioMessage;
    if (a === null) throw new Error('expected audioMessage');
    expect(a.seconds).toBe(12);
    expect(a.ptt).toBe(true);
    expect(a.isVoiceNote).toBe(true);
    expect(a.fileLength).toBe(51200n);
  });

  it('builds a document with title, fileName, pageCount', () => {
    const buf = buildMessage()
      .document({
        url: 'd.enc',
        mimetype: 'application/pdf',
        title: 'Informe',
        fileName: 'informe.pdf',
        pageCount: 12,
        caption: 'adjunto',
      })
      .build();
    const d = Message.decode(buf).documentMessage;
    if (d === null) throw new Error('expected documentMessage');
    expect(d.title).toBe('Informe');
    expect(d.fileName).toBe('informe.pdf');
    expect(d.pageCount).toBe(12);
    expect(d.caption).toBe('adjunto');
    expect(d.mimetype).toBe('application/pdf');
  });

  it('omits absent optional fields (minimal image)', () => {
    const buf = buildMessage().image({ mimetype: 'image/png' }).build();
    const img = Message.decode(buf).imageMessage;
    if (img === null) throw new Error('expected imageMessage');
    expect(img.mimetype).toBe('image/png');
    expect(img.url).toBeNull();
    expect(img.caption).toBeNull();
    expect(img.fileLength).toBeNull();
  });

  it('media overrides previously-set content', () => {
    const buf = buildMessage().conversation('x').image({ mimetype: 'image/webp' }).build();
    const msg = Message.decode(buf);
    expect(msg.conversation).toBeNull();
    expect(msg.imageMessage?.mimetype).toBe('image/webp');
  });

  it('bigint fileLength for large files', () => {
    const big = 5_000_000_000n; // > 2^32
    const buf = buildMessage().video({ fileLength: big }).build();
    expect(Message.decode(buf).videoMessage?.fileLength).toBe(big);
  });

  it('encodes a false boolean (gifPlayback: false)', () => {
    const buf = buildMessage().video({ mimetype: 'video/mp4', gifPlayback: false }).build();
    const v = Message.decode(buf).videoMessage;
    if (v === null) throw new Error('expected videoMessage');
    expect(v.gifPlayback).toBe(false); // covers the `: 0n` branch of bool()
    expect(v.isGif).toBe(false);
  });
});
