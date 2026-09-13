/**
 * WhatsApp `AudioMessage` (voice notes and audio files). Field numbers from the
 * WhatsApp protobuf schema (verified against whatsmeow / go-whatsapp).
 */

import type { LazyMessage } from '@brashkie/signalis-codec';

import { LazyModel } from '../field-reader';

/** Field numbers within AudioMessage (WhatsApp schema). */
enum Field {
  Url = 1,
  Mimetype = 2,
  FileSha256 = 3,
  FileLength = 4,
  Seconds = 5,
  Ptt = 6,
  MediaKey = 7,
  FileEncSha256 = 8,
  DirectPath = 9,
}

/** Lazy view over an AudioMessage. */
export class AudioMessage extends LazyModel {
  /** @internal */
  static from(raw: LazyMessage): AudioMessage {
    return new AudioMessage(raw);
  }

  /** CDN URL of the encrypted audio. */
  get url(): string | null {
    return this.raw.getString(Field.Url);
  }

  /** MIME type (e.g. "audio/ogg; codecs=opus"). */
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

  /** Push-to-talk: `true` for a voice note, `false`/absent for an audio file. */
  get ptt(): boolean | null {
    return this.raw.getBool(Field.Ptt);
  }

  /** Media decryption key. */
  get mediaKey(): Buffer | null {
    return this.raw.getBytes(Field.MediaKey);
  }

  /** SHA-256 of the encrypted file. */
  get fileEncSha256(): Buffer | null {
    return this.raw.getBytes(Field.FileEncSha256);
  }

  /** CDN direct path. */
  get directPath(): string | null {
    return this.raw.getString(Field.DirectPath);
  }

  /** Whether this audio is a voice note (push-to-talk). */
  get isVoiceNote(): boolean {
    return this.ptt === true;
  }
}
