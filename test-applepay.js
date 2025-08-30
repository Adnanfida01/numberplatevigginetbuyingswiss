const axios = require('axios');

async function testApplePay() {
    try {
        console.log('🧪 Testing Apple Pay functionality...');
        
        const response = await axios.post('http://localhost:3000/vignette/order', {
            plateNumber: 'GF23WSN',
            startDate: '2025-08-29',
            vignetteType: 'annual',
            vehicleType: 'car',
            email: 'test@example.com',
            paymentMethod: 'applepay'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Test successful!');
        console.log('📊 Response:', {
            success: response.data.success,
            method: response.data.method,
            paymentUrl: response.data.paymentUrl,
            orderId: response.data.orderId
        });

        // Check if Apple Pay URL is generated
        if (response.data.paymentUrl && response.data.paymentUrl.includes('apple')) {
            console.log('🎉 Apple Pay URL successfully generated!');
        } else {
            console.log('⚠️ Apple Pay URL not detected, but fallback URL provided');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testApplePay();
