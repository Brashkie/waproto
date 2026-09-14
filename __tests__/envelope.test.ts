import { WireType, encodeFields, fromBool, fromString, fromUint32 } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { MessageKey, MessageStatus, WebMessageInfo } from '../src';

describe('MessageKey (lazy)', () => {
  it('reads routing fields', () => {
    // MessageKey { remoteJid=1, fromMe=2, id=3, participant=4 }
    const key = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('549351123@s.whatsapp.net') },
      { fieldNumber: 2, wireType: WireType.Varint, varint: fromBool(false) },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('ABCD1234') },
      { fieldNumber: 4, wireType: WireType.Bytes, bytes: fromString('999@s.whatsapp.net') },
    ]);
    // WebMessageInfo { key=1 }
    const buf = encodeFields([{ fieldNumber: 1, wireType: WireType.Bytes, bytes: key }]);
    const info = WebMessageInfo.decode(buf);
    const k = info.key;
    if (k === null) throw new Error('expected key');
    expect(k.remoteJid).toBe('549351123@s.whatsapp.net');
    expect(k.fromMe).toBe(false);
    expect(k.id).toBe('ABCD1234');
    expect(k.participant).toBe('999@s.whatsapp.net');
  });
});

describe('WebMessageInfo (envelope)', () => {
  it('reads envelope fields and the nested Message', () => {
    const key = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('chat@s.whatsapp.net') },
      { fieldNumber: 2, wireType: WireType.Varint, varint: fromBool(true) },
    ]);
    const message = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hola desde el envelope') },
    ]);
    // WebMessageInfo { key=1, message=2, messageTimestamp=3, status=4, pushName=19 }
    const buf = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: key },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: message },
      { fieldNumber: 3, wireType: WireType.Varint, varint: fromUint32(1789268211) },
      { fieldNumber: 4, wireType: WireType.Varint, varint: fromUint32(MessageStatus.Read) },
      { fieldNumber: 19, wireType: WireType.Bytes, bytes: fromString('Brashkie') },
    ]);

    const info = WebMessageInfo.decode(buf);
    // Routing without decoding content:
    expect(info.key?.remoteJid).toBe('chat@s.whatsapp.net');
    expect(info.key?.fromMe).toBe(true);
    expect(info.messageTimestamp).toBe(1789268211n);
    expect(info.status).toBe(MessageStatus.Read);
    expect(info.pushName).toBe('Brashkie');
    // Content read lazily only when accessed:
    expect(info.message?.conversation).toBe('hola desde el envelope');
  });

  it('reads participant/starred/broadcast and null when absent', () => {
    const buf = encodeFields([
      { fieldNumber: 5, wireType: WireType.Bytes, bytes: fromString('p@s.whatsapp.net') },
      { fieldNumber: 17, wireType: WireType.Varint, varint: fromBool(true) },
      { fieldNumber: 18, wireType: WireType.Varint, varint: fromBool(false) },
    ]);
    const info = WebMessageInfo.decode(buf);
    expect(info.participant).toBe('p@s.whatsapp.net');
    expect(info.starred).toBe(true);
    expect(info.broadcast).toBe(false);
    // absent
    expect(info.key).toBeNull();
    expect(info.message).toBeNull();
    expect(info.messageTimestamp).toBeNull();
    expect(info.status).toBeNull();
    expect(info.pushName).toBeNull();
  });
});
