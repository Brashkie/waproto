import { WireType, encodeFields, fromString } from '@brashkie/signalis-codec';
import { describe, expect, it } from 'vitest';

import { ContextInfo, Message, WebMessageInfo, buildMessage } from '../src';

describe('toObject() — eager materialization', () => {
  it('materializes a conversation', () => {
    const buf = buildMessage().conversation('hola').build();
    expect(Message.decode(buf).toObject()).toEqual({ conversation: 'hola' });
  });

  it('omits absent fields (only present ones appear)', () => {
    const buf = buildMessage().image({ mimetype: 'image/jpeg', caption: 'foto' }).build();
    expect(Message.decode(buf).toObject()).toEqual({
      imageMessage: { mimetype: 'image/jpeg', caption: 'foto' },
    });
  });

  it('materializes nested submessages recursively', () => {
    const buf = buildMessage()
      .extendedText('con link')
      .withPreview('https://x.com', 'X', 'desc')
      .build();
    expect(Message.decode(buf).toObject()).toEqual({
      extendedTextMessage: {
        text: 'con link',
        canonicalUrl: 'https://x.com',
        title: 'X',
        description: 'desc',
      },
    });
  });

  it('materializes repeated fields (poll options, list rows)', () => {
    const buf = buildMessage()
      .list('Menú', 'Ver')
      .addSection('Bebidas', [
        { title: 'Agua', rowId: 'r1' },
        { title: 'Jugo', rowId: 'r2' },
      ])
      .build();
    expect(Message.decode(buf).toObject()).toEqual({
      listMessage: {
        title: 'Menú',
        buttonText: 'Ver',
        sections: [
          {
            title: 'Bebidas',
            rows: [
              { title: 'Agua', rowId: 'r1' },
              { title: 'Jugo', rowId: 'r2' },
            ],
          },
        ],
      },
    });
  });

  it('omits empty arrays', () => {
    // buttons message with no buttons → buttons array omitted
    const buf = buildMessage().buttons('solo texto').build();
    expect(Message.decode(buf).toObject()).toEqual({
      buttonsMessage: { contentText: 'solo texto' },
    });
  });

  it('materializes the envelope with nested key and message', () => {
    const key = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('chat@s.whatsapp.net') },
    ]);
    const message = buildMessage().conversation('hi').build();
    const buf = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: key },
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: message },
      { fieldNumber: 19, wireType: WireType.Bytes, bytes: fromString('Brashkie') },
    ]);
    expect(WebMessageInfo.decode(buf).toObject()).toEqual({
      key: { remoteJid: 'chat@s.whatsapp.net' },
      message: { conversation: 'hi' },
      pushName: 'Brashkie',
    });
  });

  it('is JSON-serializable (bigints aside)', () => {
    const buf = buildMessage().conversation('json test').build();
    const obj = Message.decode(buf).toObject();
    expect(JSON.stringify(obj)).toBe('{"conversation":"json test"}');
  });
});

describe('toObject() — remaining types (full coverage)', () => {
  it('audio', () => {
    const buf = buildMessage()
      .audio({ url: 'a', mimetype: 'audio/ogg', seconds: 5, ptt: true, fileLength: 100 })
      .build();
    expect(Message.decode(buf).toObject()).toEqual({
      audioMessage: { url: 'a', mimetype: 'audio/ogg', seconds: 5, ptt: true, fileLength: 100n },
    });
  });

  it('video', () => {
    const buf = buildMessage()
      .video({ mimetype: 'video/mp4', seconds: 10, gifPlayback: false, height: 720, width: 1280 })
      .build();
    expect(Message.decode(buf).toObject()).toEqual({
      videoMessage: {
        mimetype: 'video/mp4',
        seconds: 10,
        gifPlayback: false,
        height: 720,
        width: 1280,
      },
    });
  });

  it('document', () => {
    const buf = buildMessage()
      .document({ mimetype: 'application/pdf', title: 'T', fileName: 'f.pdf', pageCount: 3 })
      .build();
    expect(Message.decode(buf).toObject()).toEqual({
      documentMessage: { mimetype: 'application/pdf', title: 'T', fileName: 'f.pdf', pageCount: 3 },
    });
  });

  it('sticker', () => {
    // sticker has no builder; decode a hand-built one
    const stk = encodeFields([
      { fieldNumber: 5, wireType: WireType.Bytes, bytes: fromString('image/webp') },
      { fieldNumber: 6, wireType: WireType.Varint, varint: 512n },
      { fieldNumber: 7, wireType: WireType.Varint, varint: 512n },
    ]);
    const buf = encodeFields([{ fieldNumber: 26, wireType: WireType.Bytes, bytes: stk }]);
    expect(Message.decode(buf).toObject()).toEqual({
      stickerMessage: { mimetype: 'image/webp', height: 512, width: 512 },
    });
  });

  it('reaction (with key submessage)', () => {
    const buf = buildMessage()
      .reaction({ remoteJid: 'c@s.whatsapp.net', fromMe: true, id: 'X' }, '👍')
      .build();
    expect(Message.decode(buf).toObject()).toEqual({
      reactionMessage: {
        key: { remoteJid: 'c@s.whatsapp.net', fromMe: true, id: 'X' },
        text: '👍',
      },
    });
  });

  it('poll (with options)', () => {
    const opt = (name: string) =>
      encodeFields([{ fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString(name) }]);
    const poll = encodeFields([
      { fieldNumber: 2, wireType: WireType.Bytes, bytes: fromString('¿Cuál?') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: opt('A') },
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: opt('B') },
    ]);
    const buf = encodeFields([{ fieldNumber: 49, wireType: WireType.Bytes, bytes: poll }]);
    expect(Message.decode(buf).toObject()).toEqual({
      pollCreationMessage: { name: '¿Cuál?', options: [{ name: 'A' }, { name: 'B' }] },
    });
  });

  it('protocol (revoke with key)', () => {
    const key = encodeFields([
      { fieldNumber: 3, wireType: WireType.Bytes, bytes: fromString('MSG') },
    ]);
    const pm = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: key },
      { fieldNumber: 2, wireType: WireType.Varint, varint: 0n },
    ]);
    const buf = encodeFields([{ fieldNumber: 12, wireType: WireType.Bytes, bytes: pm }]);
    expect(Message.decode(buf).toObject()).toEqual({
      protocolMessage: { key: { id: 'MSG' }, type: 0 },
    });
  });

  it('protocol (edit with editedMessage submessage)', () => {
    const edited = buildMessage().conversation('corregido').build();
    const pm = encodeFields([
      { fieldNumber: 2, wireType: WireType.Varint, varint: 14n }, // MESSAGE_EDIT
      { fieldNumber: 14, wireType: WireType.Bytes, bytes: edited },
    ]);
    const buf = encodeFields([{ fieldNumber: 12, wireType: WireType.Bytes, bytes: pm }]);
    expect(Message.decode(buf).toObject()).toEqual({
      protocolMessage: { type: 14, editedMessage: { conversation: 'corregido' } },
    });
  });

  it('buttons with an actual button (Button.toObject)', () => {
    const buf = buildMessage().buttons('¿?').addButton('yes', 'Sí').build();
    expect(Message.decode(buf).toObject()).toEqual({
      buttonsMessage: { contentText: '¿?', buttons: [{ buttonId: 'yes', displayText: 'Sí' }] },
    });
  });

  it('context-info', () => {
    const ctx = encodeFields([
      { fieldNumber: 1, wireType: WireType.Bytes, bytes: fromString('QUOTED') },
      { fieldNumber: 15, wireType: WireType.Bytes, bytes: fromString('m1@s.whatsapp.net') },
      { fieldNumber: 15, wireType: WireType.Bytes, bytes: fromString('m2@s.whatsapp.net') },
      { fieldNumber: 22, wireType: WireType.Varint, varint: 1n },
    ]);
    const wmi = WebMessageInfo.decode(
      encodeFields([{ fieldNumber: 1, wireType: WireType.Bytes, bytes: ctx }]),
    );
    const raw = (wmi as unknown as { raw: { getMessage: (n: number) => unknown } }).raw.getMessage(
      1,
    );
    const ci = (ContextInfo as unknown as { from: (r: unknown) => ContextInfo }).from(raw);
    expect(ci.toObject()).toEqual({
      stanzaId: 'QUOTED',
      mentionedJid: ['m1@s.whatsapp.net', 'm2@s.whatsapp.net'],
      isForwarded: true,
    });
  });
});
