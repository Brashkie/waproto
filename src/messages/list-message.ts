/**
 * WhatsApp `ListMessage` — a message with a tappable list of sections and rows.
 * Field numbers verified against the official WhatsApp `.proto`.
 *
 * Sections and rows are `repeated` (rows are repeated *within* each repeated
 * section), read via the codec's `getAllMessages`.
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within ListMessage (WhatsApp schema). */
enum Field {
  Title = 1,
  Description = 2,
  ButtonText = 3,
  Sections = 5,
  FooterText = 7,
}

/** Field numbers within ListMessage.Section. */
enum SectionField {
  Title = 1,
  Rows = 2,
}

/** Field numbers within ListMessage.Row. */
enum RowField {
  Title = 1,
  Description = 2,
  RowId = 3,
}

/** A single row within a list section. */
export class Row extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): Row {
    return new Row(raw);
  }

  /** The row's title. */
  get title(): string | null {
    return this.raw.getString(RowField.Title);
  }

  /** The row's description. */
  get description(): string | null {
    return this.raw.getString(RowField.Description);
  }

  /** The id returned when the user selects this row. */
  get rowId(): string | null {
    return this.raw.getString(RowField.RowId);
  }
}

/** A section grouping several rows. */
export class Section extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): Section {
    return new Section(raw);
  }

  /** The section heading. */
  get title(): string | null {
    return this.raw.getString(SectionField.Title);
  }

  /** All rows in this section (repeated). Empty array if none. */
  get rows(): Row[] {
    return this.raw.getAllMessages(SectionField.Rows).map((m) => Row.from(m));
  }
}

/** Lazy view over a ListMessage. */
export class ListMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): ListMessage {
    return new ListMessage(raw);
  }

  /** The list title. */
  get title(): string | null {
    return this.raw.getString(Field.Title);
  }

  /** The list description / body text. */
  get description(): string | null {
    return this.raw.getString(Field.Description);
  }

  /** The label of the button that opens the list. */
  get buttonText(): string | null {
    return this.raw.getString(Field.ButtonText);
  }

  /** Footer text. */
  get footerText(): string | null {
    return this.raw.getString(Field.FooterText);
  }

  /** All sections (repeated). Empty array if none. */
  get sections(): Section[] {
    return this.raw.getAllMessages(Field.Sections).map((m) => Section.from(m));
  }
}
