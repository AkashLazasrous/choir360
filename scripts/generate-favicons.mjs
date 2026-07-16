/**
 * Rasterize public/favicon.svg into standard favicon PNG/ICO assets.
 *
 * Requires one-time local deps (not in package.json):
 *   npm install --no-save sharp to-ico
 *
 * Usage: npm run icons:generate
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const svgPath = path.join(publicDir, 'favicon.svg');

const pngTargets = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

const icoSizes = [16, 32, 48];

async function renderPng(svgBuffer, size) {
  return sharp(svgBuffer, { density: Math.max(300, size * 12) })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function main() {
  const svgBuffer = await readFile(svgPath);

  for (const { name, size } of pngTargets) {
    const buf = await renderPng(svgBuffer, size);
    const out = path.join(publicDir, name);
    await writeFile(out, buf);
    console.log(`wrote ${name} (${size}×${size}, ${buf.length} bytes)`);
  }

  const icoBuffers = await Promise.all(icoSizes.map((size) => renderPng(svgBuffer, size)));
  const ico = await toIco(icoBuffers);
  await writeFile(path.join(publicDir, 'favicon.ico'), ico);
  console.log(`wrote favicon.ico (16/32/48, ${ico.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
