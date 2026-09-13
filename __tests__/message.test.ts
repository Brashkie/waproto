import { describe, expect, it } from 'vitest';
import { WireType, encodeFields, fromString } from '@brashkie/signalis-codec';

import { Message } from '../src';

describe('Message (lazy, zero-copy)', () => {
  it('reads a plain conversation message', () => {
    // Message { conversation = "hola mundo" } (field 1, string)
    const buf = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hola mundo') },
    ]);
    const msg = Message.decode(buf);
    expect(msg.conversation).toBe('hola mundo');
    expect(msg.isText).toBe(true);
    expect(msg.text).toBe('hola mundo');
    expect(msg.hasMedia).toBe(false);
  });

  it('returns null for absent fields without decoding', () => {
    const buf = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hi') },
    ]);
    const msg = Message.decode(buf);
    expect(msg.extendedTextMessage).toBeNull();
    expect(msg.hasMedia).toBe(false);
  });

  it('reads a nested ExtendedTextMessage lazily', () => {
    // ExtendedTextMessage { text = "con formato", title = "Google" }
    const ext = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('con formato') },
      { fieldNumber: 6, wireType: WireType.Bytes, bytes: fromString('Google') },
    ]);
    // Message { extendedTextMessage = <ext> } (field 6, submessage)
    const buf = encodeFields([{ fieldNumber: 6, wireType: WireType.Bytes, bytes: ext }]);
    const msg = Message.decode(buf);
    expect(msg.conversation).toBeNull();

    const e = msg.extendedTextMessage;
    if (e === null) throw new Error('expected extendedTextMessage to be present');
    expect(e.text).toBe('con formato');
    expect(e.title).toBe('Google');
    expect(msg.text).toBe('con formato'); // fallback: conversation → ext.text
  });

  it('exposes which fields are present', () => {
    const buf = encodeFields([{ fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('x') }]);
    const msg = Message.decode(buf);
    expect(msg.has(1)).toBe(true);
    expect(msg.has(6)).toBe(false);
    expect(msg.presentFields()).toEqual([1]);
  });
  it('isText is true when only extendedTextMessage is present', () => {
    // Message { extendedTextMessage = { text } } — NO conversation
    const ext = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('rich') },
    ]);
    const buf = encodeFields([{ fieldNumber: 6, wireType: WireType.Bytes, bytes: ext }]);
    const msg = Message.decode(buf);
    expect(msg.conversation).toBeNull();
    expect(msg.isText).toBe(true); // covers the right side of the || in isText
  });

  it('text returns null when the message has no text at all', () => {
    // Message { imageMessage = <...> } (field 3) — no conversation, no extendedText
    const img = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('image/jpeg') },
    ]);
    const buf = encodeFields([{ fieldNumber: 3, wireType: WireType.Bytes, bytes: img }]);
    const msg = Message.decode(buf);
    expect(msg.conversation).toBeNull();
    expect(msg.extendedTextMessage).toBeNull();
    expect(msg.text).toBeNull();   // covers the final ?? null branch
    expect(msg.isText).toBe(false);
    expect(msg.hasMedia).toBe(true);
  });
});
