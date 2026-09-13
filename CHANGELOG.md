# Changelog

All notable changes to `@brashkie/waproto` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.2.0] — 2026-09-13

### Added — Phase 2 (part 1): image & audio media messages

- **`ImageMessage`** — lazy model for image content: `url`, `mimetype`,
  `caption`, `fileSha256`, `fileLength` (bigint), `height`, `width`, `mediaKey`,
  `fileEncSha256`, `directPath`.
- **`AudioMessage`** — lazy model for audio / voice notes: `url`, `mimetype`,
  `fileSha256`, `fileLength` (bigint), `seconds`, `ptt`, `mediaKey`,
  `fileEncSha256`, `directPath`, plus `isVoiceNote` helper.
- **`Message`** now exposes `imageMessage` and `audioMessage` (lazily indexed
  submessages).

Field numbers verified against the WhatsApp protobuf schema (whatsmeow /
go-whatsapp). Every getter is exercised by a test, so each field number is
validated. Coverage: 100% lines/functions.

### Notes

- Video, Document, and Sticker media are intentionally **not** in this release:
  their exact field numbers were not verified to the same confidence as image/
  audio. They land in a follow-up once confirmed against the official `.proto`
  (wrong field numbers would silently mis-decode — not acceptable in a protocol
  library).

## [0.1.0] — 2026-09-12

### Added — Phase 1: lazy Message model

First release. Establishes the lazy, zero-copy architecture and the first
WhatsApp message models, built on `@brashkie/signalis-codec`.

- **`Message`** — the root WhatsApp content container, read lazily: nothing is
  decoded until a field is accessed. Getters map protobuf field numbers (from the
  official WhatsApp schema) to names: `conversation`, `extendedTextMessage`, plus
  helpers `text`, `isText`, `hasMedia`, `has`, `presentFields`.
- **`ExtendedTextMessage`** — nested rich-text model (`text`, `title`,
  `description`, `canonicalUrl`), also lazy. Demonstrates the nested-submessage
  pattern via `getMessage`.
- **`LazyModel`** — base class wrapping `signalis-codec`'s `lazyIndex`, shared by
  all message models.

### Architecture

- waproto is **TypeScript**; the heavy work (protobuf wire, crypto) lives in the
  Rust-backed `@brashkie/signalis-codec` / `@brashkie/signalis-core`
  dependencies. No FFI boundary of its own.
- **Zero-copy / lazy by design:** field values are read on demand as views over
  the original buffer. A message with 100+ possible fields, of which you read 1,
  never touches the rest — the advantage over eager decoders (Baileys/protobufjs)
  for sparse access and routing.
