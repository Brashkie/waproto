import { WireType, encodeFields, fromString } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { Message } from '../src';

describe('ExtendedTextMessage (lazy)', () => {
  it('reads all rich-text fields on demand', () => {
    // ExtendedTextMessage { text=1, canonicalUrl=4, description=5, title=6 }
    const ext = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('mirá esto') },
      { fieldNumber: 4, wireType: WireType.Bytes, bytes: fromString('https://google.com') },
      { fieldNumber: 5, wireType: WireType.Bytes, bytes: fromString('El buscador') },
      { fieldNumber: 6, wireType: WireType.Bytes, bytes: fromString('Google') },
    ]);
    const buf = encodeFields([{ fieldNumber: 6, wireType: WireType.Bytes, bytes: ext }]);

    const e = Message.decode(buf).extendedTextMessage;
    if (e === null) throw new Error('expected extendedTextMessage');
    expect(e.text).toBe('mirá esto');
    expect(e.canonicalUrl).toBe('https://google.com');
    expect(e.description).toBe('El buscador');
    expect(e.title).toBe('Google');
  });

  it('returns null for absent rich-text fields', () => {
    const ext = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('solo texto') },
    ]);
    const buf = encodeFields([{ fieldNumber: 6, wireType: WireType.Bytes, bytes: ext }]);

    const e = Message.decode(buf).extendedTextMessage;
    if (e === null) throw new Error('expected extendedTextMessage');
    expect(e.text).toBe('solo texto');
    expect(e.canonicalUrl).toBeNull();
    expect(e.description).toBeNull();
    expect(e.title).toBeNull();
  });
});
