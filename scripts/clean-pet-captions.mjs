#!/usr/bin/env node
/**
 * Some pet mood images have a caption ("Happy", "Sleepy"...) baked into the bottom.
 * This writes caption-free copies to public/pets/<pet>/clean/<mood>.png by finding
 * the transparent gap between the artwork and the caption band and cropping there.
 * Originals are untouched. Usage: node scripts/clean-pet-captions.mjs [--dry]
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SOURCES = [
  ['bubbo', 'happy', 'public/pets/bubbo/moods/happy.png'],
  ['luna', 'neutral', 'public/pets/luna/moods/neutral.png'],
  ['luna', 'happy', 'public/pets/luna/moods/happy.png'],
  ['luna', 'sad', 'public/pets/luna/moods/sad.png'],
  ['luna', 'sleepy', 'public/pets/luna/moods/sleepy.png'],
];
const dry = process.argv.includes('--dry');

for (const [pet, mood, file] of SOURCES) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rowFill = [];
  for (let y = 0; y < info.height; y++) {
    let count = 0;
    for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 40) count++;
    rowFill.push(count);
  }
  // Walk up from the bottom: skip empty rows, then the caption band, then find the gap.
  let y = info.height - 1;
  while (y > 0 && rowFill[y] === 0) y--;
  const captionBottom = y;
  while (y > 0 && rowFill[y] > 0) y--;
  const captionTop = y + 1;
  let gap = 0;
  while (y > 0 && rowFill[y] === 0) { y--; gap++; }
  const artBottom = y;
  const captionHeight = captionBottom - captionTop;
  const ok = gap >= 2 && captionHeight < info.height * 0.2;
  console.log(`${file}: ${info.width}x${info.height} caption ${captionTop}-${captionBottom} gap ${gap} -> crop at ${artBottom + 2} ${ok ? '' : '(SKIPPED: no clear caption)'}`);
  if (!ok || dry) continue;
  const outDir = path.join('public/pets', pet, 'clean');
  fs.mkdirSync(outDir, { recursive: true });
  await sharp(file)
    .extract({ left: 0, top: 0, width: info.width, height: artBottom + 2 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, `${mood}.png`));
}
