# @brashkie/waproto

Lazy, zero-copy **WhatsApp protocol** message models for Node.js.

Part of the [Hepein](https://github.com/Brashkie) ecosystem — built on
`@brashkie/signalis-codec` (protobuf wire codec) and `@brashkie/signalis-core`
(crypto), on the path to a from-scratch alternative to Baileys.

## Why

Existing WhatsApp libraries (Baileys) decode every message eagerly into a full
JS object — even when you only need one field to route or filter it. waproto
reads **lazily**: a message with 100+ possible fields, of which 1–3 are present
and you read 1, never touches the rest. Values are read as views over the
original buffer (zero-copy) until you materialize them.

The heavy lifting (protobuf wire parsing, bounds-checking, depth limiting) lives
in the Rust-backed `signalis-codec`. waproto is the TypeScript schema layer on
top — field numbers from the official WhatsApp schema, mapped to typed models.

## Install

```bash
npm install @brashkie/waproto
```

## Usage

```typescript
import { Message, WebMessageInfo } from '@brashkie/waproto';

// Wrap a raw WhatsApp Message buffer — nothing is decoded yet.
const msg = Message.decode(buffer);

// Read only the field you need (lazy, zero-copy):
if (msg.conversation !== null) {
  console.log('text:', msg.conversation);
}

// Nested submessages are lazy too:
const ext = msg.extendedTextMessage;
if (ext !== null) {
  console.log(ext.text, ext.title);
}

// Media messages (v0.2.0) — also lazy:
const img = msg.imageMessage;
if (img !== null) {
  console.log(img.mimetype, img.width, img.height, img.fileLength);
}
const audio = msg.audioMessage;
if (audio !== null && audio.isVoiceNote) {
  console.log(`voice note, ${audio.seconds}s`);
}

// v0.3.0: video, document, sticker (todos verificados vs el .proto oficial)
msg.videoMessage?.isGif;
msg.documentMessage?.fileName;
msg.stickerMessage?.isAnimated;

// Convenience helpers:
msg.text;           // conversation ?? extendedTextMessage.text
msg.isText;         // boolean
msg.hasMedia;       // boolean
msg.has(1);         // is field present? (no decode)
msg.presentFields(); // which fields are present
```

```typescript
// v0.4.0: envelope for routing (read key without decoding content)
const info = WebMessageInfo.decode(envelopeBuffer);
if (info.key?.remoteJid?.endsWith('@g.us')) {
  // group message — route without touching the content
}
console.log(info.pushName, info.messageTimestamp);
const text = info.message?.conversation;  // content read only if needed
```

## Design

- **TypeScript only** — no native addon of its own; it uses the Rust in
  `signalis-codec` / `signalis-core` as dependencies.
- **Lazy / zero-copy** — via `signalis-codec`'s `lazyIndex`. Fields are decoded
  on access; length-delimited values are views over the buffer until used.
- **Schema-accurate** — field numbers come from the official WhatsApp protobuf
  schema, so it speaks the exact wire protocol.

## Status

Phase 1: foundation + `Message` / `ExtendedTextMessage`. See
[ROADMAP.md](./ROADMAP.md) for the phased plan (media, context, builders, ...).

## License

Apache-2.0 — Brashkie / Hepein Oficial.
