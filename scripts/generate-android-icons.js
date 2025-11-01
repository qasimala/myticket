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

async function generateIcons() {
  try {
    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error(`❌ Logo not found at: ${logoPath}`);
      process.exit(1);
    }

    console.log('📱 Generating Android app icons...');
    console.log(`   Source: ${logoPath}`);

    // Generate standard icons for each density
    for (const [folder, size] of Object.entries(iconSizes)) {
      const folderPath = path.join(androidResPath, folder);
      
      // Ensure directory exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Generate square icon
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(path.join(folderPath, 'ic_launcher.png'));

      // Generate round icon (same as square for now)
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(path.join(folderPath, 'ic_launcher_round.png'));

      // Generate foreground for adaptive icon
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(path.join(folderPath, 'ic_launcher_foreground.png'));

      console.log(`   ✓ Generated ${size}x${size} icons for ${folder}`);
    }

    // Generate high-res foreground for adaptive icon (1024x1024)
    const foregroundPath = path.join(androidResPath, 'mipmap-xxxhdpi', 'ic_launcher_foreground.png');
    await sharp(logoPath)
      .resize(adaptiveForegroundSize, adaptiveForegroundSize, {
        fit: 'contain',
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

