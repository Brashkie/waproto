/**
 * Fluent builders for constructing WhatsApp `Message` buffers (the write path).
 *
 * Where the `Message` model *reads* bytes lazily, these builders *write* them:
 * a fluent API assembles the protobuf field list and `.build()` encodes it via
 * `@brashkie/signalis-codec`. Field numbers are the same verified values used by
 * the readers — read and write share one source of truth.
 *
 * @example
 * import { buildMessage } from '@brashkie/waproto';
 *
 * const buf = buildMessage().conversation('Hola!').build();
 * const reply = buildMessage()
 *   .extendedText('Mirá esto')
 *   .withPreview('https://example.com', 'Example', 'A site')
 *   .build();
 */

import {
  type FieldInput,
  WireType,
  encodeFields,
  fromString,
  fromUint32,
} from '@brashkie/signalis-codec';

import {
  type AudioOptions,
  type DocumentOptions,
  type ImageOptions,
  type VideoOptions,
  encodeAudio,
  encodeDocument,
  encodeImage,
  encodeVideo,
} from './media-builder';

/** Message field numbers (write side — mirror of the reader's schema). */
const MessageField = {
  Conversation: 1,
  ImageMessage: 3,
  DocumentMessage: 7,
  AudioMessage: 8,
  VideoMessage: 9,
  ExtendedTextMessage: 6,
  ReactionMessage: 46,
} as const;

/** ExtendedTextMessage field numbers. */
const ExtField = {
  Text: 1,
  CanonicalUrl: 4,
  Description: 5,
  Title: 6,
} as const;

/** ReactionMessage field numbers. */
const ReactionField = {
  Key: 1,
  Text: 2,
  SenderTimestampMs: 4,
} as const;

/** MessageKey field numbers. */
const KeyField = {
  RemoteJid: 1,
  FromMe: 2,
  Id: 3,
} as const;

/** A message key used to target a reaction. */
export interface KeyInput {
  remoteJid: string;
  fromMe: boolean;
  id: string;
}

function bytesField(fieldNumber: number, value: Buffer): FieldInput {
  return { fieldNumber, wireType: WireType.Bytes, bytes: value };
}

function stringField(fieldNumber: number, value: string): FieldInput {
  return bytesField(fieldNumber, fromString(value));
}

function encodeKey(key: KeyInput): Buffer {
  return encodeFields([
    stringField(KeyField.RemoteJid, key.remoteJid),
    { fieldNumber: KeyField.FromMe, wireType: WireType.Varint, varint: key.fromMe ? 1n : 0n },
    stringField(KeyField.Id, key.id),
  ]);
}

/**
 * Fluent builder for a WhatsApp `Message`. Exactly one content type should be
 * set; `.build()` returns the encoded protobuf buffer.
 */
export class MessageBuilder {
  private field: FieldInput | null = null;
  private extExtras: FieldInput[] = [];

  /** Set plain-text content. */
  conversation(text: string): this {
    this.field = stringField(MessageField.Conversation, text);
    this.extExtras = [];
    return this;
  }

  /** Start an extended text message (text with optional preview/context). */
  extendedText(text: string): this {
    this.extExtras = [stringField(ExtField.Text, text)];
    // The submessage bytes are assembled at build() time so `.withPreview()`
    // and friends can add to it fluently.
    this.field = {
      fieldNumber: MessageField.ExtendedTextMessage,
      wireType: WireType.Bytes,
      bytes: Buffer.alloc(0),
    };
    return this;
  }

  /** Add a link preview to an extended text message. */
  withPreview(url: string, title?: string, description?: string): this {
    this.extExtras.push(stringField(ExtField.CanonicalUrl, url));
    if (title !== undefined) this.extExtras.push(stringField(ExtField.Title, title));
    if (description !== undefined)
      this.extExtras.push(stringField(ExtField.Description, description));
    return this;
  }

  /**
   * Build a reaction to another message. `emoji` empty string removes a previous
   * reaction.
   */
  reaction(target: KeyInput, emoji: string, senderTimestampMs?: number): this {
    const fields: FieldInput[] = [
      bytesField(ReactionField.Key, encodeKey(target)),
      stringField(ReactionField.Text, emoji),
    ];
    if (senderTimestampMs !== undefined) {
      fields.push({
        fieldNumber: ReactionField.SenderTimestampMs,
        wireType: WireType.Varint,
        varint: BigInt(senderTimestampMs),
      });
    }
    this.field = bytesField(MessageField.ReactionMessage, encodeFields(fields));
    this.extExtras = [];
    return this;
  }

  /** Build an image message. */
  image(options: ImageOptions): this {
    this.field = bytesField(MessageField.ImageMessage, encodeImage(options));
    this.extExtras = [];
    return this;
  }

  /** Build a video message. */
  video(options: VideoOptions): this {
    this.field = bytesField(MessageField.VideoMessage, encodeVideo(options));
    this.extExtras = [];
    return this;
  }

  /** Build an audio message (set `ptt: true` for a voice note). */
  audio(options: AudioOptions): this {
    this.field = bytesField(MessageField.AudioMessage, encodeAudio(options));
    this.extExtras = [];
    return this;
  }

  /** Build a document message. */
  document(options: DocumentOptions): this {
    this.field = bytesField(MessageField.DocumentMessage, encodeDocument(options));
    this.extExtras = [];
    return this;
  }

  /** Encode the message to a protobuf buffer. */
  build(): Buffer {
    if (this.field === null) {
      throw new Error(
        'MessageBuilder: no content set — call conversation(), extendedText(), or reaction() first',
      );
    }
    // Assemble the extendedText submessage now (if that's what was chosen).
    if (this.field.fieldNumber === MessageField.ExtendedTextMessage) {
      const sub = encodeFields(this.extExtras);
      return encodeFields([bytesField(MessageField.ExtendedTextMessage, sub)]);
    }
    return encodeFields([this.field]);
  }
}

/** Create a new fluent {@link MessageBuilder}. */
export function buildMessage(): MessageBuilder {
  return new MessageBuilder();
}
