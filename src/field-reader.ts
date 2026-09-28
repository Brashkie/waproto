/**
 * The lazy field-reading foundation shared by every WhatsApp message model.
 *
 * A model wraps a {@link LazyMessage} from `@brashkie/signalis-codec` and reads
 * fields on demand: nothing is decoded or copied until a getter is called, and
 * length-delimited values (strings, submessages) are read as views over the
 * original buffer (zero-copy) until materialized.
 *
 * This is the core of waproto's advantage over eager decoders — a message with
 * 100+ possible fields, of which 1–3 are present and you read 1, never touches
 * the rest.
 */

import { type LazyMessage, lazyIndex } from '@brashkie/signalis-codec';

/** A message materialized into a plain object (present fields only). */
export type MessageObject = Record<string, unknown>;

/**
 * Base class for lazy WhatsApp message models. Subclasses expose typed getters
 * that map protobuf field numbers (from the WhatsApp schema) to names.
 */
export abstract class LazyModel {
  /** @internal The underlying zero-copy field index. */
  protected readonly raw: LazyMessage;

  protected constructor(raw: LazyMessage) {
    this.raw = raw;
  }

  /** Whether field `n` is present without decoding it. */
  has(fieldNumber: number): boolean {
    return this.raw.has(fieldNumber);
  }

  /** The field numbers present in this message, in order. */
  presentFields(): number[] {
    return this.raw.fieldNumbers();
  }

  /**
   * Materialize this message into a plain object, eagerly. Only present fields
   * are included; submessages are materialized recursively. This is the eager
   * complement to the lazy getters — handy for logging, JSON, or handing the
   * whole message to another system.
   */
  abstract toObject(): MessageObject;

  /**
   * Build an object from `entries`, omitting values that are `null`, `undefined`,
   * or an empty array. Used by subclasses to implement {@link toObject}.
   */
  protected pick(entries: MessageObject): MessageObject {
    const out: MessageObject = {};
    for (const [k, v] of Object.entries(entries)) {
      if (v === null || v === undefined) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      out[k] = v;
    }
    return out;
  }
}

/** Index a raw protobuf buffer for lazy reading (zero-copy). */
export function indexBuffer(buf: Buffer): LazyMessage {
  return lazyIndex(buf);
}
