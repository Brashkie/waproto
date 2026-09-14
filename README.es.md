# @brashkie/waproto

Modelos de mensajes del **protocolo de WhatsApp**, lazy y zero-copy, para Node.js.

Parte del ecosistema [Hepein](https://github.com/Brashkie) — construido sobre
`@brashkie/signalis-codec` (wire codec protobuf) y `@brashkie/signalis-core`
(criptografía), en el camino hacia una alternativa a Baileys hecha desde cero.

## Por qué

Las librerías actuales de WhatsApp (Baileys) decodifican cada mensaje completo a
un objeto JS — incluso cuando solo necesitás un campo para enrutarlo o filtrarlo.
waproto lee **lazy**: un mensaje con 100+ campos posibles, de los cuales 1–3
están presentes y leés 1, nunca toca el resto. Los valores se leen como vistas
sobre el buffer original (zero-copy) hasta que los materializás.

El trabajo pesado (parsing del wire protobuf, bounds-checking, límite de
profundidad) vive en `signalis-codec` (Rust). waproto es la capa de schema en
TypeScript por encima — números de campo del schema oficial de WhatsApp,
mapeados a modelos tipados.

## Instalación

```bash
npm install @brashkie/waproto
```

## Uso

```typescript
import { Message, WebMessageInfo } from '@brashkie/waproto';

// Envolvé un buffer de Message de WhatsApp — nada se decodifica todavía.
const msg = Message.decode(buffer);

// Leé solo el campo que necesitás (lazy, zero-copy):
if (msg.conversation !== null) {
  console.log('texto:', msg.conversation);
}

// Los submensajes anidados también son lazy:
const ext = msg.extendedTextMessage;
if (ext !== null) {
  console.log(ext.text, ext.title);
}

// Mensajes de media (v0.2.0) — también lazy:
const img = msg.imageMessage;
if (img !== null) {
  console.log(img.mimetype, img.width, img.height, img.fileLength);
}
const audio = msg.audioMessage;
if (audio !== null && audio.isVoiceNote) {
  console.log(`nota de voz, ${audio.seconds}s`);
}

// v0.3.0: video, document, sticker (todos verificados vs el .proto oficial)
msg.videoMessage?.isGif;
msg.documentMessage?.fileName;
msg.stickerMessage?.isAnimated;
```

```typescript
// v0.4.0: envelope para routing (leer key sin decodificar el contenido)
const info = WebMessageInfo.decode(envelopeBuffer);
if (info.key?.remoteJid?.endsWith('@g.us')) {
  // group message — route without touching the content
}
console.log(info.pushName, info.messageTimestamp);
const text = info.message?.conversation;  // content read only if needed
```

## Diseño

- **Solo TypeScript** — sin addon nativo propio; usa el Rust de
  `signalis-codec` / `signalis-core` como dependencias.
- **Lazy / zero-copy** — vía `lazyIndex` de `signalis-codec`.
- **Fiel al schema** — números de campo del schema oficial de WhatsApp.

## Estado

Fase 1: base + `Message` / `ExtendedTextMessage`. Ver [ROADMAP.md](./ROADMAP.md)
para el plan por fases.

## Licencia

Apache-2.0 — Brashkie / Hepein Oficial.
