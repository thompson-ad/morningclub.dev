/**
 * Intrinsic image dimensions, read from file headers (FR-8).
 *
 * The HTML surface needs real width/height attributes so images don't shift the
 * layout as they load. Astro's image optimizer would give us that, but it also
 * rewrites URLs to hashed `/_astro/` paths — which breaks HTML/`.md` parity
 * (NFR-7), so images stay unoptimized and we probe the bytes ourselves.
 *
 * Header parsing only: we read the first few hundred bytes, never decode. Kept
 * dependency-free on purpose (NFR-3) — this is the entire cost of not adding an
 * image library.
 */
import { openSync, readSync, closeSync, readFileSync } from 'node:fs';

export interface ImageSize {
  width: number;
  height: number;
}

const cache = new Map<string, ImageSize | null>();

export function imageSize(absPath: string): ImageSize | null {
  const cached = cache.get(absPath);
  if (cached !== undefined) return cached;
  const size = probe(absPath);
  cache.set(absPath, size);
  return size;
}

function probe(absPath: string): ImageSize | null {
  if (/\.svg$/i.test(absPath)) return svgSize(readFileSync(absPath, 'utf8'));

  const head = readHead(absPath, 65_536);
  if (!head) return null;

  return (
    pngSize(head) ?? gifSize(head) ?? webpSize(head) ?? isoBmffSize(head) ?? jpegSize(head)
  );
}

function readHead(absPath: string, length: number): Buffer | null {
  let fd: number | undefined;
  try {
    fd = openSync(absPath, 'r');
    const buffer = Buffer.alloc(length);
    const read = readSync(fd, buffer, 0, length, 0);
    return buffer.subarray(0, read);
  } catch {
    return null;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

function pngSize(b: Buffer): ImageSize | null {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  // IHDR is always the first chunk; width/height are its first two fields.
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function gifSize(b: Buffer): ImageSize | null {
  if (b.length < 10 || b.toString('ascii', 0, 3) !== 'GIF') return null;
  return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
}

function webpSize(b: Buffer): ImageSize | null {
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (b.toString('ascii', 8, 12) !== 'WEBP') return null;

  const format = b.toString('ascii', 12, 16);
  if (format === 'VP8 ') {
    // Lossy: 14-byte frame header, dimensions are 14 bits each.
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (format === 'VP8L') {
    // Lossless: 14-bit dimensions packed across 4 bytes after the signature.
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (format === 'VP8X') {
    // Extended: 24-bit canvas dimensions, minus one.
    const w = b[24] | (b[25] << 8) | (b[26] << 16);
    const h = b[27] | (b[28] << 8) | (b[29] << 16);
    return { width: w + 1, height: h + 1 };
  }
  return null;
}

/** AVIF / HEIC: walk ISO base media boxes for `ispe` (image spatial extents). */
function isoBmffSize(b: Buffer): ImageSize | null {
  if (b.length < 12 || b.toString('ascii', 4, 8) !== 'ftyp') return null;

  const marker = Buffer.from('ispe', 'ascii');
  const at = b.indexOf(marker);
  // ispe payload: 4 bytes version/flags, then width and height as uint32.
  if (at === -1 || at + 16 > b.length) return null;
  return { width: b.readUInt32BE(at + 8), height: b.readUInt32BE(at + 12) };
}

function jpegSize(b: Buffer): ImageSize | null {
  if (b.length < 4 || b.readUInt16BE(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) {
      offset += 1; // resync past padding
      continue;
    }
    const marker = b[offset + 1];
    // Standalone markers carry no length.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) return null; // end / scan data

    const length = b.readUInt16BE(offset + 2);
    // SOF0-3, SOF5-7, SOF9-11, SOF13-15 hold the frame dimensions.
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) {
      return { height: b.readUInt16BE(offset + 5), width: b.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function svgSize(source: string): ImageSize | null {
  const tag = source.match(/<svg\b[^>]*>/i)?.[0];
  if (!tag) return null;

  const attr = (name: string) =>
    tag.match(new RegExp(`\\b${name}\\s*=\\s*["']?\\s*([\\d.]+)`, 'i'))?.[1];

  const width = attr('width');
  const height = attr('height');
  if (width && height) return { width: Math.round(+width), height: Math.round(+height) };

  const viewBox = tag.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1];
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: Math.round(parts[2]), height: Math.round(parts[3]) };
    }
  }
  return null;
}
