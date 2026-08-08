// Icon generator — no image library available in this environment, so this is a
// minimal from-scratch PNG encoder (raw RGBA scanlines + zlib deflate + manual CRC32).
// Draws the same ring+tick glyph established for the Android app icon (PLAN.md /
// DESIGN_PROMPT.md's app-icon brief): solid deep-indigo background, white countdown-ring
// + clock-tick mark, no gradient/mascot. Re-run with `node scripts/gen-icons.mjs`
// (from web/) any time the brand colour or sizes need to change.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const BG = [0x3d, 0x49, 0xc9]; // #3D49C9
const FG = [0xff, 0xff, 0xff]; // white glyph

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const abLen2 = abx * abx + aby * aby;
  let t = abLen2 === 0 ? 0 : (apx * abx + apy * aby) / abLen2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx, cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  const cx = size / 2;
  const cy = size / 2 + size * 0.04; // nudge down slightly, matching the Android glyph's asymmetry
  const ringR = size * 0.2;
  const ringStroke = size * 0.062;
  // Tick: vertical line from ring center up to ring edge (clock hand), plus a short
  // horizontal cap above the ring (the "button" mark) — same two extra strokes as the
  // Android vector glyph.
  const tickTopY = cy - ringR - size * 0.1;
  const tickAx = cx, tickAy = cy, tickBx = cx, tickBy = cy - ringR * 0.55;
  const capY = tickTopY;
  const capAx = cx - size * 0.065, capBx = cx + size * 0.065;
  const lineHalf = ringStroke * 0.42;

  for (let y = 0; y < size; y++) {
    let rowOffset = y * (1 + size * 4);
    raw[rowOffset] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const distFromCenter = Math.hypot(dx, dy);
      const onRing = Math.abs(distFromCenter - ringR) < ringStroke / 2;
      const onTick = distToSegment(x, y, tickAx, tickAy, tickBx, tickBy) < lineHalf;
      const onCap = distToSegment(x, y, capAx, capY, capBx, capY) < lineHalf;
      const isGlyph = onRing || onTick || onCap;
      const color = isGlyph ? FG : BG;
      const pixelOffset = rowOffset + 1 + x * 4;
      raw[pixelOffset] = color[0];
      raw[pixelOffset + 1] = color[1];
      raw[pixelOffset + 2] = color[2];
      raw[pixelOffset + 3] = 0xff;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync("public/icons", { recursive: true });
for (const size of [16, 32, 180, 192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, drawIcon(size));
  console.log(`wrote public/icons/icon-${size}.png`);
}
