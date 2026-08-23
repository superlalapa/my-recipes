/**
 * Renders the PWA / home-screen icons so `assets/icon.svg` stays the single
 * source of the design. Full-bleed squares with the artwork inside the
 * maskable safe zone, so Android and iOS can apply their own mask.
 *
 * No dependencies: pixels are rasterised here and deflated with node:zlib.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const TERRACOTTA = [0xa8, 0x46, 0x2a];
const CREAM = [0xfa, 0xf6, 0xef];
const SAMPLES = 3; // supersampling per axis, for smooth circle edges

const SIZES = [
  ["assets/icon-180.png", 180],
  ["assets/icon-192.png", 192],
  ["assets/icon-512.png", 512],
];

/** Colour of one sub-sample, in the unit square (0..1). */
function shade(u, v) {
  const dx = u - 0.5;
  const dy = v - 0.5;
  const d = Math.hypot(dx, dy);

  const plate = 0.28; // plate radius
  const ringOuter = 0.1895;
  const ringInner = 0.1545;

  if (d <= plate) {
    // The inner ring is drawn back in terracotta over the cream plate.
    return d >= ringInner && d <= ringOuter ? TERRACOTTA : CREAM;
  }
  return TERRACOTTA;
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const step = 1 / (size * SAMPLES);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const u = (x * SAMPLES + sx + 0.5) * step;
          const v = (y * SAMPLES + sy + 0.5) * step;
          const c = shade(u, v);
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const n = SAMPLES * SAMPLES;
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(g / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

/* ------------------------------------------------------------ PNG writer */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const [relPath, size] of SIZES) {
  const out = resolve(ROOT, relPath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, encodePng(size, render(size)));
  console.log(`icon  ${relPath}  ${size}×${size}`);
}
