import { WireType, encodeFields, fromBool, fromString, fromUint32 } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { Message } from '../src';

describe('ReactionMessage (lazy)', () => {
  it('reads an emoji reaction with key and timestamp', () => {
    // ReactionMessage { key=1, text=2, groupingKey=3, senderTimestampMs=4 }
    const key = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('chat@s.whatsapp.net') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('MSG_ID_123') },
    ]);
    const reaction = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: key },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('👍') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('grp1') },
      { fieldNumber: 4, wireType: WireType.Varint, varint: fromUint32(1789268211000 % 4294967296) },
    ]);
    // Message { reactionMessage = <reaction> } (field 46)
    const buf = encodeFields([{ fieldNumber: 46, wireType: WireType.Bytes, bytes: reaction }]);
    const r = Message.decode(buf).reactionMessage;
    if (r === null) throw new Error('expected reactionMessage');
    expect(r.text).toBe('👍');
    expect(r.groupingKey).toBe('grp1');
    expect(r.key?.remoteJid).toBe('chat@s.whatsapp.net');
    expect(r.key?.id).toBe('MSG_ID_123');
    expect(r.senderTimestampMs).not.toBeNull();
    expect(r.isRemoval).toBe(false);
  });

  it('detects a reaction removal (empty text)', () => {
    const reaction = encodeFields([
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('') },
    ]);
    const buf = encodeFields([{ fieldNumber: 46, wireType: WireType.Bytes, bytes: reaction }]);
    const r = Message.decode(buf).reactionMessage;
    if (r === null) throw new Error('expected reactionMessage');
    expect(r.text).toBe('');
    expect(r.isRemoval).toBe(true);
    expect(r.key).toBeNull();
    expect(r.senderTimestampMs).toBeNull();
  });

  it('is null on a non-reaction message', () => {
    const buf = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hi') },
    ]);
    expect(Message.decode(buf).reactionMessage).toBeNull();
  });

  it('isRemoval is false when text is absent (null)', () => {
    // reaction with only groupingKey, no text field
    const reaction = encodeFields([
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('grp') },
    ]);
    const buf = encodeFields([{ fieldNumber: 46, wireType: WireType.Bytes, bytes: reaction }]);
    const r = Message.decode(buf).reactionMessage;
    if (r === null) throw new Error('expected reactionMessage');
    expect(r.text).toBeNull();
    expect(r.isRemoval).toBe(false); // null === '' is false
  });
});

describe('PollCreationMessage (lazy, repeated options)', () => {
  function poll(name: string, options: string[]): Buffer {
    const fields = [
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString(name) },
      { fieldNumber: 4, wireType: WireType.Varint, varint: fromUint32(1) },
    ];
    // repeated Option options = 3 ; Option { optionName = 1 }
    for (const opt of options) {
      const o = encodeFields([
        { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString(opt) },
      ]);
      fields.push({ fieldNumber: 3, wireType: WireType.Bytes, bytes: o });
    }
    return encodeFields(fields);
  }

  it('reads the question and ALL options (repeated)', () => {
    const p = poll('¿Mejor lenguaje?', ['Rust', 'TypeScript', 'Go']);
    const buf = encodeFields([{ fieldNumber: 49, wireType: WireType.Bytes, bytes: p }]);
    const poll_ = Message.decode(buf).pollCreationMessage;
    if (poll_ === null) throw new Error('expected pollCreationMessage');
    expect(poll_.name).toBe('¿Mejor lenguaje?');
    expect(poll_.selectableOptionsCount).toBe(1);
    expect(poll_.optionNames).toEqual(['Rust', 'TypeScript', 'Go']);
    expect(poll_.options).toHaveLength(3);
    expect(poll_.options[0]?.name).toBe('Rust');
  });

  it('finds the poll regardless of version field (V3 = 64)', () => {
    const p = poll('Pregunta V3', ['A', 'B']);
    const buf = encodeFields([{ fieldNumber: 64, wireType: WireType.Bytes, bytes: p }]);
    const poll_ = Message.decode(buf).pollCreationMessage;
    if (poll_ === null) throw new Error('expected pollCreationMessage from V3 field');
    expect(poll_.name).toBe('Pregunta V3');
    expect(poll_.optionNames).toEqual(['A', 'B']);
  });

  it('handles a poll with no options (empty array)', () => {
    const p = encodeFields([
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('sin opciones') },
    ]);
    const buf = encodeFields([{ fieldNumber: 49, wireType: WireType.Bytes, bytes: p }]);
    const poll_ = Message.decode(buf).pollCreationMessage;
    if (poll_ === null) throw new Error('expected pollCreationMessage');
    expect(poll_.options).toEqual([]);
    expect(poll_.optionNames).toEqual([]);
  });

  it('optionNames falls back to empty string for an unnamed option', () => {
    // an Option submessage with NO optionName field
    const emptyOpt = encodeFields([
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: Buffer.from([1, 2]) },
    ]);
    const namedOpt = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('Sí') },
    ]);
    const p = encodeFields([
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('P') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: namedOpt },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: emptyOpt },
    ]);
    const buf = encodeFields([{ fieldNumber: 49, wireType: WireType.Bytes, bytes: p }]);
    const poll_ = Message.decode(buf).pollCreationMessage;
    if (poll_ === null) throw new Error('expected pollCreationMessage');
    expect(poll_.optionNames).toEqual(['Sí', '']); // second option has no name → ''
  });

  it('is null on a non-poll message', () => {
    const buf = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hi') },
    ]);
    expect(Message.decode(buf).pollCreationMessage).toBeNull();
  });
});
