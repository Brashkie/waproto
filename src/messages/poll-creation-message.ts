/**
 * WhatsApp `PollCreationMessage` — a poll with a question and options.
 * Field numbers verified against the official WhatsApp `.proto`.
 *
 * Options are a `repeated` field, read in full via the codec's `getAllMessages`
 * (requires `@brashkie/signalis-codec` >= 0.5.0).
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within PollCreationMessage (WhatsApp schema). */
enum Field {
  EncKey = 1,
  Name = 2,
  Options = 3,
  SelectableOptionsCount = 4,
}

/** Field numbers within PollCreationMessage.Option. */
enum OptionField {
  OptionName = 1,
}

/** A single poll option. */
export class PollOption extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): PollOption {
    return new PollOption(raw);
  }

  /** The option's display text. */
  get name(): string | null {
    return this.raw.getString(OptionField.OptionName);
  }
}

/** Lazy view over a PollCreationMessage. */
export class PollCreationMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): PollCreationMessage {
    return new PollCreationMessage(raw);
  }

  /** The poll question. */
  get name(): string | null {
    return this.raw.getString(Field.Name);
  }

  /** How many options a voter may select (1 = single choice). */
  get selectableOptionsCount(): number | null {
    return this.raw.getUint32(Field.SelectableOptionsCount);
  }

  /** All poll options (repeated). Empty array if none. */
  get options(): PollOption[] {
    return this.raw.getAllMessages(Field.Options).map((m) => PollOption.from(m));
  }

  /** The option display texts, in order — convenience over {@link options}. */
  get optionNames(): string[] {
    return this.options.map((o) => o.name ?? '');
  }
}
