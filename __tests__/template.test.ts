import { WireType, encodeFields, fromString, fromUint32 } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { Message } from '../src';

// Helpers to hand-build a TemplateMessage (no builder for templates).
function qr(text: string, id: string): Buffer {
  return encodeFields([
    { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString(text) },
    { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString(id) },
  ]);
}
function urlBtn(text: string, url: string): Buffer {
  return encodeFields([
    { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString(text) },
    { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString(url) },
  ]);
}
function callBtn(text: string, phone: string): Buffer {
  return encodeFields([
    { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString(text) },
    { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString(phone) },
  ]);
}
// HydratedTemplateButton { index=4, quickReply=1 | url=2 | call=3 }
function button(index: number, variant: { field: number; bytes: Buffer }): Buffer {
  return encodeFields([
    { fieldNumber: variant.field, wireType: WireType.Bytes, bytes: variant.bytes },
    { fieldNumber: 4, wireType: WireType.Varint, varint: fromUint32(index) },
  ]);
}

describe('TemplateMessage (hydrated)', () => {
  it('reads content, footer, templateId and mixed buttons', () => {
    const hydrated = encodeFields([
      { fieldNumber: 6, wireType: WireType.Bytes, bytes: fromString('Elegí una opción') },
      { fieldNumber: 7, wireType: WireType.Bytes, bytes: fromString('Pie de página') },
      {
        fieldNumber: 8,
        wireType: WireType.Bytes,
        bytes: button(0, { field: 1, bytes: qr('Sí', 'yes') }),
      },
      {
        fieldNumber: 8,
        wireType: WireType.Bytes,
        bytes: button(1, { field: 2, bytes: urlBtn('Web', 'https://x.com') }),
      },
      {
        fieldNumber: 8,
        wireType: WireType.Bytes,
        bytes: button(2, { field: 3, bytes: callBtn('Llamar', '+549351') }),
      },
      { fieldNumber: 9, wireType: WireType.Bytes, bytes: fromString('tpl_1') },
    ]);
    // TemplateMessage { hydratedTemplate=4, templateId=9 }
    const tm = encodeFields([
      { fieldNumber: 4, wireType: WireType.Bytes, bytes: hydrated },
      { fieldNumber: 9, wireType: WireType.Bytes, bytes: fromString('tpl_outer') },
    ]);
    // Message { templateMessage=25 }
    const buf = encodeFields([{ fieldNumber: 25, wireType: WireType.Bytes, bytes: tm }]);

    const t = Message.decode(buf).templateMessage;
    if (t === null) throw new Error('expected templateMessage');
    expect(t.templateId).toBe('tpl_outer');
    const h = t.hydratedTemplate;
    if (h === null) throw new Error('expected hydratedTemplate');
    expect(h.contentText).toBe('Elegí una opción');
    expect(h.footerText).toBe('Pie de página');
    expect(h.templateId).toBe('tpl_1');
    expect(h.buttons).toHaveLength(3);

    const b0 = h.buttons[0];
    if (b0 === undefined) throw new Error('b0');
    expect(b0.index).toBe(0);
    expect(b0.quickReplyButton?.displayText).toBe('Sí');
    expect(b0.quickReplyButton?.id).toBe('yes');
    expect(b0.displayText).toBe('Sí');
    expect(b0.urlButton).toBeNull();

    const b1 = h.buttons[1];
    if (b1 === undefined) throw new Error('b1');
    expect(b1.urlButton?.url).toBe('https://x.com');
    expect(b1.displayText).toBe('Web');

    const b2 = h.buttons[2];
    if (b2 === undefined) throw new Error('b2');
    expect(b2.callButton?.phoneNumber).toBe('+549351');
    expect(b2.displayText).toBe('Llamar');
  });

  it('materializes with toObject recursively', () => {
    const hydrated = encodeFields([
      { fieldNumber: 6, wireType: WireType.Bytes, bytes: fromString('body') },
      {
        fieldNumber: 8,
        wireType: WireType.Bytes,
        bytes: button(0, { field: 1, bytes: qr('OK', 'ok') }),
      },
    ]);
    const tm = encodeFields([{ fieldNumber: 4, wireType: WireType.Bytes, bytes: hydrated }]);
    const buf = encodeFields([{ fieldNumber: 25, wireType: WireType.Bytes, bytes: tm }]);
    expect(Message.decode(buf).toObject()).toEqual({
      templateMessage: {
        hydratedTemplate: {
          contentText: 'body',
          buttons: [{ index: 0, quickReplyButton: { displayText: 'OK', id: 'ok' } }],
        },
      },
    });
  });

  it('null on non-template + empty buttons/absent fields', () => {
    const other = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('hi') },
    ]);
    expect(Message.decode(other).templateMessage).toBeNull();

    const tm = encodeFields([
      { fieldNumber: 9, wireType: WireType.Bytes, bytes: fromString('id') },
    ]);
    const buf = encodeFields([{ fieldNumber: 25, wireType: WireType.Bytes, bytes: tm }]);
    const t = Message.decode(buf).templateMessage;
    if (t === null) throw new Error('expected templateMessage');
    expect(t.hydratedTemplate).toBeNull();
    expect(t.templateId).toBe('id');
  });

  it('toObject materializes url and call buttons too', () => {
    const hydrated = encodeFields([
      {
        fieldNumber: 8,
        wireType: WireType.Bytes,
        bytes: button(0, { field: 2, bytes: urlBtn('Web', 'https://x.com') }),
      },
      {
        fieldNumber: 8,
        wireType: WireType.Bytes,
        bytes: button(1, { field: 3, bytes: callBtn('Llamar', '+549') }),
      },
    ]);
    const tm = encodeFields([{ fieldNumber: 4, wireType: WireType.Bytes, bytes: hydrated }]);
    const buf = encodeFields([{ fieldNumber: 25, wireType: WireType.Bytes, bytes: tm }]);
    expect(Message.decode(buf).toObject()).toEqual({
      templateMessage: {
        hydratedTemplate: {
          buttons: [
            { index: 0, urlButton: { displayText: 'Web', url: 'https://x.com' } },
            { index: 1, callButton: { displayText: 'Llamar', phoneNumber: '+549' } },
          ],
        },
      },
    });
  });

  it('button displayText null when no variant present', () => {
    const emptyBtn = encodeFields([
      { fieldNumber: 4, wireType: WireType.Varint, varint: fromUint32(5) },
    ]);
    const hydrated = encodeFields([{ fieldNumber: 8, wireType: WireType.Bytes, bytes: emptyBtn }]);
    const tm = encodeFields([{ fieldNumber: 4, wireType: WireType.Bytes, bytes: hydrated }]);
    const buf = encodeFields([{ fieldNumber: 25, wireType: WireType.Bytes, bytes: tm }]);
    const btn = Message.decode(buf).templateMessage?.hydratedTemplate?.buttons[0];
    if (btn === undefined) throw new Error('expected button');
    expect(btn.index).toBe(5);
    expect(btn.displayText).toBeNull();
    expect(btn.quickReplyButton).toBeNull();
    expect(btn.callButton).toBeNull();
    expect(btn.toObject()).toEqual({ index: 5 });
  });
});
