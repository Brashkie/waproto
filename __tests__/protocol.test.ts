import { WireType, encodeFields, fromString, fromUint32 } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { Message, ProtocolMessageType } from '../src';

describe('ProtocolMessage (lazy)', () => {
  it('reads a REVOKE (delete for everyone)', () => {
    const key = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('chat@s.whatsapp.net') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('DELETED_MSG_ID') },
    ]);
    // ProtocolMessage { key=1, type=2 (REVOKE=0) }
    const pm = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: key },
      { fieldNumber: 2, wireType: WireType.Varint, varint: fromUint32(ProtocolMessageType.Revoke) },
    ]);
    // Message { protocolMessage=12 }
    const buf = encodeFields([{ fieldNumber: 12, wireType: WireType.Bytes, bytes: pm }]);
    const p = Message.decode(buf).protocolMessage;
    if (p === null) throw new Error('expected protocolMessage');
    expect(p.type).toBe(ProtocolMessageType.Revoke);
    expect(p.isRevoke).toBe(true);
    expect(p.isEdit).toBe(false);
    expect(p.isEphemeralSetting).toBe(false);
    expect(p.key?.id).toBe('DELETED_MSG_ID');
    expect(p.key?.remoteJid).toBe('chat@s.whatsapp.net');
  });

  it('reads a MESSAGE_EDIT with the new content', () => {
    const edited = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('texto corregido') },
    ]);
    // ProtocolMessage { type=2 (MESSAGE_EDIT=14), editedMessage=14, timestampMs=15 }
    const pm = encodeFields([
      {
        fieldNumber: 2,
        wireType: WireType.Varint,
        varint: fromUint32(ProtocolMessageType.MessageEdit),
      },
      { fieldNumber: 14, wireType: WireType.Bytes, bytes: edited },
      { fieldNumber: 15, wireType: WireType.Varint, varint: fromUint32(1789268211) },
    ]);
    const buf = encodeFields([{ fieldNumber: 12, wireType: WireType.Bytes, bytes: pm }]);
    const p = Message.decode(buf).protocolMessage;
    if (p === null) throw new Error('expected protocolMessage');
    expect(p.isEdit).toBe(true);
    expect(p.editedMessage?.conversation).toBe('texto corregido');
    expect(p.timestampMs).toBe(1789268211n);
  });

  it('reads an EPHEMERAL_SETTING change', () => {
    // ProtocolMessage { type=2 (EPHEMERAL_SETTING=3), ephemeralExpiration=4 }
    const pm = encodeFields([
      {
        fieldNumber: 2,
        wireType: WireType.Varint,
        varint: fromUint32(ProtocolMessageType.EphemeralSetting),
      },
      { fieldNumber: 4, wireType: WireType.Varint, varint: fromUint32(604800) },
    ]);
    const buf = encodeFields([{ fieldNumber: 12, wireType: WireType.Bytes, bytes: pm }]);
    const p = Message.decode(buf).protocolMessage;
    if (p === null) throw new Error('expected protocolMessage');
    expect(p.isEphemeralSetting).toBe(true);
    expect(p.ephemeralExpiration).toBe(604800);
    expect(p.isRevoke).toBe(false);
  });

  it('returns null for absent fields and on non-protocol messages', () => {
    const pm = encodeFields([
      { fieldNumber: 2, wireType: WireType.Varint, varint: fromUint32(ProtocolMessageType.Revoke) },
    ]);
    const buf = encodeFields([{ fieldNumber: 12, wireType: WireType.Bytes, bytes: pm }]);
    const p = Message.decode(buf).protocolMessage;
    if (p === null) throw new Error('expected protocolMessage');
    expect(p.key).toBeNull();
    expect(p.editedMessage).toBeNull();
    expect(p.ephemeralExpiration).toBeNull();
    expect(p.timestampMs).toBeNull();

    const other = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hi') },
    ]);
    expect(Message.decode(other).protocolMessage).toBeNull();
  });

  it('type null on a protocol message with no type field', () => {
    const pm = encodeFields([
      { fieldNumber: 15, wireType: WireType.Varint, varint: fromUint32(1) },
    ]);
    const buf = encodeFields([{ fieldNumber: 12, wireType: WireType.Bytes, bytes: pm }]);
    const p = Message.decode(buf).protocolMessage;
    if (p === null) throw new Error('expected protocolMessage');
    expect(p.type).toBeNull();
    expect(p.isRevoke).toBe(false);
    expect(p.isEdit).toBe(false);
    expect(p.isEphemeralSetting).toBe(false);
  });
});
