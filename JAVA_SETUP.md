# Java Setup for Android Development

## Problem
Gradle requires Java to build Android apps. You need to install Java and set the `JAVA_HOME` environment variable.

## Solution

### Option 1: Install Java JDK (Recommended)

#### Step 1: Download Java JDK
- **For Android development, use Java 11 or Java 17**
- Download from: https://adoptium.net/ (recommended) or https://www.oracle.com/java/technologies/downloads/

**Recommended:** Adoptium Temurin JDK 17 LTS
- Go to: https://adoptium.net/temurin/releases/?version=17
- Download: **Windows x64** installer (.msi)

#### Step 2: Install Java
1. Run the downloaded installer
2. Follow the installation wizard
3. **Important:** Check "Add to PATH" if the option appears
4. Note the installation path (usually `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`)

#### Step 3: Set JAVA_HOME Environment Variable

**Windows PowerShell (Admin):**
```powershell
# Find your Java installation path
# Usually: C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
# Or: C:\Program Files\Java\jdk-17

# Set JAVA_HOME (replace with your actual path)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.12-hotspot', 'Machine')

# Add to PATH
$oldPath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$newPath = "$oldPath;$env:JAVA_HOME\bin"
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')
```

**Windows Command Prompt (Admin):**
```cmd
# Find your Java installation path first
where java

# Set JAVA_HOME (replace with your actual path)
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.12-hotspot" /M

# Add to PATH
setx PATH "%PATH%;%JAVA_HOME%\bin" /M
```

**GUI Method (Easier):**
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Go to **Advanced** tab → **Environment Variables**
3. Under **System variables**, click **New**
4. Variable name: `JAVA_HOME`
5. Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.12-hotspot` (your actual path)
6. Click **OK**
7. Find **Path** in System variables, click **Edit**
8. Click **New**, add: `%JAVA_HOME%\bin`
9. Click **OK** on all dialogs
10. **Restart your terminal/IDE** for changes to take effect

#### Step 4: Verify Installation

Open a **new** terminal/PowerShell window and run:
```bash
java -version
javac -version
echo $env:JAVA_HOME
```

You should see:
```
java version "17.0.x" ...
javac 17.0.x
C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot
```

### Option 2: Use Android Studio's Bundled JDK

If you have Android Studio installed, it comes with its own JDK:

1. Find Android Studio's JDK location:
   - Usually: `C:\Program Files\Android\Android Studio\jbr`
   - Or: `C:\Users\YourName\AppData\Local\Android\Sdk\jbr`

2. Set JAVA_HOME to that path using the GUI method above

### Option 3: Quick Test (Using Android Studio's JDK)

If Android Studio is installed, you can temporarily set JAVA_HOME:

**PowerShell:**
```powershell
# Find Android Studio JDK
$androidStudioJdk = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path $androidStudioJdk) {
    $env:JAVA_HOME = $androidStudioJdk
    $env:PATH = "$androidStudioJdk\bin;$env:PATH"
    java -version
}
```

**Command Prompt:**
```cmd
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%
java -version
```

## After Setting JAVA_HOME

1. **Close and reopen your terminal/IDE** (important!)
2. Navigate to your project:
   ```bash
   cd C:\Users\QASIM\dev\myticket\myticket-main
   ```
3. Try building again:
   ```bash
   npm run mobile:build-apk
   ```

## Troubleshooting

### "JAVA_HOME is still not set"
- Make sure you restarted your terminal/IDE
- Verify with: `echo $env:JAVA_HOME` (PowerShell) or `echo %JAVA_HOME%` (CMD)
- Check that the path exists and contains `bin\java.exe`

### "Wrong Java version"
- Android Gradle Plugin requires Java 11 or 17
- Check version: `java -version`
- Should show: `java version "11.x.x"` or `"17.x.x"`

### "Permission denied"
- Make sure you ran PowerShell/CMD as Administrator
- Or use the GUI method (doesn't require admin)

### Find Java Installation Path

**PowerShell:**
```powershell
# Check common locations
Get-ChildItem "C:\Program Files" -Filter "jdk*" -Directory -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files\Java" -Directory -ErrorAction SilentlyContinue
```

**Command Prompt:**
```cmd
dir "C:\Program Files\jdk*" /AD
dir "C:\Program Files\Eclipse Adoptium" /AD
dir "C:\Program Files\Java" /AD
```

## Recommended Setup

For Android development, I recommend:
- **Java 17 LTS** (Eclipse Adoptium Temurin)
- Set JAVA_HOME permanently (System variable)
- Add `%JAVA_HOME%\bin` to PATH

This will work for all Android/Gradle builds going forward.


