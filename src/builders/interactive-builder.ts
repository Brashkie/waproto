/**
 * Interactive submessage builders (buttons / list).
 *
 * These are nested and accumulative, so they use the array-based design: buttons
 * are added one by one, and each list section is added with its rows as an
 * array — no implicit "current section" state to get wrong. Field numbers mirror
 * the readers (verified against the official WhatsApp `.proto`).
 */

import { type FieldInput, WireType, encodeFields, fromString } from '@brashkie/signalis-codec';

function sf(fieldNumber: number, v: string): FieldInput {
  return { fieldNumber, wireType: WireType.Bytes, bytes: fromString(v) };
}
function bf(fieldNumber: number, v: Buffer): FieldInput {
  return { fieldNumber, wireType: WireType.Bytes, bytes: v };
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

/** A quick-reply button to add to a ButtonsMessage. */
export interface ButtonSpec {
  id: string;
  text: string;
}

/** Encode a single Button submessage: buttonId=1, buttonText=2 { displayText=1 }. */
function encodeButton(b: ButtonSpec): Buffer {
  const buttonText = encodeFields([sf(1, b.text)]); // ButtonText { displayText = 1 }
  return encodeFields([sf(1, b.id), bf(2, buttonText)]); // Button { buttonId=1, buttonText=2 }
}

/** Options for a ButtonsMessage (content + footer; buttons added separately). */
export interface ButtonsSpec {
  contentText?: string;
  footerText?: string;
  buttons: ButtonSpec[];
}

/** Encode a ButtonsMessage: contentText=6, footerText=7, buttons=9 (repeated). */
export function encodeButtons(spec: ButtonsSpec): Buffer {
  const f: FieldInput[] = [];
  if (spec.contentText !== undefined) f.push(sf(6, spec.contentText));
  if (spec.footerText !== undefined) f.push(sf(7, spec.footerText));
  for (const b of spec.buttons) f.push(bf(9, encodeButton(b)));
  return encodeFields(f);
}

// ─── List ─────────────────────────────────────────────────────────────────────

/** A row within a list section. */
export interface RowSpec {
  title: string;
  description?: string;
  rowId?: string;
}

/** A section grouping rows. */
export interface SectionSpec {
  title: string;
  rows: RowSpec[];
}

/** Encode a single Row: title=1, description=2, rowId=3. */
function encodeRow(r: RowSpec): Buffer {
  const f: FieldInput[] = [sf(1, r.title)];
  if (r.description !== undefined) f.push(sf(2, r.description));
  if (r.rowId !== undefined) f.push(sf(3, r.rowId));
  return encodeFields(f);
}

/** Encode a single Section: title=1, rows=2 (repeated). */
function encodeSection(s: SectionSpec): Buffer {
  const f: FieldInput[] = [sf(1, s.title)];
  for (const r of s.rows) f.push(bf(2, encodeRow(r)));
  return encodeFields(f);
}

/** Options for a ListMessage. */
export interface ListSpec {
  title?: string;
  description?: string;
  buttonText?: string;
  footerText?: string;
  sections: SectionSpec[];
}

/** Encode a ListMessage: title=1, description=2, buttonText=3, sections=5, footerText=7. */
export function encodeList(spec: ListSpec): Buffer {
  const f: FieldInput[] = [];
  if (spec.title !== undefined) f.push(sf(1, spec.title));
  if (spec.description !== undefined) f.push(sf(2, spec.description));
  if (spec.buttonText !== undefined) f.push(sf(3, spec.buttonText));
  if (spec.footerText !== undefined) f.push(sf(7, spec.footerText));
  for (const s of spec.sections) f.push(bf(5, encodeSection(s)));
  return encodeFields(f);
}
