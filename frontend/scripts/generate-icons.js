// Icon generator for PWA
// Run: node scripts/generate-icons.js
// Prerequisites: npm install sharp

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '..', 'public', 'icons', 'icon.svg');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

async function generate() {
  if (!fs.existsSync(inputSvg)) {
    console.error('icon.svg not found. Create it first.');
    process.exit(1);
  }

  for (const size of sizes) {
    const output = path.join(outputDir, `icon-${size}x${size}.png`);
    try {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(output);
      console.log(`Generated: icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`Failed to generate ${size}x${size}:`, err.message);
    }
  }
  console.log('\nAll icons generated!');
}

generate();
