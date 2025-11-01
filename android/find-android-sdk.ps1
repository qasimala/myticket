# Script to help find Android SDK location

Write-Host "`n=== Looking for Android SDK ===" -ForegroundColor Cyan

# Check common SDK locations
$sdkLocations = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk"
)

$found = $false
foreach ($location in $sdkLocations) {
    if (Test-Path $location) {
        Write-Host "`n✓ Found Android SDK at: $location" -ForegroundColor Green
        Write-Host "`nAdd this to android/local.properties:" -ForegroundColor Yellow
        $escapedPath = $location -replace '\\', '\\'
        Write-Host "sdk.dir=$escapedPath" -ForegroundColor White
        $found = $true
        break
    }
}

if (-not $found) {
    Write-Host "`n⚠ Android SDK not found in common locations." -ForegroundColor Yellow
    Write-Host "`nTo set up Android SDK:" -ForegroundColor Cyan
    Write-Host "1. Install Android Studio: https://developer.android.com/studio"
    Write-Host "2. Open Android Studio"
    Write-Host '3. Go to: File -> Settings -> Appearance and Behavior -> System Settings -> Android SDK'
    Write-Host "4. Copy the 'Android SDK Location' path"
    Write-Host "5. Add it to android/local.properties as: sdk.dir=your-path"
    Write-Host "`nOr set ANDROID_HOME environment variable:" -ForegroundColor Cyan
    Write-Host '[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourName\AppData\Local\Android\Sdk", "User")'
}

Write-Host "`n"

