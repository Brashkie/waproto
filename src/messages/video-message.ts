/**
 * WhatsApp `VideoMessage`. Field numbers verified against the official WhatsApp
 * protobuf schema (WAProto/index.proto).
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within VideoMessage (WhatsApp schema). */
enum Field {
  Url = 1,
  Mimetype = 2,
  FileSha256 = 3,
  FileLength = 4,
  Seconds = 5,
  MediaKey = 6,
  Caption = 7,
  GifPlayback = 8,
  Height = 9,
  Width = 10,
  FileEncSha256 = 11,
  DirectPath = 13,
  StreamingSidecar = 18,
  ViewOnce = 20,
}

/** Lazy view over a VideoMessage. */
export class VideoMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): VideoMessage {
    return new VideoMessage(raw);
  }

  /** CDN URL of the encrypted video. */
  get url(): string | null {
    return this.raw.getString(Field.Url);
  }

  /** MIME type (e.g. "video/mp4"). */
  get mimetype(): string | null {
    return this.raw.getString(Field.Mimetype);
  }

  /** SHA-256 of the plaintext file. */
  get fileSha256(): Buffer | null {
    return this.raw.getBytes(Field.FileSha256);
  }

  /** File length in bytes (uint64 → bigint). */
  get fileLength(): bigint | null {
    return this.raw.getVarint(Field.FileLength);
  }

  /** Duration in seconds. */
  get seconds(): number | null {
    return this.raw.getUint32(Field.Seconds);
  }

  /** Media decryption key. */
  get mediaKey(): Buffer | null {
    return this.raw.getBytes(Field.MediaKey);
  }

  /** Optional caption. */
  get caption(): string | null {
    return this.raw.getString(Field.Caption);
  }

  /** Whether this video should loop as a GIF. */
  get gifPlayback(): boolean | null {
    return this.raw.getBool(Field.GifPlayback);
  }

  /** Video height in pixels. */
  get height(): number | null {
    return this.raw.getUint32(Field.Height);
  }

  /** Video width in pixels. */
  get width(): number | null {
    return this.raw.getUint32(Field.Width);
  }

  /** SHA-256 of the encrypted file. */
  get fileEncSha256(): Buffer | null {
    return this.raw.getBytes(Field.FileEncSha256);
  }

  /** CDN direct path. */
  get directPath(): string | null {
    return this.raw.getString(Field.DirectPath);
  }

  /** Whether this is a view-once video. */
  get viewOnce(): boolean | null {
    return this.raw.getBool(Field.ViewOnce);
  }

  /** Whether this video plays as a GIF. */
  get isGif(): boolean {
    return this.gifPlayback === true;
  }
}
