# PowerShell Script to Add Card Back Image
# Run this after saving your blue icon image

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║   🎴 CARD BACK IMAGE SETUP                                   ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$publicFolder = "C:\Users\dj_ba\Desktop\Poker\web\public"
$targetPath = Join-Path $publicFolder "card-back-icon.png"

# Check if public folder exists
if (Test-Path $publicFolder) {
    Write-Host "✓ Public folder found" -ForegroundColor Green
} else {
    Write-Host "✗ Public folder not found. Creating..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $publicFolder -Force | Out-Null
    Write-Host "✓ Public folder created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Looking for card back image..." -ForegroundColor Yellow
Write-Host ""

# Check if image already exists
if (Test-Path $targetPath) {
    Write-Host "✓ Card back image found!" -ForegroundColor Green
    $fileInfo = Get-Item $targetPath
    Write-Host "  Location: $targetPath" -ForegroundColor Gray
    Write-Host "  Size: $($fileInfo.Length) bytes" -ForegroundColor Gray
    Write-Host "  Modified: $($fileInfo.LastWriteTime)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✓ Ready to go! Start the dev server:" -ForegroundColor Green
    Write-Host "  cd web" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "⚠ Card back image not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PLEASE ADD YOUR IMAGE:" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "1. Save your blue icon as: card-back-icon.png" -ForegroundColor White
    Write-Host "2. Place it in: $publicFolder" -ForegroundColor Cyan
    Write-Host "3. Run this script again to verify" -ForegroundColor White
    Write-Host ""
    Write-Host "OR copy/paste an existing image:" -ForegroundColor DarkGray
    Write-Host ""
    
    # Ask if they want to browse for the image
    $browse = Read-Host "Would you like to browse for your image now? (y/n)"
    
    if ($browse -eq 'y' -or $browse -eq 'Y') {
        Add-Type -AssemblyName System.Windows.Forms
        $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
        $openFileDialog.Filter = "PNG Images (*.png)|*.png|All Files (*.*)|*.*"
        $openFileDialog.Title = "Select Your Card Back Icon Image"
        
        if ($openFileDialog.ShowDialog() -eq 'OK') {
            $sourcePath = $openFileDialog.FileName
            Write-Host ""
            Write-Host "Copying image..." -ForegroundColor Yellow
            Copy-Item -Path $sourcePath -Destination $targetPath -Force
            Write-Host "✓ Image copied successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "✓ Ready to go! Start the dev server:" -ForegroundColor Green
            Write-Host "  cd web" -ForegroundColor Cyan
            Write-Host "  npm run dev" -ForegroundColor Cyan
        } else {
            Write-Host ""
            Write-Host "Cancelled. Run this script again when you're ready!" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "No problem! Add the image manually and run this script again." -ForegroundColor White
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Keep window open
Read-Host "Press Enter to close"
