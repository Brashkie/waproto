/**
 * WhatsApp `ExtendedTextMessage` — a text message with rich context (replies,
 * link previews, mentions). Field numbers from the WhatsApp protobuf schema.
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within ExtendedTextMessage (WhatsApp schema). */
enum Field {
  Text = 1,
  MatchedText = 2,
  CanonicalUrl = 4,
  Description = 5,
  Title = 6,
}

/** Lazy view over an ExtendedTextMessage. */
export class ExtendedTextMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): ExtendedTextMessage {
    return new ExtendedTextMessage(raw);
  }

  /** The message text. */
  get text(): string | null {
    return this.raw.getString(Field.Text);
  }

  /** The URL matched for a link preview, if any. */
  get canonicalUrl(): string | null {
    return this.raw.getString(Field.CanonicalUrl);
  }

  /** Link-preview title. */
  get title(): string | null {
    return this.raw.getString(Field.Title);
  }

  /** Link-preview description. */
  get description(): string | null {
    return this.raw.getString(Field.Description);
  }
}
