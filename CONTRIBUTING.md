# Contributing to waproto

Thanks for your interest! waproto is part of the Hepein ecosystem.

## Principles

1. **TypeScript only.** waproto has no native addon of its own. The heavy work
   (protobuf wire, crypto) is in `@brashkie/signalis-codec` /
   `@brashkie/signalis-core`. Do **not** add a Rust crate or N-API binding here —
   if profiling ever shows a real bottleneck, we discuss it first.
2. **Schema-accurate.** Field numbers must match the official WhatsApp protobuf
   schema exactly. We speak the real protocol; we don't invent fields.
3. **Lazy / zero-copy by default.** Read fields on demand; don't eagerly
   materialize whole objects unless the API explicitly asks for it.
4. **One clear thing per release**, in phases (see ROADMAP.md).

## Development

```bash
npm install
npm run lint        # biome
npm run typecheck   # tsc
npm run test        # vitest
npm run test:coverage
npm run build       # tsup
```

## Adding a message type

1. Find the field numbers in the WhatsApp schema.
2. Create a model under `src/messages/` extending `LazyModel`.
3. Map field numbers → typed getters (use `const enum Field`).
4. Add tests that encode a sample with `signalis-codec` and read it back.
5. Export it from `src/index.ts` and note it in CHANGELOG/ROADMAP.

## Commit style

Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
