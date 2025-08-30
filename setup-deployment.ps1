# 🚀 Swiss Vignette Automation - Deployment Setup Script
# This script helps you set up GitHub and Vercel deployment

Write-Host "🚀 Swiss Vignette Automation - Deployment Setup" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if Git is installed
try {
    git --version | Out-Null
    Write-Host "✅ Git is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
try {
    node --version | Out-Null
    Write-Host "✅ Node.js is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan

Write-Host ""
Write-Host "1️⃣ Create GitHub Repository:" -ForegroundColor Yellow
Write-Host "   - Go to https://github.com" -ForegroundColor White
Write-Host "   - Click 'New repository'" -ForegroundColor White
Write-Host "   - Name: swiss-vignette-automation" -ForegroundColor White
Write-Host "   - Make it PUBLIC" -ForegroundColor White
Write-Host "   - Don't initialize with README" -ForegroundColor White
Write-Host "   - Click 'Create repository'" -ForegroundColor White

Write-Host ""
Write-Host "2️⃣ Add GitHub Remote:" -ForegroundColor Yellow
Write-Host "   Replace YOUR_USERNAME with your GitHub username:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/swiss-vignette-automation.git" -ForegroundColor Gray

Write-Host ""
Write-Host "3️⃣ Push to GitHub:" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Gray

Write-Host ""
Write-Host "4️⃣ Deploy to Vercel:" -ForegroundColor Yellow
Write-Host "   - Go to https://vercel.com" -ForegroundColor White
Write-Host "   - Sign up/Login with GitHub" -ForegroundColor White
Write-Host "   - Click 'New Project'" -ForegroundColor White
Write-Host "   - Import your GitHub repository" -ForegroundColor White
Write-Host "   - Configure environment variables:" -ForegroundColor White
Write-Host "     * EMAIL_USER=your-email@gmail.com" -ForegroundColor Gray
Write-Host "     * EMAIL_PASS=your-app-password" -ForegroundColor Gray
Write-Host "     * SWISS_VIGNETTE_URL=https://vignetteswitzerland.com" -ForegroundColor Gray
Write-Host "     * PUPPETEER_HEADLESS=true" -ForegroundColor Gray
Write-Host "     * NODE_ENV=production" -ForegroundColor Gray

Write-Host ""
Write-Host "5️⃣ Test Your Deployment:" -ForegroundColor Yellow
Write-Host "   - Visit your Vercel URL" -ForegroundColor White
Write-Host "   - Fill out the form and test the automation" -ForegroundColor White

Write-Host ""
Write-Host "📚 For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host "🔧 For troubleshooting, check the README.md" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 Happy Deploying!" -ForegroundColor Green
