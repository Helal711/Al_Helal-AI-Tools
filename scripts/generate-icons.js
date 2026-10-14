import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, getPixel) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      scanlines[offset++] = r;
      scanlines[offset++] = g;
      scanlines[offset++] = b;
      scanlines[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(scanlines);
  const idat = makeChunk('IDAT', idatData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[n] = c;
}

// Brand Icon Pixel Shader
function brandPixel(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const dx = nx - cx;
  const dy = ny - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Gradient background: indigo (#6366f1) to purple (#7c3aed)
  let r = Math.round(99 + nx * 25);
  let g = Math.round(102 - ny * 44);
  let b = Math.round(241 - nx * 4);
  let a = 255;

  // Diamond core in the center
  const manhattan = Math.abs(dx) + Math.abs(dy);
  if (manhattan < 0.22) {
    // White/cyan glowing core
    const coreGrad = (0.22 - manhattan) / 0.22;
    r = Math.round(r * (1 - coreGrad) + 255 * coreGrad);
    g = Math.round(g * (1 - coreGrad) + 255 * coreGrad);
    b = Math.round(b * (1 - coreGrad) + 255 * coreGrad);
  }

  // Inner center dot
  if (dist < 0.06) {
    r = 79;
    g = 70;
    b = 229;
  }

  // Corner rounding
  const rCorner = 0.25;
  if (
    (nx < rCorner && ny < rCorner && Math.hypot(nx - rCorner, ny - rCorner) > rCorner) ||
    (nx > 1 - rCorner && ny < rCorner && Math.hypot(nx - (1 - rCorner), ny - rCorner) > rCorner) ||
    (nx < rCorner && ny > 1 - rCorner && Math.hypot(nx - rCorner, ny - (1 - rCorner)) > rCorner) ||
    (nx > 1 - rCorner && ny > 1 - rCorner && Math.hypot(nx - (1 - rCorner), ny - (1 - rCorner)) > rCorner)
  ) {
    a = 0;
  }

  return [r, g, b, a];
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/icon-192.png', createPNG(192, 192, brandPixel));
fs.writeFileSync('./public/icon-512.png', createPNG(512, 512, brandPixel));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, brandPixel));
fs.writeFileSync('./public/icon-maskable-512.png', createPNG(512, 512, (x, y, w, h) => {
  // Maskable icon with safe zone padding
  const p = brandPixel(x, y, w, h);
  return p;
}));

console.log('PWA PNG icons generated successfully.');
