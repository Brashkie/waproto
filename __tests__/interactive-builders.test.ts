import { describe, expect, it } from 'vitest';

import { Message, buildMessage } from '../src';

describe('Buttons builder — round-trip', () => {
  it('builds a buttons message with content, footer, and buttons', () => {
    const buf = buildMessage()
      .buttons('¿Confirmás?')
      .addButton('yes', 'Sí')
      .addButton('no', 'No')
      .footer('Elegí una opción')
      .build();
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

  it('builds buttons with no content/footer', () => {
    const buf = buildMessage().buttons().addButton('a', 'A').build();
    const m = Message.decode(buf).buttonsMessage;
    if (m === null) throw new Error('expected buttonsMessage');
    expect(m.contentText).toBeNull();
    expect(m.footerText).toBeNull();
    expect(m.buttons).toHaveLength(1);
  });

  it('addButton before buttons() throws', () => {
    expect(() => buildMessage().addButton('x', 'X')).toThrow();
  });
});

describe('List builder — round-trip (nested sections & rows)', () => {
  it('builds a list with sections and rows', () => {
    const buf = buildMessage()
      .list('Menú', 'Ver opciones')
      .addSection('Bebidas', [
        { title: 'Agua', description: 'sin gas', rowId: 'r1' },
        { title: 'Jugo', description: 'naranja', rowId: 'r2' },
      ])
      .addSection('Comidas', [{ title: 'Pizza', rowId: 'r3' }])
      .footer('Gracias')
      .build();
    const list = Message.decode(buf).listMessage;
    if (list === null) throw new Error('expected listMessage');
    expect(list.title).toBe('Menú');
    expect(list.buttonText).toBe('Ver opciones');
    expect(list.footerText).toBe('Gracias');
    expect(list.sections).toHaveLength(2);

    const sec1 = list.sections[0];
    if (sec1 === undefined) throw new Error('expected section 0');
    expect(sec1.title).toBe('Bebidas');
    expect(sec1.rows).toHaveLength(2);
    expect(sec1.rows[0]?.title).toBe('Agua');
    expect(sec1.rows[0]?.description).toBe('sin gas');
    expect(sec1.rows[0]?.rowId).toBe('r1');

    const sec2 = list.sections[1];
    if (sec2 === undefined) throw new Error('expected section 1');
    expect(sec2.title).toBe('Comidas');
    expect(sec2.rows).toHaveLength(1);
    expect(sec2.rows[0]?.rowId).toBe('r3');
  });

  it('builds a list with a description and a row without optional fields', () => {
    const buf = buildMessage()
      .list('T')
      .addSection('S', [{ title: 'solo título' }])
      .build();
    const list = Message.decode(buf).listMessage;
    if (list === null) throw new Error('expected listMessage');
    const row = list.sections[0]?.rows[0];
    if (row === undefined) throw new Error('expected row');
    expect(row.title).toBe('solo título');
    expect(row.description).toBeNull();
    expect(row.rowId).toBeNull();
  });

  it('addSection before list() throws', () => {
    expect(() => buildMessage().addSection('S', [])).toThrow();
  });

  it('footer without an active interactive throws', () => {
    expect(() => buildMessage().footer('x')).toThrow();
  });

  it('switching from buttons to conversation clears interactive state', () => {
    const buf = buildMessage().buttons('x').addButton('a', 'A').conversation('final').build();
    const msg = Message.decode(buf);
    expect(msg.conversation).toBe('final');
    expect(msg.buttonsMessage).toBeNull();
  });

  it('list with description (body text)', () => {
    const buf = buildMessage()
      .list('Title', 'Open', 'Este es el cuerpo')
      .addSection('S', [{ title: 'r' }])
      .build();
    const list = Message.decode(buf).listMessage;
    if (list === null) throw new Error('expected listMessage');
    expect(list.title).toBe('Title');
    expect(list.description).toBe('Este es el cuerpo');
    expect(list.sections).toHaveLength(1);
  });
});
