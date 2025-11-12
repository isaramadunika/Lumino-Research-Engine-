#!/bin/bash
# Deploy to Vercel - One-Click Script

echo "🚀 LuMino Research Engine - Vercel Deployment Script"
echo "======================================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: LuMino Research Engine with Glassmorphism UI and Gemini AI Integration"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "📋 Current git status:"
git status --short

echo ""
echo "🔗 Next steps:"
echo ""
echo "1️⃣  Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Name: lumino-research-engine"
echo "   - Click 'Create repository'"
echo ""
echo "2️⃣  Connect your local repo to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/lumino-research-engine.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3️⃣  Deploy to Vercel:"
echo "   - Go to https://vercel.com/new"
echo "   - Click 'Import Git Repository'"
echo "   - Paste your repository URL"
echo "   - Add NEXT_PUBLIC_GEMINI_API_KEY environment variable"
echo "   - Click 'Deploy'"
echo ""
echo "4️⃣  Your app will be live at:"
echo "   https://lumino-research-engine.vercel.app"
echo ""
echo "✨ Need help? Check VERCEL_DEPLOYMENT.md or VERCEL_QUICKSTART.md"
