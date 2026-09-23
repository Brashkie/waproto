import { WireType, encodeFields, fromString } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { Message } from '../src';

describe('ButtonsMessage (lazy)', () => {
  function button(id: string, label: string): Buffer {
    const btnText = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString(label) },
    ]);
    // Button { buttonId=1, buttonText=2 }
    return encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString(id) },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: btnText },
    ]);
  }

  it('reads content, footer, and all buttons with labels', () => {
    // ButtonsMessage { contentText=6, footerText=7, buttons=9 (repeated) }
    const bm = encodeFields([
      { fieldNumber: 6, wireType: WireType.Bytes, bytes: fromString('¿Confirmás?') },
      { fieldNumber: 7, wireType: WireType.Bytes, bytes: fromString('Elegí una opción') },
      { fieldNumber: 9, wireType: WireType.Bytes, bytes: button('yes', 'Sí') },
      { fieldNumber: 9, wireType: WireType.Bytes, bytes: button('no', 'No') },
    ]);
    // Message { buttonsMessage=42 }
    const buf = encodeFields([{ fieldNumber: 42, wireType: WireType.Bytes, bytes: bm }]);
    const m = Message.decode(buf).buttonsMessage;
    if (m === null) throw new Error('expected buttonsMessage');
    expect(m.contentText).toBe('¿Confirmás?');
    expect(m.footerText).toBe('Elegí una opción');
    expect(m.buttons).toHaveLength(2);
    expect(m.buttons[0]?.buttonId).toBe('yes');
    expect(m.buttons[0]?.displayText).toBe('Sí');
    expect(m.buttons[1]?.buttonId).toBe('no');
    expect(m.buttons[1]?.displayText).toBe('No');
  });

  it('displayText is null when the button has no buttonText submessage', () => {
    const b = encodeFields([{ fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('x') }]);
    const bm = encodeFields([{ fieldNumber: 9, wireType: WireType.Bytes, bytes: b }]);
    const buf = encodeFields([{ fieldNumber: 42, wireType: WireType.Bytes, bytes: bm }]);
    const m = Message.decode(buf).buttonsMessage;
    if (m === null) throw new Error('expected buttonsMessage');
    expect(m.buttons[0]?.buttonId).toBe('x');
    expect(m.buttons[0]?.displayText).toBeNull();
  });

  it('empty buttons array + null on non-buttons message', () => {
    const bm = encodeFields([
      { fieldNumber: 6, wireType: WireType.Bytes, bytes: fromString('solo texto') },
    ]);
    const buf = encodeFields([{ fieldNumber: 42, wireType: WireType.Bytes, bytes: bm }]);
    const m = Message.decode(buf).buttonsMessage;
    if (m === null) throw new Error('expected buttonsMessage');
    expect(m.buttons).toEqual([]);
    expect(m.footerText).toBeNull();

    const other = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hi') },
    ]);
    expect(Message.decode(other).buttonsMessage).toBeNull();
  });
});

describe('ListMessage (lazy) — nested sections & rows', () => {
  function row(title: string, desc: string, id: string): Buffer {
    // Row { title=1, description=2, rowId=3 }
    return encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString(title) },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString(desc) },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString(id) },
    ]);
  }
  function section(title: string, rows: Buffer[]): Buffer {
    // Section { title=1, rows=2 (repeated) }
    const fields = [{ fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString(title) }];
    for (const r of rows) fields.push({ fieldNumber: 2, wireType: WireType.Bytes, bytes: r });
    return encodeFields(fields);
  }

  it('reads the list with sections and rows (repeated within repeated)', () => {
    const s1 = section('Bebidas', [row('Agua', 'sin gas', 'r1'), row('Jugo', 'naranja', 'r2')]);
    const s2 = section('Comidas', [row('Pizza', 'muzza', 'r3')]);
    // ListMessage { title=1, description=2, buttonText=3, sections=5, footerText=7 }
    const lm = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('Menú') },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('Elegí') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('Ver menú') },
      { fieldNumber: 5, wireType: WireType.Bytes, bytes: s1 },
      { fieldNumber: 5, wireType: WireType.Bytes, bytes: s2 },
      { fieldNumber: 7, wireType: WireType.Bytes, bytes: fromString('Gracias') },
    ]);
    // Message { listMessage=36 }
    const buf = encodeFields([{ fieldNumber: 36, wireType: WireType.Bytes, bytes: lm }]);
    const list = Message.decode(buf).listMessage;
    if (list === null) throw new Error('expected listMessage');
    expect(list.title).toBe('Menú');
    expect(list.description).toBe('Elegí');
    expect(list.buttonText).toBe('Ver menú');
    expect(list.footerText).toBe('Gracias');
    expect(list.sections).toHaveLength(2);

    const sec1 = list.sections[0];
    if (sec1 === undefined) throw new Error('expected section 0');
    expect(sec1.title).toBe('Bebidas');
    expect(sec1.rows).toHaveLength(2);
    expect(sec1.rows[0]?.title).toBe('Agua');
    expect(sec1.rows[0]?.description).toBe('sin gas');
    expect(sec1.rows[0]?.rowId).toBe('r1');
    expect(sec1.rows[1]?.title).toBe('Jugo');

    const sec2 = list.sections[1];
    if (sec2 === undefined) throw new Error('expected section 1');
    expect(sec2.title).toBe('Comidas');
    expect(sec2.rows).toHaveLength(1);
    expect(sec2.rows[0]?.rowId).toBe('r3');
  });

  it('empty sections + null on non-list message', () => {
    const lm = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('vacío') },
    ]);
    const buf = encodeFields([{ fieldNumber: 36, wireType: WireType.Bytes, bytes: lm }]);
    const list = Message.decode(buf).listMessage;
    if (list === null) throw new Error('expected listMessage');
    expect(list.sections).toEqual([]);
    expect(list.description).toBeNull();

    const other = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hi') },
    ]);
    expect(Message.decode(other).listMessage).toBeNull();
  });

  it('a section with no rows yields an empty rows array', () => {
    const emptySec = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('Vacía') },
    ]);
    const lm = encodeFields([{ fieldNumber: 5, wireType: WireType.Bytes, bytes: emptySec }]);
    const buf = encodeFields([{ fieldNumber: 36, wireType: WireType.Bytes, bytes: lm }]);
    const list = Message.decode(buf).listMessage;
    if (list === null) throw new Error('expected listMessage');
    const sec = list.sections[0];
    if (sec === undefined) throw new Error('expected section');
    expect(sec.title).toBe('Vacía');
    expect(sec.rows).toEqual([]);
  });
});
