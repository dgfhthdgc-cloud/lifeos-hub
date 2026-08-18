const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePngBuffer(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Pixel data generation
  const rawRows = [];
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) / 2;
  const safeRadius = isMaskable ? maxR * 0.72 : maxR * 0.88;

  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const offset = 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: Deep midnight slate (#090d16)
      let r = 9;
      let g = 13;
      let b = 22;
      let a = 255;

      // Outer shape: If not maskable, give it a rounded badge shape
      if (!isMaskable) {
        // Rounded corner rect
        const rx = Math.abs(dx);
        const ry = Math.abs(dy);
        const cornerR = width * 0.22;
        const boxW = width * 0.45;
        const boxH = height * 0.45;
        if (rx > boxW && ry > boxH) {
          const cornerDist = Math.hypot(rx - boxW, ry - boxH);
          if (cornerDist > cornerR) {
            a = 0;
          }
        }
      }

      if (a > 0) {
        // Gradient glow in center
        const glowFactor = Math.max(0, 1 - dist / (maxR * 1.1));
        r = Math.min(255, Math.floor(r + 14 * glowFactor));
        g = Math.min(255, Math.floor(g + 45 * glowFactor));
        b = Math.min(255, Math.floor(b + 55 * glowFactor));

        // Outer Hexagonal / Circle Neural Ring
        const ringDist = Math.abs(dist - safeRadius * 0.78);
        if (ringDist < width * 0.02) {
          // Emerald accent ring (#10b981)
          const ringAlpha = Math.max(0, 1 - ringDist / (width * 0.02));
          r = Math.floor(r * (1 - ringAlpha) + 16 * ringAlpha);
          g = Math.floor(g * (1 - ringAlpha) + 185 * ringAlpha);
          b = Math.floor(b * (1 - ringAlpha) + 129 * ringAlpha);
        }

        // Inner Core Glow
        if (dist < safeRadius * 0.55) {
          const coreDist = dist / (safeRadius * 0.55);
          const coreGlow = Math.max(0, 1 - coreDist);
          r = Math.min(255, Math.floor(r + 20 * coreGlow));
          g = Math.min(255, Math.floor(g + 70 * coreGlow));
          b = Math.min(255, Math.floor(b + 90 * coreGlow));
        }

        // Stylized "Ω" (Omega) and "L" Monogram in Center
        // Omega loop formula approximation
        const ndx = dx / (safeRadius * 0.42);
        const ndy = (dy + safeRadius * 0.05) / (safeRadius * 0.42);
        const omegaDist = Math.hypot(ndx, ndy);

        // Omega arc: top circle with opening at bottom and feet
        let isEmblem = false;
        if (omegaDist >= 0.72 && omegaDist <= 1.05 && (ndy < 0.38 || Math.abs(ndx) > 0.45)) {
          isEmblem = true;
        }
        // Omega bottom feet
        if (ndy >= 0.35 && ndy <= 0.65 && Math.abs(ndx) >= 0.45 && Math.abs(ndx) <= 1.15) {
          isEmblem = true;
        }

        if (isEmblem) {
          // Crisp brilliant white/emerald emblem
          r = 255;
          g = 255;
          b = 255;
        }
      }

      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = a;
    }
    rawRows.push(row);
  }

  const allRawData = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(allRawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate 192x192
const png192 = generatePngBuffer(192, 192, false);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);

// Generate 192x192 maskable
const png192m = generatePngBuffer(192, 192, true);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192-maskable.png'), png192m);

// Generate 512x512
const png512 = generatePngBuffer(512, 512, false);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);

// Generate 512x512 maskable
const png512m = generatePngBuffer(512, 512, true);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512-maskable.png'), png512m);

// Generate Apple Touch Icon (180x180)
const appleIcon = generatePngBuffer(180, 180, false);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleIcon);
fs.writeFileSync(path.join(process.cwd(), 'public', 'apple-touch-icon.png'), appleIcon);

// Also generate SVG vector icons
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="50%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#050811"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <!-- Background with smooth rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  
  <!-- Ambient Core Glow -->
  <circle cx="256" cy="256" r="180" fill="#10b981" opacity="0.12" filter="url(#glow)"/>
  
  <!-- Orbital Ring -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="url(#ringGrad)" stroke-width="4" stroke-dasharray="12 6" opacity="0.65"/>
  
  <!-- Outer Hexagonal Frame -->
  <polygon points="256,96 394,176 394,336 256,416 118,336 118,176" fill="none" stroke="url(#ringGrad)" stroke-width="6" opacity="0.85"/>
  
  <!-- Core LIFE OS Omega (Ω) Emblem -->
  <path d="M 180 340 L 215 340 C 215 305 200 270 200 230 C 200 180 225 150 256 150 C 287 150 312 180 312 230 C 312 270 297 305 297 340 L 332 340 C 342 340 348 348 348 358 C 348 368 342 376 332 376 L 278 376 C 268 376 262 368 262 358 L 262 315 C 275 295 282 265 282 230 C 282 195 270 176 256 176 C 242 176 230 195 230 230 C 230 265 237 295 250 315 L 250 358 C 250 368 244 376 234 376 L 180 376 C 170 376 164 368 164 358 C 164 348 170 340 180 340 Z" fill="#ffffff" filter="url(#glow)"/>
  
  <!-- Center Neural Node -->
  <circle cx="256" cy="230" r="16" fill="#10b981" filter="url(#glow)"/>
  <circle cx="256" cy="230" r="8" fill="#ffffff"/>
  
  <!-- Corner Accent Points -->
  <circle cx="256" cy="96" r="6" fill="#10b981"/>
  <circle cx="394" cy="176" r="6" fill="#06b6d4"/>
  <circle cx="394" cy="336" r="6" fill="#6366f1"/>
  <circle cx="256" cy="416" r="6" fill="#10b981"/>
  <circle cx="118" cy="336" r="6" fill="#6366f1"/>
  <circle cx="118" cy="176" r="6" fill="#06b6d4"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), svgContent);
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), png192);

console.log('Successfully generated all PWA icons (PNG 192, 512, maskable, apple-touch, SVG vector).');
