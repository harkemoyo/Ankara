const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const files = ['DSC01401.jpg', 'DSC02616.jpg', 'DSC01485.jpg'];
const targetDir = path.join(__dirname, '..', 'assets');

const MAX_WIDTH = 1200;
const TARGET_KB = 200;

async function compressHero(filename) {
  const input = path.join(targetDir, filename);
  const base = filename.replace(/\.[^/.]+$/, '');
  const output = path.join(targetDir, `${base}-hero.webp`);

  if (!fs.existsSync(input)) {
    console.error('Input not found:', input);
    return;
  }

  let buffer = await sharp(input)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  let quality = 85;
  while (buffer.length > TARGET_KB * 1024 && quality > 40) {
    quality -= 5;
    buffer = await sharp(input)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();
  }

  fs.writeFileSync(output, buffer);
  console.log(`${filename} → ${path.basename(output)}: ${(buffer.length / 1024).toFixed(1)} KB (quality ${quality})`);
}

(async () => {
  for (const f of files) await compressHero(f);
})();
