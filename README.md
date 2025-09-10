# 🚗 Swiss Vignette Automation Bot

A fully automated bot for purchasing Swiss e-vignettes from via.admin.ch with real payment URL extraction.

## 🌟 Features

- **Fully Automated**: Complete end-to-end automation of Swiss e-vignette purchase
- **Real Payment URLs**: Extracts actual payment gateway URLs from via.admin.ch
- **Headless Operation**: Runs completely in background (no browser windows)
- **Multi-Language Support**: Handles both German and English interfaces
- **Robust Error Handling**: Multiple fallback strategies for reliable operation
- **Production Ready**: Optimized for server deployment
- **Real-time Logging**: Detailed progress tracking and debugging

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Adnanfida01/swiss-vignette-automation.git
   cd swiss-vignette-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Puppeteer (if not already installed)**
   ```bash
   npm install puppeteer
   # or if you need to install Chromium separately
   npx puppeteer browsers install chrome
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

6. **Access the application**
   - Web Interface: http://localhost:3000
   - API Endpoint: http://localhost:3000/api/vignette/order

## 📦 Deployment

### Option 1: Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard
   - Deploy!

3. **Environment Variables for Vercel**
   Add these in Vercel dashboard:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   SWISS_VIGNETTE_URL=https://vignetteswitzerland.com
   PUPPETEER_HEADLESS=true
   ```

### Option 2: Deploy to Other Platforms

#### Heroku
```bash
# Add to package.json
"engines": {
  "node": "18.x"
}

# Deploy
heroku create your-app-name
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Swiss Vignette URL
SWISS_VIGNETTE_URL=https://vignetteswitzerland.com

# Puppeteer Settings
PUPPETEER_HEADLESS=true

# Server Settings
PORT=3000
NODE_ENV=production
```

### Payment Methods

The system supports:
- **Credit Card** (Default - Working)
- **PayPal** (Available)
- **iDEAL** (Available)
- **Apple Pay** (Fallback to Credit Card - Not available on website)

## 📡 API Endpoints

### POST `/vignette/order`
Order a new vignette

**Request Body:**
```json
{
  "plateNumber": "GF23WSN",
  "startDate": "2025-08-29",
  "vignetteType": "annual",
  "vehicleType": "car",
  "email": "user@example.com",
  "paymentMethod": "creditcard"
}
```

**Response:**
```json
{
  "success": true,
  "method": "automation",
  "orderId": "vignette_1234567890",
  "paymentUrl": "https://mollie.com/checkout/creditcard/reference/...",
  "status": "pending",
  "message": "Vignette order created successfully"
}
```

### GET `/vignette/health`
Health check endpoint

### GET `/vignette/status/:orderId`
Check order status

## 🛠️ Technical Architecture

- **Backend**: Node.js + Express.js
- **Web Automation**: Puppeteer with stealth plugin
- **Email**: Nodemailer with Gmail SMTP
- **Payment**: Mollie integration (Credit Card)
- **Frontend**: Simple HTML/CSS/JS interface

## 🔍 How It Works

1. **API-First Approach**: Attempts direct API calls to Swiss vignette service
2. **Web Automation Fallback**: If no API available, uses Puppeteer to:
   - Navigate to vignetteswitzerland.com
   - Fill out the form step by step
   - Extract real payment URLs
   - Handle payment gateway redirects
3. **Payment Processing**: Generates realistic Mollie Credit Card payment URLs
4. **Email Notifications**: Sends confirmation emails to users

## 🚀 Performance Optimizations

- **Smart Timeouts**: Reduced from 60s to 30s
- **Direct Navigation**: Skip to product details page
- **Optimized Waits**: Reduced page transition times
- **Browser Optimization**: Added performance flags
- **Error Recovery**: Robust fallback mechanisms

## 📝 License

MIT License - feel free to use for commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Check the troubleshooting section in the docs

---

**Made with ❤️ for Swiss Vignette Automation**

---

### Swiss Vignette Automation Bot

#### Overview
Swiss Vignette Automation Bot automates the Swiss e‑vignette process on `via.admin.ch`:
- Purchases an e‑vignette and captures the real payment URL
- Checks license plate validity using the official API
- Runs headless for servers, Docker, and serverless (Vercel)

Tech stack:
- Node.js, Express, dotenv
- Puppeteer (vanilla)
- Axios

#### Features
- Automatic vignette purchase flow (resilient navigation + retries)
- Extracts real checkout URL (e.g., `pajar.bazg.admin.ch/checkout/.../selection`)
- Validity check via official API (`/shop/api/v1/vehicle/query-license-plate`)
- Headless Chrome with safe flags for restricted environments
- Clear logging with ✅, ⚠️, ❌ markers

---

### Installation

Prerequisites:
- Node.js >= 18 (tested on Node 22)
- npm

Steps:
1) Clone
```bash
git clone <your-repo-url>
cd swiss-vignette-automation
```
2) Install deps
```bash
npm install
```
3) Configure env
```bash
cp env.example .env
```
Edit `.env` (template):
```env
PORT=3000
NODE_ENV=production
# Optional for serverless/Docker chromium path
# PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Optional demo base URL for utils/api.js discovery
# SWISS_VIGNETTE_URL=https://www.vignetteswitzerland.com
```
4) Run
```bash
npm start
# Server: http://localhost:3000
```

---

### Configuration
- Express app: `index.js` (serves `public/` and mounts `/vignette` routes)
- Puppeteer is headless with flags:
  - `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-accelerated-2d-canvas --no-first-run --no-zygote --disable-gpu`
- Optional: set `PUPPETEER_EXECUTABLE_PATH` for serverless builds

---

### Usage

#### Place an order (automation + payment URL capture)
Endpoint: `POST /vignette/order`

Request body:
```json
{
  "plateNumber": "ZH123456",
  "startDate": "2025-09-10",
  "vignetteType": "annual",
  "vehicleType": "car",
  "email": "you@example.com",
  "paymentMethod": "creditcard"
}
```

Response (example):
```json
{
  "success": true,
  "method": "automation",
  "orderId": "vignette_1694350987654",
  "paymentUrl": "https://pajar.bazg.admin.ch/checkout/.../selection",
  "status": "pending",
  "message": "Vignette order created successfully",
  "timestamp": "2025-09-10T12:34:56.789Z"
}
```

Curl example:
```bash
curl -X POST http://localhost:3000/vignette/order \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber":"ZH123456",
    "startDate":"2025-09-10",
    "vignetteType":"annual",
    "vehicleType":"car",
    "email":"you@example.com",
    "paymentMethod":"creditcard"
  }'
```

#### Check validity (official API)
Endpoint: `POST /vignette/check-validity`

Request body:
```json
{ "plateNumber": "ZH123456" }
```

Response (examples):
```json
{ "success": true, "plateNumber": "ZH123456", "valid": true, "message": "valid", "timestamp": "..." }
```
or
```json
{ "success": true, "plateNumber": "ZH123456", "valid": false, "message": "invalid", "timestamp": "..." }
```

The bot calls:
```
PUT https://via.admin.ch/shop/api/v1/vehicle/query-license-plate
{
  "country": "CH",
  "plate": "ZH123456",
  "productType": "E_VIGNETTE"
}
```

#### Other endpoints
- `GET /vignette/status/:orderId` – demo status checker
- `GET /vignette/discover` – demo API discovery
- `GET /vignette/health` – health check

#### Logs
- Console includes step-by-step logs with:
  - ✅ success, ⚠️ warning, ❌ error
- Browser console is piped into Node logs during automation for debugging

---

### Deployment

Any Node host (PM2, Docker) or serverless (Vercel):
- Ensure Chromium available or set `PUPPETEER_EXECUTABLE_PATH`
- Keep headless flags for sandboxed environments
- Increase cold-start timeouts in serverless if needed

Vercel:
- Project includes `vercel.json`
- Configure environment variables in dashboard

Docker tips:
- Consider `--shm-size=1g` to avoid `/dev/shm` issues
- Use the included headless flags

---

### Troubleshooting
- Timeouts (navigation/selectors)
  - The bot retries navigation and refreshes; ensure network stability and raise timeouts if needed
- No payment URL detected
  - Checkout may take time; the bot listens for redirect URLs and checks after navigation
- Plate format
  - Input should be normalized (no spaces, hyphens, dots). The validity API call normalizes automatically
- CSP/headless blanks
  - Rarely, pages render blank in headless; the bot refreshes and validates content length

---

### Project Structure
- `index.js`: Express bootstrap
- `routes/vignette.js`: API routes (order, validity, status, discover, health)
- `utils/puppeteer.js`: Purchase automation and API-based validity checker
- `utils/api.js`: API-first scaffolding, discovery helpers, fallback to automation
- `utils/email.js`: Mock email helper for confirmation
- `public/`: Minimal dashboard UI
- `vercel.json`: Optional deployment config

### Security & Disclaimer
- For educational/demo use only; not affiliated with Swiss authorities
- Ensure compliance with applicable laws and website terms
- Do not commit secrets; use environment variables

### License
ISC (see `package.json`)
