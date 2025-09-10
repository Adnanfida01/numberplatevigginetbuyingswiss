const express = require('express');
const router = express.Router();
const { VignetteAPIService } = require('../utils/api');
const { checkVignetteValidity } = require('../utils/puppeteer');
const { checkStatus } = require('../mock/status');
const { sendConfirmationEmail } = require('../utils/email');

// Initialize the API service
const vignetteService = new VignetteAPIService();

// API endpoint for ordering vignettes
router.post('/order', async (req, res) => {
    const { plateNumber, startDate, vignetteType, vehicleType, email, paymentMethod } = req.body;

    try {
        console.log('🎯 Starting vignette order process...');
        console.log('📝 Order details:', { plateNumber, startDate, vignetteType, vehicleType, email, paymentMethod });

        // Use the API-first service with Credit Card as default (since Apple Pay is unavailable)
        const result = await vignetteService.orderVignette({
            plateNumber,
            startDate,
            vignetteType,
            vehicleType,
            email,
            paymentMethod: paymentMethod || 'creditcard' // Default to Credit Card since Apple Pay is unavailable
        });

        console.log('✅ Order processed successfully:', result.method);

        // Check if this is an API request (JSON) or web form request
        const isAPIRequest = req.headers['content-type']?.includes('application/json') || 
                           req.headers['accept']?.includes('application/json');

        if (isAPIRequest) {
            // Return JSON response for API calls
            res.json({
                success: true,
                method: result.method,
                orderId: result.orderId,
                paymentUrl: result.paymentUrl,
                status: 'pending',
                message: 'Vignette order created successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            // Return HTML response for web form submissions
            await sendConfirmationEmail(email, `Your vignette is ready! Payment link: ${result.paymentUrl}`);
            
        res.send(`
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body{margin:0;background:#0f172a;color:#e2e8f0;font-family:Inter,system-ui,Arial,sans-serif}
                .wrap{max-width:760px;margin:40px auto;background:#111827;border:1px solid #1f2937;border-radius:14px;padding:24px 28px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
                h2{margin:0 0 8px 0;font-weight:700}
                .ok{display:inline-block;background:#10b981;color:#052e1d;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:600}
                    .method{display:inline-block;background:#3b82f6;color:#1e3a8a;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:600;margin-left:8px}
                .row{margin-top:14px}
                a.btn{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600}
                .box{background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:14px;margin-top:10px;word-break:break-all}
                .muted{color:#94a3b8;font-size:12px}
                    .success{color:#10b981}
            </style>
            <div class="wrap">
                    <h2>Demo Completed Successfully</h2>
                    <span class="ok">Status: pending</span>
                    <span class="method">Method: ${result.method}</span>
                    <div class="row">
                        <div class="muted">Order ID</div>
                        <div class="box">${result.orderId}</div>
                    </div>
                <div class="row">
                    <div class="muted">Payment link</div>
                        <div class="box"><a class="btn" href="${result.paymentUrl}" target="_blank">Open Checkout</a><br/>${result.paymentUrl}</div>
                </div>
                <div class="row">
                    <div class="muted">Confirmation email sent to</div>
                    <div class="box">${email}</div>
                </div>
                <div class="row">
                    <a class="btn" href="/">Go Back</a>
                </div>
            </div>
        `);
        }

    } catch (err) {
        console.error('❌ Error processing order:', err);
        
        const isAPIRequest = req.headers['content-type']?.includes('application/json') || 
                           req.headers['accept']?.includes('application/json');

        if (isAPIRequest) {
            res.status(500).json({
                success: false,
                error: err.message,
                timestamp: new Date().toISOString()
            });
        } else {
            res.send(`
                <style>
                    body{font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:40px}
                    .error{background:#dc2626;color:#fff;padding:20px;border-radius:10px;margin:20px 0}
                </style>
                <h2>Error occurred</h2>
                <div class="error">${err.message}</div>
                <a href="/" style="color:#60a5fa">Go Back</a>
            `);
        }
    }
});

// API endpoint for checking vignette status
router.get('/status/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        console.log(`📊 Checking status for order: ${orderId}`);
        
        const statusResult = await vignetteService.checkVignetteStatus(orderId);
        
        res.json({
            success: true,
            orderId,
            method: statusResult.method,
            status: statusResult.status,
            data: statusResult.data,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('❌ Error checking status:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint for discovering available endpoints
router.get('/discover', async (req, res) => {
    try {
        console.log('🔍 Discovering API endpoints...');
        
        const discoveredEndpoints = await vignetteService.discoverAPIEndpoints();
        
        res.json({
            success: true,
            discoveredEndpoints,
            message: 'API endpoint discovery completed',
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('❌ Error discovering endpoints:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Validity check endpoint (Puppeteer-based)
router.post('/check-validity', async (req, res) => {
    const { plateNumber } = req.body;
    
    try {
        console.log(`🔍 Checking validity for plate: ${plateNumber}`);
        const result = await checkVignetteValidity(plateNumber);
        res.json({
            success: true,
            plateNumber,
            valid: result.valid,
            message: result.message,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error checking validity:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'Swiss Vignette Automation API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
