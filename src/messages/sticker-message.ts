/**
 * WhatsApp `StickerMessage`. Field numbers verified against the official
 * WhatsApp protobuf schema (WAProto/index.proto).
 *
 * Note: StickerMessage uses a DIFFERENT field layout than the other media types
 * (e.g. `fileSha256` is field 2 here, not 4) — verified against the .proto.
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within StickerMessage (WhatsApp schema). */
enum Field {
  Url = 1,
  FileSha256 = 2,
  FileEncSha256 = 3,
  MediaKey = 4,
  Mimetype = 5,
  Height = 6,
  Width = 7,
  DirectPath = 8,
  FileLength = 9,
  IsAnimated = 13,
  IsAvatar = 19,
}

/** Lazy view over a StickerMessage. */
export class StickerMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): StickerMessage {
    return new StickerMessage(raw);
  }

  /** CDN URL of the encrypted sticker. */
  get url(): string | null {
    return this.raw.getString(Field.Url);
  }

  /** SHA-256 of the plaintext file. */
  get fileSha256(): Buffer | null {
    return this.raw.getBytes(Field.FileSha256);
  }

  /** SHA-256 of the encrypted file. */
  get fileEncSha256(): Buffer | null {
    return this.raw.getBytes(Field.FileEncSha256);
  }

  /** Media decryption key. */
  get mediaKey(): Buffer | null {
    return this.raw.getBytes(Field.MediaKey);
  }

  /** MIME type (e.g. "image/webp"). */
  get mimetype(): string | null {
    return this.raw.getString(Field.Mimetype);
  }

  /** Sticker height in pixels. */
  get height(): number | null {
    return this.raw.getUint32(Field.Height);
  }

  /** Sticker width in pixels. */
  get width(): number | null {
    return this.raw.getUint32(Field.Width);
  }

  /** CDN direct path. */
  get directPath(): string | null {
    return this.raw.getString(Field.DirectPath);
  }

  /** File length in bytes (uint64 → bigint). */
  get fileLength(): bigint | null {
    return this.raw.getVarint(Field.FileLength);
  }

  /** Whether this is an animated sticker. */
  get isAnimated(): boolean | null {
    return this.raw.getBool(Field.IsAnimated);
  }

  /** Whether this is an avatar sticker. */
  get isAvatar(): boolean | null {
    return this.raw.getBool(Field.IsAvatar);
  }
}
