import { WireType, encodeFields, fromBool, fromString, fromUint32 } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { ContextInfo } from '../src';
// ContextInfo no cuelga directo de Message; se indexa desde el buffer de un
// ContextInfo (que en la práctica viene dentro de otros submensajes).
// Usamos ContextInfo.from vía un pequeño helper de test.
import { WebMessageInfo } from '../src';

describe('ContextInfo (lazy)', () => {
  // Encode a ContextInfo and read it back by wrapping it as a submessage.
  function decodeContext(buf: Buffer): ContextInfo {
    // Reuse the lazy machinery: wrap the raw buffer as a ContextInfo.
    // (ContextInfo.from is internal; we go through a WebMessageInfo-like path.)
    return (ContextInfo as unknown as { from: (r: unknown) => ContextInfo }).from(
      (
        WebMessageInfo.decode(
          encodeFields([{ fieldNumber: 1, wireType: WireType.Bytes, bytes: buf }]),
        ) as unknown as {
          raw: { getMessage: (n: number) => unknown };
        }
      ).raw.getMessage(1),
    );
  }

  it('reads reply and forwarding metadata', () => {
    // ContextInfo { stanzaId=1, participant=2, remoteJid=4, forwardingScore=21, isForwarded=22, expiration=25 }
    const ctx = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('QUOTED123') },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('quoted@s.whatsapp.net') },
      { fieldNumber: 4, wireType: WireType.Bytes, bytes: fromString('chat@s.whatsapp.net') },
      { fieldNumber: 21, wireType: WireType.Varint, varint: fromUint32(3) },
      { fieldNumber: 22, wireType: WireType.Varint, varint: fromBool(true) },
      { fieldNumber: 25, wireType: WireType.Varint, varint: fromUint32(86400) },
    ]);
    const c = decodeContext(ctx);
    expect(c.stanzaId).toBe('QUOTED123');
    expect(c.participant).toBe('quoted@s.whatsapp.net');
    expect(c.remoteJid).toBe('chat@s.whatsapp.net');
    expect(c.forwardingScore).toBe(3);
    expect(c.isForwarded).toBe(true);
    expect(c.expiration).toBe(86400);
    expect(c.isReply).toBe(true);
  });

  it('isReply is false with no quote', () => {
    const ctx = encodeFields([
      { fieldNumber: 22, wireType: WireType.Varint, varint: fromBool(false) },
    ]);
    const c = decodeContext(ctx);
    expect(c.isReply).toBe(false);
    expect(c.stanzaId).toBeNull();
    expect(c.isForwarded).toBe(false);
  });
});
