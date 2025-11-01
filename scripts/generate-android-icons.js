/**
 * Script to generate Android app icons from the MyTicket logo
 * 
 * Requirements:
 * - Install sharp: npm install --save-dev sharp
 * 
 * Usage:
 *   node scripts/generate-android-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp is not installed.');
  console.log('Please install it first: npm install --save-dev sharp');
  process.exit(1);
}

const logoPath = path.join(__dirname, '../public/myticket_logo.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

// Icon sizes for different densities
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Adaptive icon foreground size
const adaptiveForegroundSize = 1024;

// Safe zone for adaptive icons - Android masks the outer edges, so we scale to 66%
const safeZoneScale = 0.66;

async function generateIcons() {
  try {
    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error(`❌ Logo not found at: ${logoPath}`);
      process.exit(1);
    }

    console.log('📱 Generating Android app icons...');
    console.log(`   Source: ${logoPath}`);
    console.log(`   Using safe zone scale: ${(safeZoneScale * 100).toFixed(0)}% to prevent clipping`);

    // Generate standard icons for each density
    for (const [folder, size] of Object.entries(iconSizes)) {
      const folderPath = path.join(androidResPath, folder);
      
      // Ensure directory exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Calculate logo size within safe zone (66% of icon size)
      const logoSize = Math.round(size * safeZoneScale);

      // Generate square icon - scale logo to safe zone and center on transparent background
      await sharp(logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: Math.round((size - logoSize) / 2),
          bottom: Math.round((size - logoSize) / 2),
          left: Math.round((size - logoSize) / 2),
          right: Math.round((size - logoSize) / 2),
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(path.join(folderPath, 'ic_launcher.png'));

      // Generate round icon (same as square for now)
      await sharp(logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: Math.round((size - logoSize) / 2),
          bottom: Math.round((size - logoSize) / 2),
          left: Math.round((size - logoSize) / 2),
          right: Math.round((size - logoSize) / 2),
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(path.join(folderPath, 'ic_launcher_round.png'));

      // Generate foreground for adaptive icon
      await sharp(logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: Math.round((size - logoSize) / 2),
          bottom: Math.round((size - logoSize) / 2),
          left: Math.round((size - logoSize) / 2),
          right: Math.round((size - logoSize) / 2),
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(path.join(folderPath, 'ic_launcher_foreground.png'));

      console.log(`   ✓ Generated ${size}x${size} icons for ${folder} (logo: ${logoSize}x${logoSize})`);
    }

    // Generate high-res foreground for adaptive icon (1024x1024)
    const foregroundLogoSize = Math.round(adaptiveForegroundSize * safeZoneScale);
    const foregroundPath = path.join(androidResPath, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png');
    await sharp(logoPath)
      .resize(foregroundLogoSize, foregroundLogoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: Math.round((adaptiveForegroundSize - foregroundLogoSize) / 2),
        bottom: Math.round((adaptiveForegroundSize - foregroundLogoSize) / 2),
        left: Math.round((adaptiveForegroundSize - foregroundLogoSize) / 2),
        right: Math.round((adaptiveForegroundSize - foregroundLogoSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(foregroundPath);

    console.log(`   ✓ Generated ${adaptiveForegroundSize}x${adaptiveForegroundSize} foreground for adaptive icon`);

    console.log('\n✅ Android icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run mobile:sync');
    console.log('2. Rebuild your Android app');
    console.log('3. Uninstall the old app and reinstall to see the new icon');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();

