# 🚀 Quick Start Guide - Swiss Vignette Automation Demo

## ⚡ **Run in 2 Hours or Less**

### **Step 1: Setup (5 minutes)**

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Start the server
npm start
```

### **Step 2: Test the Demo (5 minutes)**

1. Open http://localhost:3000
2. Fill out the form with sample data:
   - Plate Number: `GF23WSN`
   - Start Date: `2024-01-01`
   - Vignette Type: `Annual`
   - Vehicle Type: `Car`
   - Email: `your-email@example.com`
   - Payment Method: `PayPal`
3. Click "Start Automation"
4. Watch the magic happen! ✨

### **Step 3: Test the API (5 minutes)**

```bash
# Run the API test suite
node test-api.js
```

## 🔧 **How It Works**

### **API-First Approach**

1. **Discovers** available API endpoints automatically
2. **Attempts** direct API calls first (fastest)
3. **Falls back** to web automation when needed
4. **Extracts** real payment URLs from providers

### **Key Features**

- ✅ **Real website automation** using Puppeteer
- ✅ **Payment URL extraction** from actual providers
- ✅ **Email notifications** with payment links
- ✅ **Status tracking** for orders
- ✅ **Modern, responsive UI**
- ✅ **RESTful API endpoints**

## 📡 **API Endpoints**

### **Create Order**
```bash
POST /vignette/order
Content-Type: application/json

{
  "plateNumber": "GF23WSN",
  "startDate": "2024-01-01",
  "vignetteType": "annual",
  "vehicleType": "car",
  "email": "test@example.com",
  "paymentMethod": "paypal"
}
```

### **Check Status**
```bash
GET /vignette/status/{orderId}
```

### **Health Check**
```bash
GET /vignette/health
```

## 🎯 **Client Demo Script**

### **Introduction (2 min)**
"This demo shows how we can automate Swiss vignette ordering using an API-first approach. We'll use the official via.admin.ch website and extract real payment URLs."

### **Live Demo (5 min)**
1. Show the web interface
2. Fill out the form with sample data
3. Start the automation
4. Show the extracted payment URL
5. Demonstrate the confirmation email

### **Technical Explanation (3 min)**
- Explain the API-first approach
- Show how we reverse-engineered the website
- Demonstrate the modular code structure

## 🚀 **Deployment Options**

### **Local Development**
```bash
npm run dev  # Auto-restart on changes
```

### **Production (Docker)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### **AWS Lambda**
The project can be adapted for serverless deployment with minimal changes.

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Puppeteer fails to launch**
   - Install Chrome/Chromium browser
   - Check system dependencies

2. **Website changes break automation**
   - Update selectors in `utils/puppeteer.js`
   - Add more robust error handling

3. **Email not sending**
   - Check SMTP configuration in `.env`
   - Verify email credentials

### **Debug Mode**
```bash
DEBUG=true npm start
```

## 📊 **What's Included**

### ✅ **Working Features**
- Real website navigation and form filling
- Payment URL extraction from actual providers
- Email notifications with payment links
- Status tracking simulation
- Modern, responsive UI
- RESTful API endpoints

### 🔄 **Simulated Features**
- Vignette status checking (10-second delay)
- Email sending (logs to console in demo mode)
- Payment processing (redirects to real payment URLs)

## 🎉 **Success!**

You now have a **production-ready demo** that demonstrates:
- API-first automation approach
- Real website interaction
- Payment URL extraction
- Scalable architecture
- Modern web interface

**Ready to impress your client!** 🚀
