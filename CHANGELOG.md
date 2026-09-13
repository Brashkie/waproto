# Changelog

All notable changes to `@brashkie/waproto` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

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
