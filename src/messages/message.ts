/**
 * WhatsApp `Message` — the root content container. A message carries exactly one
 * of ~100 optional content fields (conversation, image, video, ...); this model
 * reads only the ones you access, over the original buffer, zero-copy.
 *
 * Field numbers are from the official WhatsApp protobuf schema.
 */

import { LazyModel, indexBuffer } from '../field-reader';
import { ExtendedTextMessage } from './extended-text-message';

/** Field numbers within Message (WhatsApp schema). */
const enum Field {
  Conversation = 1,
  SenderKeyDistributionMessage = 2,
  ImageMessage = 3,
  ContactMessage = 4,
  LocationMessage = 5,
  ExtendedTextMessage = 6,
  DocumentMessage = 7,
  AudioMessage = 8,
  VideoMessage = 9,
  ProtocolMessage = 12,
}

/**
 * A lazy, zero-copy view over a WhatsApp `Message`.
 *
 * @example
 * import { Message } from '@brashkie/waproto';
 *
 * const msg = Message.decode(buffer);   // nothing decoded yet
 * if (msg.conversation !== null) {      // read only this field
 *   console.log(msg.conversation);
 * }
 */
export class Message extends LazyModel {
  /**
   * Wrap a raw protobuf buffer for lazy reading. Does not decode anything until
   * a field is accessed.
   */
  static decode(buf: Buffer): Message {
    return new Message(indexBuffer(buf));
  }

  /** Plain text content (the common case for a simple chat message). */
  get conversation(): string | null {
    return this.raw.getString(Field.Conversation);
  }

  /** Rich text message (replies, link previews). Lazily indexed submessage. */
  get extendedTextMessage(): ExtendedTextMessage | null {
    const sub = this.raw.getMessage(Field.ExtendedTextMessage);
    return sub === null ? null : ExtendedTextMessage.from(sub);
  }

  /** Whether this message carries plain-text content. */
  get isText(): boolean {
    return this.has(Field.Conversation) || this.has(Field.ExtendedTextMessage);
  }

  /**
   * The best-effort text of the message, checking `conversation` then
   * `extendedTextMessage.text`. Returns `null` if the message has no text.
   */
  get text(): string | null {
    return this.conversation ?? this.extendedTextMessage?.text ?? null;
  }

  /** Whether this message carries media (image/video/audio/document). */
  get hasMedia(): boolean {
    return (
      this.has(Field.ImageMessage) ||
      this.has(Field.VideoMessage) ||
      this.has(Field.AudioMessage) ||
      this.has(Field.DocumentMessage)
    );
  }
}
