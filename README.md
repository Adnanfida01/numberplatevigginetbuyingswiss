# 🚗 Swiss Vignette Automation Demo

A demonstration project that automates the ordering of digital vignettes for Switzerland using an API-first approach.

## 🎯 **Project Goals**

This demo shows how to:
- ✅ Automate Swiss vignette ordering via via.admin.ch
- ✅ Extract real payment URLs from the official website
- ✅ Handle form submissions and payment processing
- ✅ Provide status tracking for vignette orders
- ✅ Send confirmation emails to customers

## 🚀 **Quick Start**

### Prerequisites
- Node.js 16+ installed
- Chrome/Chromium browser (for Puppeteer)

### Installation
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the demo
npm start
```

### Usage
1. Open http://localhost:3000 in your browser
2. Fill in the vignette details (plate number, dates, etc.)
3. Click "Start Automation"
4. Watch as the system navigates the official Swiss vignette website
5. Receive the payment URL and confirmation email

## 🔧 **API-First Approach**

### How It Works

1. **Form Submission**: User submits vignette details via web form
2. **Puppeteer Automation**: System navigates to via.admin.ch and fills forms
3. **Payment URL Extraction**: Captures real payment URLs from payment providers
4. **Status Tracking**: Monitors vignette status after payment
5. **Email Notification**: Sends confirmation with payment link

### API Endpoints

#### POST `/vignette/order`
Submit a vignette order request.

**Request Body:**
```json
{
  "plateNumber": "GF23WSN",
  "startDate": "2024-01-01",
  "vignetteType": "annual",
  "vehicleType": "car",
  "email": "customer@example.com",
  "paymentMethod": "paypal"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://www.paypal.com/checkout/...",
  "status": "pending",
  "orderId": "vignette_123456"
}
```

## 🛠 **Technical Architecture**

### Core Components

1. **Web Interface** (`public/index.html`)
   - Modern, responsive form for user input
   - Real-time progress tracking
   - Success/error handling

2. **Automation Engine** (`utils/puppeteer.js`)
   - Headless browser automation
   - Form filling and navigation
   - Payment URL extraction
   - Stealth mode to avoid detection

3. **API Layer** (`routes/vignette.js`)
   - RESTful endpoints
   - Request validation
   - Response formatting

4. **Status Tracking** (`mock/status.js`)
   - Simulated vignette status checking
   - Configurable delays for demo purposes

5. **Email Service** (`utils/email.js`)
   - Confirmation email sending
   - Payment link inclusion

### Environment Variables

Create a `.env` file with:

```env
# Swiss Vignette Website URL
SWISS_VIGNETTE_URL=https://www.vignetteswitzerland.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Preferences
PREFERRED_PAYMENT_METHOD=paypal

# Server Configuration
PORT=3000
```

## 🔍 **How to Reverse-Engineer APIs**

### Step 1: Manual Website Analysis
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Manually complete a vignette order
4. Look for API calls in the Network tab

### Step 2: Identify API Endpoints
Look for:
- `fetch()` or `XMLHttpRequest` calls
- JSON responses
- Form submissions
- Payment provider redirects

### Step 3: Extract Request Details
For each API call, note:
- URL endpoint
- HTTP method (GET, POST, etc.)
- Request headers
- Request body format
- Response format

### Step 4: Replicate in Node.js
```javascript
const axios = require('axios');

// Example API call
const response = await axios.post('https://api.vignetteswitzerland.com/order', {
  plateNumber: 'GF23WSN',
  startDate: '2024-01-01',
  // ... other fields
}, {
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0...'
  }
});
```

## 🚀 **Deployment Options**

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### AWS Lambda
The project can be adapted for serverless deployment:
- Use Puppeteer with Chrome AWS Lambda layer
- Convert to Lambda function format
- Use API Gateway for HTTP endpoints

## 📊 **Demo Features**

### ✅ What Works
- Real website navigation and form filling
- Payment URL extraction from actual providers
- Email notifications with payment links
- Status tracking simulation
- Modern, responsive UI

### 🔄 What's Simulated
- Vignette status checking (10-second delay)
- Email sending (logs to console in demo mode)
- Payment processing (redirects to real payment URLs)

## 🎯 **Client Demo Script**

1. **Introduction** (2 minutes)
   - "This demo shows how we can automate Swiss vignette ordering"
   - "We'll use the official via.admin.ch website"

2. **Live Demo** (5 minutes)
   - Fill out the form with sample data
   - Show the automation in action
   - Display the extracted payment URL
   - Show the confirmation email

3. **Technical Explanation** (3 minutes)
   - Explain the API-first approach
   - Show how we reverse-engineered the website
   - Demonstrate the modular code structure

4. **Q&A** (5 minutes)
   - Address questions about scalability
   - Discuss production deployment options
   - Explain error handling and monitoring

## 🔧 **Troubleshooting**

### Common Issues

1. **Puppeteer fails to launch**
   - Install Chrome/Chromium
   - Check system dependencies

2. **Website changes break automation**
   - Update selectors in `utils/puppeteer.js`
   - Add more robust error handling

3. **Email not sending**
   - Check SMTP configuration
   - Verify email credentials

### Debug Mode
Set `DEBUG=true` in `.env` to see detailed logs:
```bash
DEBUG=true npm start
```

## 📝 **Next Steps**

For production deployment:
1. Add proper error handling and retries
2. Implement real payment processing
3. Add database for order tracking
4. Set up monitoring and logging
5. Add rate limiting and security measures

---

**Note**: This is a demo project for educational purposes. Always comply with website terms of service and applicable laws when automating web interactions.
