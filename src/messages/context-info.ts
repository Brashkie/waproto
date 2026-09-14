/**
 * WhatsApp `ContextInfo` — reply/quote, forwarding, and related metadata.
 * Field numbers verified against the official WhatsApp `.proto`.
 *
 * Note: repeated fields (e.g. `mentionedJid`) are not exposed yet — the current
 * lazy reader returns only the first occurrence of a field, so exposing them
 * would silently drop values. They will be added once repeated-field reading
 * lands in the underlying codec.
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within ContextInfo (WhatsApp schema). */
enum Field {
  StanzaId = 1,
  Participant = 2,
  QuotedMessage = 3,
  RemoteJid = 4,
  ForwardingScore = 21,
  IsForwarded = 22,
  Expiration = 25,
}

/** Lazy view over a ContextInfo. */
export class ContextInfo extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): ContextInfo {
    return new ContextInfo(raw);
  }

  /** The id of the quoted/replied-to message. */
  get stanzaId(): string | null {
    return this.raw.getString(Field.StanzaId);
  }

  /** The participant who sent the quoted message. */
  get participant(): string | null {
    return this.raw.getString(Field.Participant);
  }

  /** The remote JID of the quoted message's chat. */
  get remoteJid(): string | null {
    return this.raw.getString(Field.RemoteJid);
  }

  /** How many times the message has been forwarded. */
  get forwardingScore(): number | null {
    return this.raw.getUint32(Field.ForwardingScore);
  }

  /** Whether the message was forwarded. */
  get isForwarded(): boolean | null {
    return this.raw.getBool(Field.IsForwarded);
  }

  /** Disappearing-message expiration in seconds. */
  get expiration(): number | null {
    return this.raw.getUint32(Field.Expiration);
  }

  /** Whether this context represents a reply/quote. */
  get isReply(): boolean {
    return this.has(Field.QuotedMessage) || this.has(Field.StanzaId);
  }
}
