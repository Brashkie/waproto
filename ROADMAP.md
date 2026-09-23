# waproto Roadmap

`@brashkie/waproto` — WhatsApp protocol message models, lazy and zero-copy, on
top of `@brashkie/signalis-codec`. Built in phases, one clear step per release,
toward a from-scratch Baileys alternative.

## ✅ Phase 1 — Foundation & core Message (v0.1.0)

- [x] Lazy/zero-copy architecture (`LazyModel` over `signalis-codec` `lazyIndex`)
- [x] `Message` root model with common fields + helpers (`text`, `isText`, `hasMedia`)
- [x] `ExtendedTextMessage` (nested submessage pattern)
- [x] TypeScript-only design (no FFI of its own)

## ✅ Phase 2 — Media messages

- [x] `ImageMessage` *(v0.2.0 — field numbers verified)*
- [x] `AudioMessage` *(v0.2.0 — incl. ptt / isVoiceNote)*
- [x] `VideoMessage` *(v0.3.0 — verified vs official .proto)*
- [x] `DocumentMessage` *(v0.3.0)*
- [x] `StickerMessage` *(v0.3.0 — distinct field layout, verified)*

## ✅ Phase 3 — Context & metadata

- [x] `WebMessageInfo` *(v0.4.0 — envelope: key, message, timestamp, status, pushName)*
- [x] `MessageKey` *(v0.4.0 — remoteJid, fromMe, id, participant)*
- [x] `ContextInfo` *(v0.4.0 — reply/quote + forwarding; scalar fields)*
- [x] Repeated fields — `ContextInfo.mentionedJid` *(v0.5.0, via signalis-codec 0.5.0 `getAllStrings`)*

## 🟡 Phase 4 — Interactive & protocol messages

- [x] `ReactionMessage` *(v0.6.0)*
- [x] `PollCreationMessage` + `PollOption` *(v0.6.0 — repeated options)*
- [x] `ProtocolMessage` *(v0.8.0 — revoke/edit/ephemeral)*
- [x] `ButtonsMessage` + `Button` *(v0.7.0)*
- [x] `ListMessage` + `Section` + `Row` *(v0.7.0 — nested repeated)*
- [ ] `TemplateMessage` (Phase 4b part 2 — large subtree, own release)

## 🟡 Phase 5 — Encoding (write path)

- [x] Fluent builders: conversation / extendedText+preview / reaction *(v0.9.0)*
- [ ] Media & interactive builders (image/buttons/list)
- [ ] `.toObject()` eager materialization for when the full object is wanted

## 🔲 Phase 6 — Codegen (optional)

- [ ] Generate models directly from the WhatsApp `.proto` schema
- [ ] Keep hand-written ergonomics where they matter

## 🔮 Beyond

- Feeds into `signalis-net` (transport: socket + Noise + framing) and, together
  with `@brashkie/signalis`, a from-scratch Baileys alternative.

**Progress: Phase 5 started (fluent builders: text, extended text, reaction). Next: media/interactive builders, or TemplateMessage.**
