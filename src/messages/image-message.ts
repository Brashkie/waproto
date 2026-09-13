/**
 * WhatsApp `ImageMessage`. Field numbers from the WhatsApp protobuf schema
 * (verified against whatsmeow / go-whatsapp definitions).
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within ImageMessage (WhatsApp schema). */
enum Field {
  Url = 1,
  Mimetype = 2,
  Caption = 3,
  FileSha256 = 4,
  FileLength = 5,
  Height = 6,
  Width = 7,
  MediaKey = 8,
  FileEncSha256 = 9,
  DirectPath = 11,
}

/** Lazy view over an ImageMessage. */
export class ImageMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): ImageMessage {
    return new ImageMessage(raw);
  }

  /** CDN URL of the encrypted image. */
  get url(): string | null {
    return this.raw.getString(Field.Url);
  }

  /** MIME type (e.g. "image/jpeg"). */
  get mimetype(): string | null {
    return this.raw.getString(Field.Mimetype);
  }

  /** Optional caption shown with the image. */
  get caption(): string | null {
    return this.raw.getString(Field.Caption);
  }

  /** SHA-256 of the plaintext file. */
  get fileSha256(): Buffer | null {
    return this.raw.getBytes(Field.FileSha256);
  }

  /** File length in bytes (uint64 → bigint). */
  get fileLength(): bigint | null {
    return this.raw.getVarint(Field.FileLength);
  }

  /** Image height in pixels. */
  get height(): number | null {
    return this.raw.getUint32(Field.Height);
  }

  /** Image width in pixels. */
  get width(): number | null {
    return this.raw.getUint32(Field.Width);
  }

  /** Media decryption key. */
  get mediaKey(): Buffer | null {
    return this.raw.getBytes(Field.MediaKey);
  }

  /** SHA-256 of the encrypted file. */
  get fileEncSha256(): Buffer | null {
    return this.raw.getBytes(Field.FileEncSha256);
  }

  /** CDN direct path (used to build the download URL). */
  get directPath(): string | null {
    return this.raw.getString(Field.DirectPath);
  }
}
