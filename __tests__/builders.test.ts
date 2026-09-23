import { describe, expect, it } from 'vitest';

import { Message, buildMessage } from '../src';

describe('MessageBuilder — round-trip (build → decode → match)', () => {
  it('builds a conversation that decodes back', () => {
    const buf = buildMessage().conversation('Hola mundo').build();
    const msg = Message.decode(buf);
    expect(msg.conversation).toBe('Hola mundo');
    expect(msg.isText).toBe(true);
  });

  it('builds an extendedText with a link preview', () => {
    const buf = buildMessage()
      .extendedText('Mirá esto')
      .withPreview('https://example.com', 'Example', 'A great site')
      .build();
    const ext = Message.decode(buf).extendedTextMessage;
    if (ext === null) throw new Error('expected extendedTextMessage');
    expect(ext.text).toBe('Mirá esto');
    expect(ext.canonicalUrl).toBe('https://example.com');
    expect(ext.title).toBe('Example');
    expect(ext.description).toBe('A great site');
  });

  it('builds an extendedText without preview (just text)', () => {
    const buf = buildMessage().extendedText('solo texto').build();
    const ext = Message.decode(buf).extendedTextMessage;
    if (ext === null) throw new Error('expected extendedTextMessage');
    expect(ext.text).toBe('solo texto');
    expect(ext.canonicalUrl).toBeNull();
    expect(ext.title).toBeNull();
  });

  it('withPreview with only a url (no title/description)', () => {
    const buf = buildMessage().extendedText('t').withPreview('https://u.com').build();
    const ext = Message.decode(buf).extendedTextMessage;
    if (ext === null) throw new Error('expected extendedTextMessage');
    expect(ext.canonicalUrl).toBe('https://u.com');
    expect(ext.title).toBeNull();
    expect(ext.description).toBeNull();
  });

  it('builds a reaction that decodes back', () => {
    const target = { remoteJid: 'chat@s.whatsapp.net', fromMe: false, id: 'MSG_1' };
    const buf = buildMessage().reaction(target, '👍', 1789268211000).build();
    const r = Message.decode(buf).reactionMessage;
    if (r === null) throw new Error('expected reactionMessage');
    expect(r.text).toBe('👍');
    expect(r.key?.remoteJid).toBe('chat@s.whatsapp.net');
    expect(r.key?.fromMe).toBe(false);
    expect(r.key?.id).toBe('MSG_1');
    expect(r.senderTimestampMs).toBe(1789268211000n);
  });

  it('builds a reaction without timestamp', () => {
    const target = { remoteJid: 'c@s.whatsapp.net', fromMe: true, id: 'X' };
    const buf = buildMessage().reaction(target, '❤️').build();
    const r = Message.decode(buf).reactionMessage;
    if (r === null) throw new Error('expected reactionMessage');
    expect(r.text).toBe('❤️');
    expect(r.key?.fromMe).toBe(true);
    expect(r.senderTimestampMs).toBeNull();
  });

  it('conversation overrides a previously set content', () => {
    const buf = buildMessage().extendedText('x').conversation('final').build();
    expect(Message.decode(buf).conversation).toBe('final');
    expect(Message.decode(buf).extendedTextMessage).toBeNull();
  });

  it('throws if no content was set', () => {
    expect(() => buildMessage().build()).toThrow();
  });
});
