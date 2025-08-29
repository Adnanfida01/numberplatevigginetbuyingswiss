const axios = require('axios');

/**
 * Test Script for Swiss Vignette API
 * 
 * This script demonstrates how to:
 * 1. Make API calls to the vignette service
 * 2. Test different endpoints
 * 3. Handle responses and errors
 */

const BASE_URL = 'http://localhost:3000/vignette';

// Test data
const testOrder = {
    plateNumber: 'GF23WSN',
    startDate: '2024-01-01',
    vignetteType: 'annual',
    vehicleType: 'car',
    email: 'test@example.com',
    paymentMethod: 'paypal'
};

async function testAPI() {
    console.log('🚀 Starting API tests...\n');

    try {
        // Test 1: Health check
        console.log('1️⃣ Testing health endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check passed:', healthResponse.data);
        console.log('');

        // Test 2: Discover endpoints
        console.log('2️⃣ Testing endpoint discovery...');
        const discoverResponse = await axios.get(`${BASE_URL}/discover`);
        console.log('✅ Endpoint discovery completed:', discoverResponse.data);
        console.log('');

        // Test 3: Create vignette order
        console.log('3️⃣ Testing vignette order creation...');
        const orderResponse = await axios.post(`${BASE_URL}/order`, testOrder, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        console.log('✅ Order created successfully:', orderResponse.data);
        console.log('');

        // Test 4: Check order status
        if (orderResponse.data.orderId) {
            console.log('4️⃣ Testing status check...');
            const statusResponse = await axios.get(`${BASE_URL}/status/${orderResponse.data.orderId}`);
            console.log('✅ Status check completed:', statusResponse.data);
            console.log('');
        }

        console.log('🎉 All API tests completed successfully!');

    } catch (error) {
        console.error('❌ API test failed:', error.response?.data || error.message);
    }
}

// Example of how to use the API in your own application
async function exampleUsage() {
    console.log('\n📚 Example API Usage:\n');

    // Example 1: Simple order creation
    console.log('Example 1: Create a vignette order');
    try {
        const response = await axios.post(`${BASE_URL}/order`, {
            plateNumber: 'AB123CD',
            startDate: '2024-02-01',
            vignetteType: 'annual',
            vehicleType: 'car',
            email: 'customer@example.com',
            paymentMethod: 'paypal'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Order ID:', response.data.orderId);
        console.log('Payment URL:', response.data.paymentUrl);
        console.log('Method used:', response.data.method);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Example 2: Check order status
    console.log('Example 2: Check order status');
    try {
        const response = await axios.get(`${BASE_URL}/status/vignette_123456`);
        console.log('Status:', response.data.status);
        console.log('Method used:', response.data.method);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    console.log('🔧 Swiss Vignette API Test Suite');
    console.log('Make sure the server is running on http://localhost:3000\n');
    
    testAPI()
        .then(() => exampleUsage())
        .catch(console.error);
}

module.exports = { testAPI, exampleUsage };
