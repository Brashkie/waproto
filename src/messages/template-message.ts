/**
 * WhatsApp `TemplateMessage` — templated messages with buttons. This models the
 * **hydrated** path (`HydratedFourRowTemplate`), which is what clients receive
 * for display. The legacy non-hydrated `FourRowTemplate` (built on
 * `HighlyStructuredMessage`) is intentionally not modeled — it is rarely seen.
 *
 * Field numbers verified against the official WhatsApp `.proto`.
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel, type MessageObject } from '../field-reader';

/** A hydrated quick-reply button: `{ displayText, id }`. */
export class HydratedQuickReplyButton extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): HydratedQuickReplyButton {
    return new HydratedQuickReplyButton(raw);
  }
  /** Button label. */
  get displayText(): string | null {
    return this.raw.getString(1);
  }
  /** Id returned when tapped. */
  get id(): string | null {
    return this.raw.getString(2);
  }
  toObject(): MessageObject {
    return this.pick({ displayText: this.displayText, id: this.id });
  }
}

/** A hydrated URL button: `{ displayText, url }`. */
export class HydratedURLButton extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): HydratedURLButton {
    return new HydratedURLButton(raw);
  }
  /** Button label. */
  get displayText(): string | null {
    return this.raw.getString(1);
  }
  /** URL opened when tapped. */
  get url(): string | null {
    return this.raw.getString(2);
  }
  toObject(): MessageObject {
    return this.pick({ displayText: this.displayText, url: this.url });
  }
}

/** A hydrated call button: `{ displayText, phoneNumber }`. */
export class HydratedCallButton extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): HydratedCallButton {
    return new HydratedCallButton(raw);
  }
  /** Button label. */
  get displayText(): string | null {
    return this.raw.getString(1);
  }
  /** Phone number dialed when tapped. */
  get phoneNumber(): string | null {
    return this.raw.getString(2);
  }
  toObject(): MessageObject {
    return this.pick({ displayText: this.displayText, phoneNumber: this.phoneNumber });
  }
}

/** Field numbers within HydratedTemplateButton. */
enum ButtonField {
  QuickReplyButton = 1,
  UrlButton = 2,
  CallButton = 3,
  Index = 4,
}

/** A single hydrated template button (one of quick-reply / url / call). */
export class HydratedTemplateButton extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): HydratedTemplateButton {
    return new HydratedTemplateButton(raw);
  }

  /** Position of the button in the template. */
  get index(): number | null {
    return this.raw.getUint32(ButtonField.Index);
  }

  /** The quick-reply variant, if this is one. */
  get quickReplyButton(): HydratedQuickReplyButton | null {
    const sub = this.raw.getMessage(ButtonField.QuickReplyButton);
    return sub === null ? null : HydratedQuickReplyButton.from(sub);
  }

  /** The URL variant, if this is one. */
  get urlButton(): HydratedURLButton | null {
    const sub = this.raw.getMessage(ButtonField.UrlButton);
    return sub === null ? null : HydratedURLButton.from(sub);
  }

  /** The call variant, if this is one. */
  get callButton(): HydratedCallButton | null {
    const sub = this.raw.getMessage(ButtonField.CallButton);
    return sub === null ? null : HydratedCallButton.from(sub);
  }

  /** The button's display text, whichever variant it is. */
  get displayText(): string | null {
    return (
      this.quickReplyButton?.displayText ??
      this.urlButton?.displayText ??
      this.callButton?.displayText ??
      null
    );
  }

  toObject(): MessageObject {
    return this.pick({
      index: this.index,
      quickReplyButton: this.quickReplyButton?.toObject(),
      urlButton: this.urlButton?.toObject(),
      callButton: this.callButton?.toObject(),
    });
  }
}

/** Field numbers within HydratedFourRowTemplate. */
enum HydratedField {
  ContentText = 6,
  FooterText = 7,
  Buttons = 8,
  TemplateId = 9,
}

/** The hydrated (display-ready) template body. */
export class HydratedFourRowTemplate extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): HydratedFourRowTemplate {
    return new HydratedFourRowTemplate(raw);
  }

  /** The template body text. */
  get contentText(): string | null {
    return this.raw.getString(HydratedField.ContentText);
  }

  /** The footer text. */
  get footerText(): string | null {
    return this.raw.getString(HydratedField.FooterText);
  }

  /** Template id. */
  get templateId(): string | null {
    return this.raw.getString(HydratedField.TemplateId);
  }

  /** All buttons (repeated). Empty array if none. */
  get buttons(): HydratedTemplateButton[] {
    return this.raw
      .getAllMessages(HydratedField.Buttons)
      .map((m) => HydratedTemplateButton.from(m));
  }

  toObject(): MessageObject {
    return this.pick({
      contentText: this.contentText,
      footerText: this.footerText,
      templateId: this.templateId,
      buttons: this.buttons.map((b) => b.toObject()),
    });
  }
}

/** Field numbers within TemplateMessage. */
enum Field {
  HydratedTemplate = 4,
  TemplateId = 9,
}

/** Lazy view over a TemplateMessage (hydrated path). */
export class TemplateMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): TemplateMessage {
    return new TemplateMessage(raw);
  }

  /** The hydrated, display-ready template. */
  get hydratedTemplate(): HydratedFourRowTemplate | null {
    const sub = this.raw.getMessage(Field.HydratedTemplate);
    return sub === null ? null : HydratedFourRowTemplate.from(sub);
  }

  /** Template id. */
  get templateId(): string | null {
    return this.raw.getString(Field.TemplateId);
  }

  toObject(): MessageObject {
    return this.pick({
      hydratedTemplate: this.hydratedTemplate?.toObject(),
      templateId: this.templateId,
    });
  }
}
