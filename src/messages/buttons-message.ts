/**
 * WhatsApp `ButtonsMessage` — a message with quick-reply buttons.
 * Field numbers verified against the official WhatsApp `.proto`.
 *
 * Buttons are a `repeated` field, read via the codec's `getAllMessages`
 * (requires `@brashkie/signalis-codec` >= 0.5.0).
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within ButtonsMessage (WhatsApp schema). */
enum Field {
  ContentText = 6,
  FooterText = 7,
  Buttons = 9,
}

/** Field numbers within ButtonsMessage.Button. */
enum ButtonField {
  ButtonId = 1,
  ButtonText = 2,
}

/** Field numbers within ButtonsMessage.Button.ButtonText. */
enum ButtonTextField {
  DisplayText = 1,
}

/** A single quick-reply button. */
export class Button extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): Button {
    return new Button(raw);
  }

  /** The button's id (returned when the user taps it). */
  get buttonId(): string | null {
    return this.raw.getString(ButtonField.ButtonId);
  }

  /** The button's visible label. */
  get displayText(): string | null {
    const txt = this.raw.getMessage(ButtonField.ButtonText);
    return txt === null ? null : txt.getString(ButtonTextField.DisplayText);
  }
}

/** Lazy view over a ButtonsMessage. */
export class ButtonsMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): ButtonsMessage {
    return new ButtonsMessage(raw);
  }

  /** The main body text. */
  get contentText(): string | null {
    return this.raw.getString(Field.ContentText);
  }

  /** Footer text shown below the buttons. */
  get footerText(): string | null {
    return this.raw.getString(Field.FooterText);
  }

  /** All buttons (repeated). Empty array if none. */
  get buttons(): Button[] {
    return this.raw.getAllMessages(Field.Buttons).map((m) => Button.from(m));
  }
}
