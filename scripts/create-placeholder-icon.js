// Simple script to create a placeholder icon
// Note: This creates a minimal valid PNG file
// For production, replace with actual 1024x1024 icon

const fs = require('fs');
const path = require('path');

// Minimal 1x1 transparent PNG (valid PNG format)
// This is a base64 encoded 1x1 transparent PNG
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
const dir = path.dirname(iconPath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(iconPath, minimalPNG);
console.log('Placeholder icon created at:', iconPath);
console.log('⚠️  WARNING: This is a 1x1 placeholder. Replace with a 1024x1024 PNG for production.');

