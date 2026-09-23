/**
 * WhatsApp `ProtocolMessage` — a meta-message representing an action on another
 * message: revoke (delete for everyone), edit, ephemeral-timer changes, and
 * various sync notifications. Field numbers and enum values verified against the
 * official WhatsApp `.proto`.
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';
import { Message } from './message';
import { MessageKey } from './message-key';

/** Field numbers within ProtocolMessage (WhatsApp schema). */
enum Field {
  Key = 1,
  Type = 2,
  EphemeralExpiration = 4,
  EphemeralSettingTimestamp = 5,
  EditedMessage = 14,
  TimestampMs = 15,
}

/**
 * The kind of protocol action (mirrors WhatsApp's `ProtocolMessage.Type`).
 * Only the commonly-handled values are named; others come through as their raw
 * number via {@link ProtocolMessage.type}.
 */
export enum ProtocolMessageType {
  Revoke = 0,
  EphemeralSetting = 3,
  EphemeralSyncResponse = 4,
  HistorySyncNotification = 5,
  AppStateSyncKeyShare = 6,
  AppStateSyncKeyRequest = 7,
  MessageEdit = 14,
}

/** Lazy view over a ProtocolMessage. */
export class ProtocolMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): ProtocolMessage {
    return new ProtocolMessage(raw);
  }

  /** The key of the message this action targets. Lazily indexed submessage. */
  get key(): MessageKey | null {
    const sub = this.raw.getMessage(Field.Key);
    return sub === null ? null : MessageKey.from(sub);
  }

  /** The action type as a raw enum value (see {@link ProtocolMessageType}). */
  get type(): number | null {
    return this.raw.getUint32(Field.Type);
  }

  /** For ephemeral-setting changes: the new expiration in seconds. */
  get ephemeralExpiration(): number | null {
    return this.raw.getUint32(Field.EphemeralExpiration);
  }

  /** For a message edit: the new message content. Lazily indexed submessage. */
  get editedMessage(): Message | null {
    const sub = this.raw.getMessage(Field.EditedMessage);
    return sub === null ? null : Message.from(sub);
  }

  /** Action timestamp in milliseconds (int64 → bigint). */
  get timestampMs(): bigint | null {
    return this.raw.getVarint(Field.TimestampMs);
  }

  /** Whether this is a "delete for everyone" (revoke). */
  get isRevoke(): boolean {
    return this.type === ProtocolMessageType.Revoke;
  }

  /** Whether this is a message edit. */
  get isEdit(): boolean {
    return this.type === ProtocolMessageType.MessageEdit;
  }

  /** Whether this changes the disappearing-message timer. */
  get isEphemeralSetting(): boolean {
    return this.type === ProtocolMessageType.EphemeralSetting;
  }
}
