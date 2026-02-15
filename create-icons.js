// Simple script to create placeholder PNG icons for development
// In production, replace with proper design assets

const fs = require('fs');
const path = require('path');

// Minimal 1x1 PNG in base64 (transparent pixel)
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const sizes = [16, 32, 48, 128, 512];
const assetsDir = path.join(__dirname, 'assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

sizes.forEach(size => {
  const filename = path.join(assetsDir, `icon${size}.png`);
  fs.writeFileSync(filename, minimalPNG);
  console.log(`Created ${filename}`);
});

// Also create the base icon.png which Plasmo expects
const baseIcon = path.join(assetsDir, 'icon.png');
fs.writeFileSync(baseIcon, minimalPNG);
console.log(`Created ${baseIcon}`);

console.log('Placeholder icons created successfully!');
console.log('Note: Replace with proper design assets for production.');
