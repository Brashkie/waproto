/**
 * WhatsApp `Message` — the root content container. A message carries exactly one
 * of ~100 optional content fields (conversation, image, video, ...); this model
 * reads only the ones you access, over the original buffer, zero-copy.
 *
 * Field numbers are from the official WhatsApp protobuf schema.
 */

import { LazyModel, indexBuffer } from '../field-reader';
import { AudioMessage } from './audio-message';
import { DocumentMessage } from './document-message';
import { ExtendedTextMessage } from './extended-text-message';
import { ImageMessage } from './image-message';
import { PollCreationMessage } from './poll-creation-message';
import { ReactionMessage } from './reaction-message';
import { StickerMessage } from './sticker-message';
import { VideoMessage } from './video-message';

/** Field numbers within Message (WhatsApp schema). */
enum Field {
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
  StickerMessage = 26,
  ReactionMessage = 46,
  PollCreationMessage = 49,
  PollCreationMessageV2 = 60,
  PollCreationMessageV3 = 64,
  PollCreationMessageV5 = 111,
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

  /**
   * Wrap an already-indexed submessage (e.g. the `message` field of a
   * `WebMessageInfo`). Internal use for nested Message fields.
   * @internal
   */
  static from(raw: import('@brashkie/signalis-codec').LazyMessage): Message {
    return new Message(raw);
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

  /** Image content. Lazily indexed submessage. */
  get imageMessage(): ImageMessage | null {
    const sub = this.raw.getMessage(Field.ImageMessage);
    return sub === null ? null : ImageMessage.from(sub);
  }

  /** Audio content (voice notes / audio files). Lazily indexed submessage. */
  get audioMessage(): AudioMessage | null {
    const sub = this.raw.getMessage(Field.AudioMessage);
    return sub === null ? null : AudioMessage.from(sub);
  }

  /** Video content. Lazily indexed submessage. */
  get videoMessage(): VideoMessage | null {
    const sub = this.raw.getMessage(Field.VideoMessage);
    return sub === null ? null : VideoMessage.from(sub);
  }

  /** Document / file content. Lazily indexed submessage. */
  get documentMessage(): DocumentMessage | null {
    const sub = this.raw.getMessage(Field.DocumentMessage);
    return sub === null ? null : DocumentMessage.from(sub);
  }

  /** Sticker content. Lazily indexed submessage. */
  get stickerMessage(): StickerMessage | null {
    const sub = this.raw.getMessage(Field.StickerMessage);
    return sub === null ? null : StickerMessage.from(sub);
  }

  /** Emoji reaction to another message. Lazily indexed submessage. */
  get reactionMessage(): ReactionMessage | null {
    const sub = this.raw.getMessage(Field.ReactionMessage);
    return sub === null ? null : ReactionMessage.from(sub);
  }

  /**
   * Poll creation. WhatsApp uses several versioned fields for polls depending on
   * the client; this returns whichever version is present (newest first).
   */
  get pollCreationMessage(): PollCreationMessage | null {
    for (const field of [
      Field.PollCreationMessageV5,
      Field.PollCreationMessageV3,
      Field.PollCreationMessageV2,
      Field.PollCreationMessage,
    ]) {
      const sub = this.raw.getMessage(field);
      if (sub !== null) return PollCreationMessage.from(sub);
    }
    return null;
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
      this.has(Field.DocumentMessage) ||
      this.has(Field.StickerMessage)
    );
  }
}
