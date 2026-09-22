/**
 * WhatsApp `ReactionMessage` — an emoji reaction to another message.
 * Field numbers verified against the official WhatsApp `.proto`.
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';
import { MessageKey } from './message-key';

/** Field numbers within ReactionMessage (WhatsApp schema). */
enum Field {
  Key = 1,
  Text = 2,
  GroupingKey = 3,
  SenderTimestampMs = 4,
}

/** Lazy view over a ReactionMessage. */
export class ReactionMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): ReactionMessage {
    return new ReactionMessage(raw);
  }

  /** The key of the message being reacted to. Lazily indexed submessage. */
  get key(): MessageKey | null {
    const sub = this.raw.getMessage(Field.Key);
    return sub === null ? null : MessageKey.from(sub);
  }

  /** The reaction emoji (empty string means the reaction was removed). */
  get text(): string | null {
    return this.raw.getString(Field.Text);
  }

  /** Grouping key used to aggregate reactions. */
  get groupingKey(): string | null {
    return this.raw.getString(Field.GroupingKey);
  }

  /** Sender timestamp in milliseconds (int64 → bigint). */
  get senderTimestampMs(): bigint | null {
    return this.raw.getVarint(Field.SenderTimestampMs);
  }

  /** Whether this reaction removes a previous one (empty text). */
  get isRemoval(): boolean {
    return this.text === '';
  }
}
