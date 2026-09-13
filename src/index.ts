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
