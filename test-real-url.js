const { VignetteAPIService } = require('./utils/api');

/**
 * Test script to verify real payment URL extraction
 */

async function testRealPaymentURL() {
    console.log('🧪 Testing Real Payment URL Extraction...\n');

    const vignetteService = new VignetteAPIService();

    const testOrder = {
        plateNumber: 'GF23WSN',
        startDate: '2024-01-01',
        vignetteType: 'annual',
        vehicleType: 'car',
        email: 'test@example.com',
        paymentMethod: 'paypal'
    };

    try {
        console.log('📝 Test Order Data:');
        console.log(JSON.stringify(testOrder, null, 2));
        console.log('');

        console.log('🚀 Starting order process...');
        const result = await vignetteService.orderVignette(testOrder);

        console.log('\n✅ Order Result:');
        console.log('Method used:', result.method);
        console.log('Order ID:', result.orderId);
        console.log('Payment URL:', result.paymentUrl);
        console.log('Success:', result.success);
        console.log('');

        // Verify the payment URL is realistic
        if (result.paymentUrl && !result.paymentUrl.includes('example.com')) {
            console.log('🎉 SUCCESS: Real payment URL extracted!');
            console.log('The system is working with actual website automation.');
        } else {
            console.log('⚠️ WARNING: Using fallback payment URL');
            console.log('This might indicate the website automation needs adjustment.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testRealPaymentURL();
