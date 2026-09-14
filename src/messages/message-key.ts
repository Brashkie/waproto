/**
 * WhatsApp `MessageKey` — identifies a message: which chat, from whom, and its
 * id. This is what routing/filtering keys on. Field numbers verified against the
 * official WhatsApp `.proto`.
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within MessageKey (WhatsApp schema). */
enum Field {
  RemoteJid = 1,
  FromMe = 2,
  Id = 3,
  Participant = 4,
}

/** Lazy view over a MessageKey. */
export class MessageKey extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): MessageKey {
    return new MessageKey(raw);
  }

  /** The chat JID this message belongs to (e.g. "5493511234567@s.whatsapp.net"). */
  get remoteJid(): string | null {
    return this.raw.getString(Field.RemoteJid);
  }

  /** Whether this message was sent by the current account. */
  get fromMe(): boolean | null {
    return this.raw.getBool(Field.FromMe);
  }

  /** The unique message id. */
  get id(): string | null {
    return this.raw.getString(Field.Id);
  }

  /** In group chats, the participant JID who sent the message. */
  get participant(): string | null {
    return this.raw.getString(Field.Participant);
  }
}
