/**
 * WhatsApp `WebMessageInfo` — the message envelope. Wraps the content `Message`
 * with routing/metadata: key, timestamp, status, pushName. This is the
 * top-level object a client receives per message; the lazy design lets a bot
 * read just `info.key.remoteJid` to route, without decoding the content.
 *
 * Field numbers verified against the official WhatsApp `.proto`.
 */

import { LazyModel, indexBuffer } from '../field-reader';
import { Message } from './message';
import { MessageKey } from './message-key';

/** Field numbers within WebMessageInfo (WhatsApp schema). */
enum Field {
  Key = 1,
  Message = 2,
  MessageTimestamp = 3,
  Status = 4,
  Participant = 5,
  Starred = 17,
  Broadcast = 18,
  PushName = 19,
}

/** Delivery status of a message (mirrors WhatsApp's `WebMessageInfo.Status`). */
export enum MessageStatus {
  Error = 0,
  Pending = 1,
  ServerAck = 2,
  DeliveryAck = 3,
  Read = 4,
  Played = 5,
}

/** Lazy view over a WebMessageInfo (the message envelope). */
export class WebMessageInfo extends LazyModel {
  /** Wrap a raw WebMessageInfo protobuf buffer for lazy reading. */
  static decode(buf: Buffer): WebMessageInfo {
    return new WebMessageInfo(indexBuffer(buf));
  }

  /** The message key (remoteJid, fromMe, id). Lazily indexed submessage. */
  get key(): MessageKey | null {
    const sub = this.raw.getMessage(Field.Key);
    return sub === null ? null : MessageKey.from(sub);
  }

  /** The message content. Lazily indexed submessage. */
  get message(): Message | null {
    const sub = this.raw.getMessage(Field.Message);
    return sub === null ? null : Message.from(sub);
  }

  /** Unix timestamp (seconds) when the message was sent (uint64 → bigint). */
  get messageTimestamp(): bigint | null {
    return this.raw.getVarint(Field.MessageTimestamp);
  }

  /** Delivery status as the raw enum value (see {@link MessageStatus}). */
  get status(): number | null {
    return this.raw.getUint32(Field.Status);
  }

  /** Sender's display name. */
  get pushName(): string | null {
    return this.raw.getString(Field.PushName);
  }

  /** In group chats, the participant JID who sent the message. */
  get participant(): string | null {
    return this.raw.getString(Field.Participant);
  }

  /** Whether the message is starred. */
  get starred(): boolean | null {
    return this.raw.getBool(Field.Starred);
  }

  /** Whether the message is a broadcast. */
  get broadcast(): boolean | null {
    return this.raw.getBool(Field.Broadcast);
  }
}
