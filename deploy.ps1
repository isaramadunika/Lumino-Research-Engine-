# Deploy to Vercel - PowerShell Script for Windows
# Run this script to prepare your project for Vercel deployment

Write-Host "🚀 LuMino Research Engine - Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit: LuMino Research Engine with Glassmorphism UI and Gemini AI Integration"
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Current git status:" -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "🔗 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Create a new repository on GitHub:" -ForegroundColor Yellow
Write-Host "   - Go to https://github.com/new" -ForegroundColor White
Write-Host "   - Name: lumino-research-engine" -ForegroundColor White
Write-Host "   - Click 'Create repository'" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Connect your local repo to GitHub:" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/lumino-research-engine.git" -ForegroundColor White
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Deploy to Vercel:" -ForegroundColor Yellow
Write-Host "   - Go to https://vercel.com/new" -ForegroundColor White
Write-Host "   - Click 'Import Git Repository'" -ForegroundColor White
Write-Host "   - Paste your repository URL" -ForegroundColor White
Write-Host "   - Add NEXT_PUBLIC_GEMINI_API_KEY environment variable" -ForegroundColor White
Write-Host "   - Click 'Deploy'" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Your app will be live at:" -ForegroundColor Yellow
Write-Host "   https://lumino-research-engine.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Need help? Check VERCEL_DEPLOYMENT.md or VERCEL_QUICKSTART.md" -ForegroundColor Green
