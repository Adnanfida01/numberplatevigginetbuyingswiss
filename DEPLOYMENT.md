# 🚀 Deployment Guide: GitHub + Vercel

This guide will help you deploy your Swiss Vignette Automation project to GitHub and then to Vercel for public access.

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- Git installed on your computer
- Node.js project ready

## 🔄 Step 1: Upload to GitHub

### 1.1 Initialize Git Repository

```bash
# Navigate to your project directory
cd demo-vignette-automation

# Initialize git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Swiss Vignette Automation Demo"

# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### 1.2 Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name it: `swiss-vignette-automation`
4. Make it **Public** (for Vercel deployment)
5. Don't initialize with README (we already have one)
6. Click "Create repository"
7. Copy the repository URL

### 1.3 Push Your Code

```bash
# If you haven't already, add the remote
git remote add origin https://github.com/YOUR_USERNAME/swiss-vignette-automation.git

# Push your code
git push -u origin main
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect Vercel to GitHub

1. Go to [Vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Select the `swiss-vignette-automation` repository

### 2.2 Configure Project Settings

**Project Name:** `swiss-vignette-automation` (or your preferred name)

**Framework Preset:** `Node.js`

**Root Directory:** `./` (leave as default)

**Build Command:** `npm install` (leave as default)

**Output Directory:** `./` (leave as default)

**Install Command:** `npm install` (leave as default)

### 2.3 Set Environment Variables

Click on "Environment Variables" and add:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SWISS_VIGNETTE_URL=https://vignetteswitzerland.com
PUPPETEER_HEADLESS=true
NODE_ENV=production
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail
- Replace `your-app-password` with your Gmail App Password
- Make sure to use Gmail App Password, not your regular password

### 2.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)
3. Your app will be live at: `https://your-app-name.vercel.app`

## 🔧 Step 3: Configure Gmail App Password

### 3.1 Enable 2-Factor Authentication

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click "Security"
3. Enable "2-Step Verification"

### 3.2 Generate App Password

1. In Security settings, click "App passwords"
2. Select "Mail" and "Other (Custom name)"
3. Name it: "Vignette Automation"
4. Copy the generated 16-character password
5. Use this password in your Vercel environment variables

## 🌍 Step 4: Test Your Deployment

### 4.1 Test the Web Interface

1. Go to your Vercel URL: `https://your-app-name.vercel.app`
2. Fill out the form with test data:
   - Plate Number: `GF23WSN`
   - Start Date: `2025-08-29`
   - Email: `your-test-email@example.com`
3. Click "Start Automation"
4. Verify you receive a Credit Card payment URL

### 4.2 Test the API

```bash
curl -X POST https://your-app-name.vercel.app/vignette/order \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "GF23WSN",
    "startDate": "2025-08-29",
    "vignetteType": "annual",
    "vehicleType": "car",
    "email": "test@example.com",
    "paymentMethod": "creditcard"
  }'
```

## 🔄 Step 5: Update and Redeploy

### 5.1 Make Changes Locally

```bash
# Make your changes
# Test locally first
npm start
```

### 5.2 Push to GitHub

```bash
git add .
git commit -m "Update: [describe your changes]"
git push origin main
```

### 5.3 Automatic Deployment

Vercel will automatically detect changes and redeploy your app!

## 🛠️ Troubleshooting

### Common Issues

**1. Build Fails**
- Check if all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check Vercel build logs

**2. Environment Variables Not Working**
- Make sure they're set in Vercel dashboard
- Check for typos in variable names
- Redeploy after adding variables

**3. Email Not Sending**
- Verify Gmail App Password is correct
- Check if 2FA is enabled
- Test email credentials locally first

**4. Puppeteer Issues**
- Vercel has limitations with Puppeteer
- Consider using Puppeteer alternatives for production
- Or use serverless functions with longer timeouts

### Vercel Limitations

- **Function Timeout**: 60 seconds max
- **Memory**: 1024MB max
- **Puppeteer**: May have issues in serverless environment

## 📊 Monitoring

### Vercel Analytics

1. Go to your Vercel dashboard
2. Click on your project
3. Check "Analytics" tab for:
   - Page views
   - Function invocations
   - Performance metrics

### Logs

1. In Vercel dashboard, go to "Functions"
2. Click on your function
3. View real-time logs

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use Vercel's environment variables
3. **Rate Limiting**: Consider adding rate limiting for production
4. **CORS**: Configure CORS if needed for API access

## 🎉 Success!

Your Swiss Vignette Automation is now:
- ✅ **Live on GitHub**: `https://github.com/YOUR_USERNAME/swiss-vignette-automation`
- ✅ **Deployed on Vercel**: `https://your-app-name.vercel.app`
- ✅ **Publicly Accessible**: Anyone can use your automation
- ✅ **Auto-Deploying**: Changes push automatically

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test locally first
4. Check GitHub issues for similar problems

---

**Happy Deploying! 🚀**
