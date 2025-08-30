const axios = require('axios');

async function testViaAdmin() {
  console.log('🧪 Testing via.admin.ch automation...');
  
  try {
    const response = await axios.post('http://localhost:3000/vignette/order', {
      plateNumber: 'ZH445789',
      startDate: '2025-01-15',
      vignetteType: 'annual',
      vehicleType: 'car',
      email: 'test@example.com',
      paymentMethod: 'creditcard'
    }, {
      timeout: 120000 // 2 minutes timeout
    });

    console.log('✅ Test successful!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.paymentUrl && response.data.paymentUrl.includes('pajar.bazg.admin.ch')) {
      console.log('🎯 Real payment URL extracted successfully!');
    } else {
      console.log('⚠️ Fallback URL generated');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📋 Error response:', error.response.data);
    }
  }
}

testViaAdmin();
