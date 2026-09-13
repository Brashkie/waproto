# waproto Roadmap

`@brashkie/waproto` — WhatsApp protocol message models, lazy and zero-copy, on
top of `@brashkie/signalis-codec`. Built in phases, one clear step per release,
toward a from-scratch Baileys alternative.

## ✅ Phase 1 — Foundation & core Message (v0.1.0)

- [x] Lazy/zero-copy architecture (`LazyModel` over `signalis-codec` `lazyIndex`)
- [x] `Message` root model with common fields + helpers (`text`, `isText`, `hasMedia`)
- [x] `ExtendedTextMessage` (nested submessage pattern)
- [x] TypeScript-only design (no FFI of its own)

## 🟡 Phase 2 — Media messages

- [x] `ImageMessage` *(v0.2.0 — field numbers verified)*
- [x] `AudioMessage` *(v0.2.0 — incl. ptt / isVoiceNote)*
- [ ] `VideoMessage`, `DocumentMessage` *(pending field-number verification vs official .proto)*
- [ ] `StickerMessage`

## 🔲 Phase 3 — Context & metadata

- [ ] `ContextInfo` (replies, mentions, forwarding)
- [ ] `WebMessageInfo` (the message envelope: key, timestamp, status, pushName)
- [ ] `MessageKey` (remoteJid, fromMe, id)

## 🔲 Phase 4 — Interactive & protocol messages

- [ ] `ProtocolMessage`, `ReactionMessage`, `PollCreationMessage`
- [ ] `ButtonsMessage`, `ListMessage`, `TemplateMessage`

## 🔲 Phase 5 — Encoding (write path)

- [ ] Builders to construct messages (encode, not just decode)
- [ ] `.toObject()` eager materialization for when the full object is wanted

## 🔲 Phase 6 — Codegen (optional)

- [ ] Generate models directly from the WhatsApp `.proto` schema
- [ ] Keep hand-written ergonomics where they matter

## 🔮 Beyond

- Feeds into `signalis-net` (transport: socket + Noise + framing) and, together
  with `@brashkie/signalis`, a from-scratch Baileys alternative.

**Progress: Phase 2 in progress (image + audio done; video/document/sticker pending).**
