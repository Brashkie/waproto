/**
 * @brashkie/waproto — lazy, zero-copy WhatsApp protocol message models.
 *
 * Built on `@brashkie/signalis-codec` (the protobuf wire codec) and, through it,
 * `@brashkie/signalis-core` (crypto). waproto adds the WhatsApp schema layer:
 * field-number → name mappings and typed message models — read lazily, over the
 * original buffer, with no eager decode and no per-field allocation until you
 * access a field.
 *
 * Part of the Hepein ecosystem, on the path to a from-scratch Baileys
 * alternative.
 *
 * @packageDocumentation
 */

export { LazyModel } from './field-reader';
export { Message } from './messages/message';
export { ExtendedTextMessage } from './messages/extended-text-message';
export { ImageMessage } from './messages/image-message';
export { AudioMessage } from './messages/audio-message';
export { VideoMessage } from './messages/video-message';
export { DocumentMessage } from './messages/document-message';
export { StickerMessage } from './messages/sticker-message';
export { MessageKey } from './messages/message-key';
export { ContextInfo } from './messages/context-info';
export { WebMessageInfo, MessageStatus } from './messages/web-message-info';
export { ReactionMessage } from './messages/reaction-message';
export { PollCreationMessage, PollOption } from './messages/poll-creation-message';
export { ButtonsMessage, Button } from './messages/buttons-message';
export { ListMessage, Section, Row } from './messages/list-message';
export { ProtocolMessage, ProtocolMessageType } from './messages/protocol-message';

// ─── Builders (write path, v0.9.0) ───────────────────────────────────────────
export { buildMessage, MessageBuilder } from './builders/message-builder';
export type { KeyInput } from './builders/message-builder';
export type {
  ImageOptions,
  VideoOptions,
  AudioOptions,
  DocumentOptions,
} from './builders/media-builder';
