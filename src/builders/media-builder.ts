/**
 * Media submessage builders (image / video / audio / document).
 *
 * Each takes an options object — media messages have many optional fields — and
 * returns the encoded submessage buffer. Field numbers mirror the readers
 * (one source of truth, verified against the official WhatsApp `.proto`).
 */

import { type FieldInput, WireType, encodeFields, fromString } from '@brashkie/signalis-codec';

function s(fieldNumber: number, v: string | undefined, out: FieldInput[]): void {
  if (v !== undefined) out.push({ fieldNumber, wireType: WireType.Bytes, bytes: fromString(v) });
}
function b(fieldNumber: number, v: Buffer | undefined, out: FieldInput[]): void {
  if (v !== undefined) out.push({ fieldNumber, wireType: WireType.Bytes, bytes: v });
}
function u(fieldNumber: number, v: number | bigint | undefined, out: FieldInput[]): void {
  if (v !== undefined) out.push({ fieldNumber, wireType: WireType.Varint, varint: BigInt(v) });
}
function bool(fieldNumber: number, v: boolean | undefined, out: FieldInput[]): void {
  if (v !== undefined) out.push({ fieldNumber, wireType: WireType.Varint, varint: v ? 1n : 0n });
}

/** Fields common to every media message. */
interface MediaCommon {
  url?: string;
  mimetype?: string;
  mediaKey?: Buffer;
  fileSha256?: Buffer;
  fileEncSha256?: Buffer;
  fileLength?: number | bigint;
  directPath?: string;
}

/** Options for an image message. */
export interface ImageOptions extends MediaCommon {
  caption?: string;
  height?: number;
  width?: number;
}

/** Options for a video message. */
export interface VideoOptions extends MediaCommon {
  caption?: string;
  seconds?: number;
  gifPlayback?: boolean;
  height?: number;
  width?: number;
  viewOnce?: boolean;
}

/** Options for an audio message. */
export interface AudioOptions extends MediaCommon {
  seconds?: number;
  ptt?: boolean;
}

/** Options for a document message. */
export interface DocumentOptions extends MediaCommon {
  title?: string;
  fileName?: string;
  pageCount?: number;
  caption?: string;
}

/** Encode an ImageMessage submessage (field numbers: image layout). */
export function encodeImage(o: ImageOptions): Buffer {
  const f: FieldInput[] = [];
  s(1, o.url, f);
  s(2, o.mimetype, f);
  s(3, o.caption, f);
  b(4, o.fileSha256, f);
  u(5, o.fileLength, f);
  u(6, o.height, f);
  u(7, o.width, f);
  b(8, o.mediaKey, f);
  b(9, o.fileEncSha256, f);
  s(11, o.directPath, f);
  return encodeFields(f);
}

/** Encode a VideoMessage submessage. */
export function encodeVideo(o: VideoOptions): Buffer {
  const f: FieldInput[] = [];
  s(1, o.url, f);
  s(2, o.mimetype, f);
  b(3, o.fileSha256, f);
  u(4, o.fileLength, f);
  u(5, o.seconds, f);
  b(6, o.mediaKey, f);
  s(7, o.caption, f);
  bool(8, o.gifPlayback, f);
  u(9, o.height, f);
  u(10, o.width, f);
  b(11, o.fileEncSha256, f);
  s(13, o.directPath, f);
  bool(20, o.viewOnce, f);
  return encodeFields(f);
}

/** Encode an AudioMessage submessage. */
export function encodeAudio(o: AudioOptions): Buffer {
  const f: FieldInput[] = [];
  s(1, o.url, f);
  s(2, o.mimetype, f);
  b(3, o.fileSha256, f);
  u(4, o.fileLength, f);
  u(5, o.seconds, f);
  bool(6, o.ptt, f);
  b(7, o.mediaKey, f);
  b(8, o.fileEncSha256, f);
  s(9, o.directPath, f);
  return encodeFields(f);
}

/** Encode a DocumentMessage submessage. */
export function encodeDocument(o: DocumentOptions): Buffer {
  const f: FieldInput[] = [];
  s(1, o.url, f);
  s(2, o.mimetype, f);
  s(3, o.title, f);
  b(4, o.fileSha256, f);
  u(5, o.fileLength, f);
  u(6, o.pageCount, f);
  b(7, o.mediaKey, f);
  s(8, o.fileName, f);
  b(9, o.fileEncSha256, f);
  s(10, o.directPath, f);
  s(20, o.caption, f);
  return encodeFields(f);
}
