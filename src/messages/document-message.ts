/**
 * WhatsApp `DocumentMessage`. Field numbers verified against the official
 * WhatsApp protobuf schema (WAProto/index.proto).
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within DocumentMessage (WhatsApp schema). */
enum Field {
  Url = 1,
  Mimetype = 2,
  Title = 3,
  FileSha256 = 4,
  FileLength = 5,
  PageCount = 6,
  MediaKey = 7,
  FileName = 8,
  FileEncSha256 = 9,
  DirectPath = 10,
  Caption = 20,
}

/** Lazy view over a DocumentMessage. */
export class DocumentMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): DocumentMessage {
    return new DocumentMessage(raw);
  }

  /** CDN URL of the encrypted document. */
  get url(): string | null {
    return this.raw.getString(Field.Url);
  }

  /** MIME type (e.g. "application/pdf"). */
  get mimetype(): string | null {
    return this.raw.getString(Field.Mimetype);
  }

  /** Document title. */
  get title(): string | null {
    return this.raw.getString(Field.Title);
  }

  /** SHA-256 of the plaintext file. */
  get fileSha256(): Buffer | null {
    return this.raw.getBytes(Field.FileSha256);
  }

  /** File length in bytes (uint64 → bigint). */
  get fileLength(): bigint | null {
    return this.raw.getVarint(Field.FileLength);
  }

  /** Number of pages (for paginated documents). */
  get pageCount(): number | null {
    return this.raw.getUint32(Field.PageCount);
  }

  /** Media decryption key. */
  get mediaKey(): Buffer | null {
    return this.raw.getBytes(Field.MediaKey);
  }

  /** Original file name (e.g. "invoice.pdf"). */
  get fileName(): string | null {
    return this.raw.getString(Field.FileName);
  }

  /** SHA-256 of the encrypted file. */
  get fileEncSha256(): Buffer | null {
    return this.raw.getBytes(Field.FileEncSha256);
  }

  /** CDN direct path. */
  get directPath(): string | null {
    return this.raw.getString(Field.DirectPath);
  }

  /** Optional caption. */
  get caption(): string | null {
    return this.raw.getString(Field.Caption);
  }
}
