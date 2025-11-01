# Android App Icon Setup Guide

This guide will help you replace the Android app icon with your MyTicket logo (`public/myticket_logo.png`).

## Quick Method (Recommended): Use Online Tool

1. **Go to [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html)** or **[App Icon Generator](https://www.appicon.co/)**

2. **Upload your logo**: Use `public/myticket_logo.png`

3. **Download the generated icons** - The tool will create all required sizes

4. **Replace the icons** in these folders:
   - `android/app/src/main/res/mipmap-mdpi/`
   - `android/app/src/main/res/mipmap-hdpi/`
   - `android/app/src/main/res/mipmap-xhdpi/`
   - `android/app/src/main/res/mipmap-xxhdpi/`
   - `android/app/src/main/res/mipmap-xxxhdpi/`

## Manual Method: Using ImageMagick (if installed)

If you have ImageMagick installed, you can use this script:

```bash
# Navigate to your project root
cd /path/to/myticket-main

# Create a temporary directory
mkdir -p temp_icons

# Generate all required sizes
convert public/myticket_logo.png -resize 48x48 temp_icons/ic_launcher.png
convert public/myticket_logo.png -resize 72x72 temp_icons/ic_launcher_hdpi.png
convert public/myticket_logo.png -resize 96x96 temp_icons/ic_launcher_xhdpi.png
convert public/myticket_logo.png -resize 144x144 temp_icons/ic_launcher_xxhdpi.png
convert public/myticket_logo.png -resize 192x192 temp_icons/ic_launcher_xxxhdpi.png

# Copy to Android directories
cp temp_icons/ic_launcher.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp temp_icons/ic_launcher.png android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
cp temp_icons/ic_launcher_hdpi.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp temp_icons/ic_launcher_hdpi.png android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
cp temp_icons/ic_launcher_xhdpi.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp temp_icons/ic_launcher_xhdpi.png android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
cp temp_icons/ic_launcher_xxhdpi.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp temp_icons/ic_launcher_xxhdpi.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
cp temp_icons/ic_launcher_xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
cp temp_icons/ic_launcher_xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# For adaptive icons, generate foreground (1024x1024 recommended)
convert public/myticket_logo.png -resize 1024x1024 -background transparent -gravity center -extent 1024x1024 temp_icons/ic_launcher_foreground.png

# Clean up
rm -rf temp_icons
```

## Required File Sizes

### Standard Icons (Legacy)
- **mdpi**: 48x48px
- **hdpi**: 72x72px  
- **xhdpi**: 96x96px
- **xxhdpi**: 144x144px
- **xxxhdpi**: 192x192px

### Adaptive Icons (Android 8.0+)
- **Foreground**: 1024x1024px (centered logo with transparent background)
- **Background**: 1024x1024px (solid color or transparent)

## Important Notes

1. **Icon Format**: Use PNG format with transparency
2. **Safe Zone**: For adaptive icons, keep important content within the center 66% (icon will be masked)
3. **Background**: You may want a solid color background for better visibility
4. **Round Icons**: Generate the same sizes for `ic_launcher_round.png` files

## After Replacing Icons

1. **Sync Capacitor**:
   ```bash
   npm run mobile:sync
   ```

2. **Clean and rebuild**:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

3. **Uninstall old app** from your device (important!) and reinstall to see the new icon

## Troubleshooting

- If the icon doesn't update, uninstall the app completely and reinstall
- Make sure all icon files are named correctly (`ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`)
- Check that file sizes match the required dimensions
- For adaptive icons, ensure the foreground XML references the correct mipmap resource

