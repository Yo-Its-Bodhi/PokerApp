# Quick Deploy Script for Poker Game
# Run this from the root directory: .\DEPLOY_NOW.ps1

Write-Host "🎰 Shido Poker - Quick Deploy Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "web\package.json")) {
    Write-Host "❌ Error: Please run this script from the Poker root directory" -ForegroundColor Red
    exit 1
}

# Navigate to web directory
Set-Location web

Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""

Write-Host "🏗️  Step 2: Building production bundle..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Step 3: Choose deployment option:" -ForegroundColor Cyan
Write-Host "1. Deploy to Vercel (Recommended - Free)" -ForegroundColor White
Write-Host "2. Deploy to Netlify (Free)" -ForegroundColor White
Write-Host "3. Just build (manual upload)" -ForegroundColor White
Write-Host "4. Preview locally" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "📤 Deploying to Vercel..." -ForegroundColor Yellow
        
        # Check if Vercel CLI is installed
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        
        if (-not $vercelInstalled) {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host ""
        Write-Host "🔐 You'll need to login to Vercel (if not already)" -ForegroundColor Cyan
        Write-Host ""
        
        vercel --prod
        
        Write-Host ""
        Write-Host "🎉 Deployment complete! Your game is now live!" -ForegroundColor Green
    }
    
    "2" {
        Write-Host "📤 Deploying to Netlify..." -ForegroundColor Yellow
        
        # Check if Netlify CLI is installed
        $netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
        
        if (-not $netlifyInstalled) {
            Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
            npm install -g netlify-cli
        }
        
        Write-Host ""
        Write-Host "🔐 You'll need to login to Netlify (if not already)" -ForegroundColor Cyan
        Write-Host ""
        
        netlify deploy --prod
        
        Write-Host ""
        Write-Host "🎉 Deployment complete! Your game is now live!" -ForegroundColor Green
    }
    
    "3" {
        Write-Host "✅ Build complete! Upload the 'dist' folder to your hosting provider." -ForegroundColor Green
        Write-Host "📁 Build location: $(Get-Location)\dist" -ForegroundColor Cyan
        Start-Process explorer.exe "$(Get-Location)\dist"
    }
    
    "4" {
        Write-Host "🔍 Starting local preview..." -ForegroundColor Yellow
        npm run preview
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ For more deployment options, see DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

# Return to root directory
Set-Location ..
