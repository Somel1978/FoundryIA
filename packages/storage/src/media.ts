import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { dataDir } from "@foundry/env";
import { assertSafeId } from "./paths";

export type SniffedMedia = { kind: "image" | "video"; contentType: string };

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

/**
 * Identifies an image/video from its first bytes. The declared filename and
 * MIME type are ignored: only formats browsers render safely are accepted
 * (notably no SVG, which can carry scripts).
 */
export function sniffMedia(bytes: Uint8Array): SniffedMedia | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { kind: "image", contentType: "image/jpeg" };
  if (ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") return { kind: "image", contentType: "image/png" };
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return { kind: "image", contentType: "image/gif" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return { kind: "image", contentType: "image/webp" };
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "avif" || brand === "avis") return { kind: "image", contentType: "image/avif" };
    if (brand === "qt  ") return { kind: "video", contentType: "video/quicktime" };
    return { kind: "video", contentType: "video/mp4" };
  }
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { kind: "video", contentType: "video/webm" };
  }
  if (ascii(bytes, 0, 4) === "OggS") return { kind: "video", contentType: "video/ogg" };
  return null;
}

const mediaRoot = () => path.join(dataDir(), "media");
const mediaPath = (id: string) => path.join(mediaRoot(), assertSafeId(id));

export async function saveMedia(id: string, data: Uint8Array): Promise<void> {
  await mkdir(mediaRoot(), { recursive: true });
  await writeFile(mediaPath(id), data);
}

export async function deleteMedia(id: string): Promise<void> {
  await rm(mediaPath(id), { force: true });
}

export function mediaSize(id: string): number | null {
  const p = mediaPath(id);
  return existsSync(p) ? statSync(p).size : null;
}

/** Streams a media file, optionally a byte range (inclusive), for video seeking. */
export function mediaStream(id: string, range?: { start: number; end: number }): ReadableStream<Uint8Array> {
  return Readable.toWeb(createReadStream(mediaPath(id), range)) as ReadableStream<Uint8Array>;
}
