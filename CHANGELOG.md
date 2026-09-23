# Changelog

All notable changes to `@brashkie/waproto` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.8.0] — 2026-09-22

### Added — ProtocolMessage (revoke / edit / ephemeral)

The meta-message a bot handles constantly: actions on other messages. Field
numbers and enum values verified against the official WhatsApp `.proto`.

- **`ProtocolMessage`** — `key` (target message), `type`, `ephemeralExpiration`,
  `editedMessage` (the new content on an edit), `timestampMs`, plus helpers
  `isRevoke`, `isEdit`, `isEphemeralSetting`.
- **`ProtocolMessageType`** enum (Revoke, EphemeralSetting, MessageEdit, and the
  common sync types).
- **`Message`** now exposes `protocolMessage`.

Coverage: 100% (lines/branches/functions), 50 tests, validated against the real
`@brashkie/signalis-codec` 0.5.0.

## [0.7.0] — 2026-09-22

### Added — Phase 4b (part 1): buttons & list messages

The two most-used interactive containers, with their nested types. Field numbers
verified against the official WhatsApp `.proto`.

- **`ButtonsMessage`** — `contentText`, `footerText`, `buttons` (repeated
  `Button[]`). **`Button`** exposes `buttonId` and `displayText` (from the nested
  `ButtonText`).
- **`ListMessage`** — `title`, `description`, `buttonText`, `footerText`,
  `sections` (repeated `Section[]`). **`Section`** has `title` and `rows`
  (repeated `Row[]` — repeated within repeated). **`Row`** has `title`,
  `description`, `rowId`.
- **`Message`** now exposes `buttonsMessage` and `listMessage`.

Coverage: 100% (lines/branches/functions), 45 tests, validated against the real
`@brashkie/signalis-codec` 0.5.0.

### Notes

- `TemplateMessage` (field 25) is deferred to its own release: its subtree
  (`HydratedFourRowTemplate`, `HighlyStructuredMessage`, `InteractiveMessage`,
  hydrated buttons) is large and warrants a focused pass.

## [0.6.0] — 2026-09-21

### Added — Phase 4a: interactive messages (reactions & polls)

First interactive types, using the codec 0.5.0 repeated-field readers for poll
options. Field numbers verified against the official WhatsApp `.proto`.

- **`ReactionMessage`** — `key`, `text` (emoji), `groupingKey`,
  `senderTimestampMs`, plus `isRemoval` (empty-text = reaction removed).
- **`PollCreationMessage`** — `name` (question), `selectableOptionsCount`,
  `options` (**repeated** `PollOption[]`), and `optionNames` convenience.
- **`PollOption`** — a single option (`name`).
- **`Message`** now exposes `reactionMessage` and `pollCreationMessage`. The poll
  getter resolves across WhatsApp's versioned fields (V5/V3/V2/base), returning
  whichever is present.

Coverage: 100% (lines/branches/functions), 39 tests, validated against the real
`@brashkie/signalis-codec` 0.5.0.

## [0.5.0] — 2026-09-20

### Added — `ContextInfo.mentionedJid` (repeated) + codec 0.5.0

- **`ContextInfo.mentionedJid`** → `string[]` — the JIDs @mentioned in a message.
  This closes the "known limitation" from 0.4.0: repeated fields are now read in
  full (every occurrence), via the codec's new `getAllStrings`.
- Bumped `@brashkie/signalis-codec` to **^0.5.0** (adds repeated-field readers).

### Convention

- Repeated getters return an **array** (empty if the field is absent), while
  scalar getters return `value | null`. Consistent and predictable.

## [0.4.0] — 2026-09-14

### Added — Phase 3: message envelope (routing metadata)

The envelope layer that makes lazy routing genuinely useful — a bot can read
`info.key.remoteJid` to route a message without decoding its content. Field
numbers verified against the official WhatsApp `.proto`.

- **`WebMessageInfo`** — the message envelope: `key`, `message` (nested content),
  `messageTimestamp` (bigint), `status`, `pushName`, `participant`, `starred`,
  `broadcast`. Entry point via `WebMessageInfo.decode(buf)`.
- **`MessageKey`** — `remoteJid`, `fromMe`, `id`, `participant` (what routing
  keys on).
- **`ContextInfo`** — reply/quote and forwarding metadata: `stanzaId`,
  `participant`, `remoteJid`, `forwardingScore`, `isForwarded`, `expiration`,
  plus `isReply`.
- **`MessageStatus`** enum (Error/Pending/ServerAck/DeliveryAck/Read/Played).
- `Message.from` added to wrap nested content messages.

### Known limitation

- Repeated fields (e.g. `ContextInfo.mentionedJid`, `labels`) are **not** exposed
  yet: the underlying lazy reader returns only the first occurrence of a field,
  so exposing repeated fields would silently drop values. They will be added once
  repeated-field reading lands in `@brashkie/signalis-codec`.

Coverage: 100% (lines/branches/functions), 27 tests, validated against the real
`@brashkie/signalis-codec`.

## [0.3.0] — 2026-09-13

### Added — Phase 2 complete: all media messages

Field numbers now **verified against the official WhatsApp `.proto`** (WAProto/
index.proto), including a re-validation of the v0.2.0 image/audio numbers (all
correct).

- **`VideoMessage`** — `url`, `mimetype`, `fileSha256`, `fileLength`, `seconds`,
  `mediaKey`, `caption`, `gifPlayback`, `height`, `width`, `fileEncSha256`,
  `directPath`, `viewOnce`, plus `isGif`.
- **`DocumentMessage`** — `url`, `mimetype`, `title`, `fileSha256`, `fileLength`,
  `pageCount`, `mediaKey`, `fileName`, `fileEncSha256`, `directPath`, `caption`.
- **`StickerMessage`** — `url`, `fileSha256`, `fileEncSha256`, `mediaKey`,
  `mimetype`, `height`, `width`, `directPath`, `fileLength`, `isAnimated`,
  `isAvatar`. Note: stickers use a **different field layout** (e.g. `fileSha256`
  is field 2, not 4) — verified against the schema.
- **`Message`** now exposes `videoMessage`, `documentMessage`, `stickerMessage`;
  `hasMedia` covers all five media types.

Coverage: 100% (lines/branches/functions), 22 tests, all validated against the
real `@brashkie/signalis-codec`.

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
