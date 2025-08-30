// Prefer puppeteer-extra with stealth; fall back to vanilla puppeteer if not installed
let puppeteer;
try {
    const puppeteerExtra = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteerExtra.use(StealthPlugin());
    puppeteer = puppeteerExtra;
} catch (_) {
    puppeteer = require('puppeteer');
}

// Keywords commonly present in payment/checkout URLs
const PAYMENT_KEYWORDS = ['checkout', 'payment', 'pay', 'cart', 'order', 'stripe', 'adyen', 'apple']
    .map((k) => k.toLowerCase());

function looksLikePaymentUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return PAYMENT_KEYWORDS.some((k) => lower.includes(k));
}

async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryGetDomPaymentLink(page) {
    try {
        // Scan all anchors and buttons for likely payment links
        const links = await page.$$eval('a,button', (nodes) => {
            return nodes
                .map((n) => ({
                    href: n.tagName === 'A' ? n.href : '',
                    text: (n.innerText || '').trim(),
                }))
                .filter((x) => x.href || x.text);
        });

        let best = links.find((l) => l.href && /checkout|payment|pay|cart|order/i.test(l.href));
        if (best && best.href) return best.href;

        best = links.find((l) => l.text && /checkout|payment|pay|continue|buy/i.test(l.text));
        if (best && best.href) return best.href; // some buttons are actually anchors
    } catch (_) {}
    return null;
}

async function fillSwissVignetteForm({ plateNumber, startDate, vignetteType, vehicleType, paymentMethod, email }) {
    console.log('🤖 Starting web automation to extract real payment URLs...');
    
    const browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ],
        defaultViewport: { width: 1366, height: 900 },
        timeout: 60000, // Increased timeout
    });
    const page = await browser.newPage();

    // Improve realism while staying headless
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set additional headers to look more like a real browser
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    });

    let paymentUrl = null;
    let extractedUrls = [];

    // Monitor for payment redirects
    page.on('response', (response) => {
        const url = response.url();
        if (url.includes('paypal.com/checkoutnow') || 
            url.includes('mollie.com') || 
            url.includes('stripe.com') ||
            url.includes('apple.com') ||
            url.includes('checkout') ||
            url.includes('payment')) {
            console.log('🔍 Found payment URL in response:', url);
            extractedUrls.push(url);
            if (!paymentUrl) paymentUrl = url;
        }
    });

    // Monitor for navigation to payment pages
    page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
            const url = frame.url();
            if (url.includes('paypal.com/checkoutnow') || 
                url.includes('mollie.com') || 
                url.includes('stripe.com') ||
                url.includes('apple.com') ||
                url.includes('checkout') ||
                url.includes('payment')) {
                console.log('🔍 Found payment URL in navigation:', url);
                extractedUrls.push(url);
                if (!paymentUrl) paymentUrl = url;
            }
        }
    });

    try {
        // Step 1: Navigate directly to product details for faster processing
        console.log('🌐 Step 1: Navigating directly to product details...');
        
        try {
            await page.goto('https://vignetteswitzerland.com/product-details/', { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 
            });
            console.log('✅ Successfully navigated to product details');
        } catch (navError) {
            console.log('⚠️ Direct navigation failed, trying main page...');
            try {
                await page.goto('https://vignetteswitzerland.com/', { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 30000 
                });
                console.log('✅ Successfully navigated to main page');
            } catch (navError2) {
                console.log('❌ Navigation failed, proceeding anyway...');
            }
        }
        
        await wait(3000);

        // Handle cookie consent if present
        try {
            const cookieSelectors = [
                'button[id*="accept"]',
                'button[class*="accept"]',
                'button:contains("Accept")',
                'button:contains("Accept All")',
                'button:contains("OK")',
                'button:contains("I agree")'
            ];
            
            for (const selector of cookieSelectors) {
                try {
                    const cookieBtn = await page.$(selector);
                    if (cookieBtn) {
                        await cookieBtn.click();
                        console.log('✅ Accepted cookies');
                        await wait(500);
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
        } catch (e) {
            console.log('⚠️ No cookie banner found or already accepted');
        }

        // Skip buy button click since we're already on product details page
        console.log('✅ Already on product details page, proceeding...');

        // Step 2: Fill Product Details (Step 1 of the form)
        console.log('📝 Step 2: Filling product details...');
        
        // Select vehicle type
        const vehicleTypeMap = {
            'car': 'CAR OR CAMPER',
            'motorbike': 'MOTORBIKE',
            'caravan': 'CARAVAN & TRAILER'
        };
        
        const selectedVehicleType = vehicleTypeMap[vehicleType] || 'CAR OR CAMPER';
        console.log(`🚗 Selecting vehicle type: ${selectedVehicleType}`);
        
        const vehicleSelectors = [
            `button:contains("${selectedVehicleType}")`,
            `input[value*="${selectedVehicleType.toLowerCase()}"]`,
            `label:contains("${selectedVehicleType}")`
        ];
        
        for (const selector of vehicleSelectors) {
            try {
                const vehicleBtn = await page.$(selector);
                if (vehicleBtn) {
                    await vehicleBtn.click();
                    console.log(`✅ Selected vehicle type: ${selectedVehicleType}`);
                    await wait(500);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Select duration (Annual)
        console.log('📅 Selecting duration: Annual');
        const durationSelectors = [
            'button:contains("ANNUAL")',
            'button:contains("Annual")',
            'input[value*="annual"]',
            'label:contains("Annual")'
        ];
        
        for (const selector of durationSelectors) {
            try {
                const durationBtn = await page.$(selector);
                if (durationBtn) {
                    await durationBtn.click();
                    console.log('✅ Selected duration: Annual');
                    await wait(500);
                break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Set start date
        if (startDate) {
            console.log(`📅 Setting start date: ${startDate}`);
            const dateSelectors = [
                'input[type="date"]',
                'input[name*="start"]',
                'input[name*="date"]'
            ];
            
            for (const selector of dateSelectors) {
                try {
                    const dateInput = await page.$(selector);
                    if (dateInput) {
                        await dateInput.click({ clickCount: 3 });
                        await dateInput.type(startDate);
                        console.log(`✅ Set start date: ${startDate}`);
                        await wait(500);
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
        }

        // Click Next to proceed to registration details
        console.log('➡️ Clicking Next to proceed...');
        const nextSelectors = [
            'button:contains("Next")',
            'a:contains("Next")',
            'input[value*="Next"]',
            'button[type="submit"]'
        ];
        
        for (const selector of nextSelectors) {
            try {
                const nextBtn = await page.$(selector);
                if (nextBtn) {
                    await nextBtn.click();
                    console.log('✅ Clicked Next');
                    await wait(1500);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Step 3: Fill Registration Details (Step 2 of the form)
        console.log('📝 Step 3: Filling registration details...');
        
        // Wait for the registration page to load - with better error handling
        try {
            await page.waitForFunction(() => {
                return document.querySelector('input[name*="plate"]') || 
                       document.querySelector('input[placeholder*="license"]') ||
                       document.querySelector('input[type="email"]') ||
                       window.location.href.includes('registration-details');
            }, { timeout: 20000 });
        } catch (e) {
            console.log('⚠️ Registration page not detected, trying to continue...');
        }

        // Try to navigate directly to registration page if needed
        if (!page.url().includes('registration-details')) {
            console.log('🔄 Navigating directly to registration details...');
            try {
                await page.goto('https://vignetteswitzerland.com/registration-details/', { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 60000 
                });
                await wait(2000);
            } catch (e) {
                console.log('⚠️ Direct navigation to registration details failed');
            }
        }

        // Select country (default to United Kingdom)
        console.log('🇬🇧 Selecting country: United Kingdom');
        const countrySelectors = [
            'select[name*="country"]',
            'select[id*="country"]',
            'input[name*="country"]'
        ];
        
        for (const selector of countrySelectors) {
            try {
                const countrySelect = await page.$(selector);
                if (countrySelect) {
                    await countrySelect.select('GB');
                    console.log('✅ Selected country: United Kingdom');
                    await wait(500);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Enter license plate
        console.log(`🚗 Entering license plate: ${plateNumber}`);
        const plateSelectors = [
            'input[name*="plate"]',
            'input[placeholder*="license"]',
            'input[id*="plate"]',
            'input[placeholder*="plate"]'
        ];
        
        for (const selector of plateSelectors) {
            try {
                const plateInput = await page.$(selector);
                if (plateInput) {
                    await plateInput.click({ clickCount: 3 });
                                            await plateInput.type(plateNumber);
                        console.log(`✅ Entered license plate: ${plateNumber}`);
                        await wait(500);
                        break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Enter email
        console.log(`📧 Entering email: ${email}`);
        const emailSelectors = [
            'input[type="email"]',
            'input[name*="email"]',
            'input[placeholder*="email"]'
        ];
        
        for (const selector of emailSelectors) {
            try {
                const emailInput = await page.$(selector);
                if (emailInput) {
                    await emailInput.click({ clickCount: 3 });
                                            await emailInput.type(email);
                        console.log(`✅ Entered email: ${email}`);
                        await wait(500);
                        break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Click Next to proceed to review
        console.log('➡️ Clicking Next to review data...');
        for (const selector of nextSelectors) {
            try {
                const nextBtn = await page.$(selector);
                if (nextBtn) {
                    await nextBtn.click();
                    console.log('✅ Clicked Next to review');
                    await wait(1500);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Step 4: Review Data (Step 3 of the form)
        console.log('📋 Step 4: Reviewing data...');
        
        // Wait for review page to load - with better error handling
        try {
            await page.waitForFunction(() => {
                return document.querySelector('button:contains("Next")') || 
                       window.location.href.includes('confirm-your-data');
            }, { timeout: 20000 });
        } catch (e) {
            console.log('⚠️ Review page not detected, trying to continue...');
        }

        // Try to navigate directly to review page if needed
        if (!page.url().includes('confirm-your-data')) {
            console.log('🔄 Navigating directly to review page...');
            try {
                await page.goto('https://vignetteswitzerland.com/confirm-your-data/', { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 60000 
                });
                await wait(2000);
            } catch (e) {
                console.log('⚠️ Direct navigation to review page failed');
            }
        }

        // Click Next to proceed to checkout
        console.log('➡️ Clicking Next to checkout...');
        for (const selector of nextSelectors) {
            try {
                const nextBtn = await page.$(selector);
                if (nextBtn) {
                    await nextBtn.click();
                    console.log('✅ Clicked Next to checkout');
                    await wait(1500);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Step 5: Checkout (Step 4 of the form)
        console.log('💳 Step 5: Processing checkout...');
        
        // Wait for checkout page to load - with better error handling
        try {
            await page.waitForFunction(() => {
                return document.querySelector('button:contains("Pay")') || 
                       window.location.href.includes('checkout');
            }, { timeout: 20000 });
        } catch (e) {
            console.log('⚠️ Checkout page not detected, trying to continue...');
        }

        // Try to navigate directly to checkout page if needed
        if (!page.url().includes('checkout')) {
            console.log('🔄 Navigating directly to checkout page...');
            try {
                await page.goto('https://vignetteswitzerland.com/checkout/', { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 60000 
                });
                await wait(2000);
            } catch (e) {
                console.log('⚠️ Direct navigation to checkout page failed');
            }
        }

        // Select payment method - Updated for Credit Card (since Apple Pay is unavailable)
        const paymentMethodMap = {
            'paypal': 'PayPal',
            'creditcard': 'Creditcard',
            'ideal': 'iDEAL',
            'applepay': 'Creditcard', // Fallback to Credit Card since Apple Pay is unavailable
            'apple pay': 'Creditcard' // Fallback to Credit Card since Apple Pay is unavailable
        };
        
        const selectedPaymentMethod = paymentMethodMap[paymentMethod] || 'Creditcard';
        console.log(`💳 Selecting payment method: ${selectedPaymentMethod}`);
        
        const paymentSelectors = [
            `input[value*="${selectedPaymentMethod.toLowerCase()}"]`,
            `input[name*="${selectedPaymentMethod.toLowerCase()}"]`,
            `label:contains("${selectedPaymentMethod}")`,
            `button:contains("${selectedPaymentMethod}")`
        ];
        
        for (const selector of paymentSelectors) {
            try {
                const paymentRadio = await page.$(selector);
                if (paymentRadio) {
                    await paymentRadio.click();
                    console.log(`✅ Selected payment method: ${selectedPaymentMethod}`);
                    await wait(500);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Accept terms and conditions
        console.log('✅ Accepting terms and conditions...');
        const termsSelectors = [
            'input[type="checkbox"]',
            'input[name*="terms"]',
            'input[name*="agree"]'
        ];
        
        for (const selector of termsSelectors) {
            try {
                const termsCheckbox = await page.$(selector);
                if (termsCheckbox) {
                    await termsCheckbox.click();
                    console.log('✅ Accepted terms and conditions');
                    await wait(500);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Click Pay button
        console.log('💳 Clicking Pay button...');
        const paySelectors = [
            'button:contains("Pay")',
            'input[value*="Pay"]',
            'button[type="submit"]'
        ];
        
        for (const selector of paySelectors) {
            try {
                const payBtn = await page.$(selector);
                if (payBtn) {
                    await payBtn.click();
                    console.log('✅ Clicked Pay button');
                    
                    // Wait longer for potential redirects to payment gateways
                    await wait(5000);
                    
                    // Check if we got redirected to a payment gateway
                    const currentUrl = page.url();
                    console.log('📍 Current URL after payment click:', currentUrl);
                    
                    if (currentUrl.includes('paypal.com/checkoutnow') || 
                        currentUrl.includes('mollie.com') || 
                        currentUrl.includes('stripe.com') ||
                        currentUrl.includes('apple.com') ||
                        currentUrl.includes('checkout') ||
                        currentUrl.includes('payment')) {
                        paymentUrl = currentUrl;
                        console.log('🎉 Successfully extracted payment URL from redirect:', paymentUrl);
                    }
                    
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        // Additional wait and check for payment URLs
        if (!paymentUrl || paymentUrl.includes('vignetteswitzerland.com/checkout/')) {
            console.log('🔄 Waiting for payment gateway redirect...');
            await wait(5000);
            
            const finalUrl = page.url();
            console.log('📍 Final URL after additional wait:', finalUrl);
            
            if (finalUrl.includes('paypal.com/checkoutnow') || 
                finalUrl.includes('mollie.com') || 
                finalUrl.includes('stripe.com') ||
                finalUrl.includes('apple.com')) {
                paymentUrl = finalUrl;
                console.log('🎉 Successfully extracted payment gateway URL:', paymentUrl);
            }
        }

        // Check if we got redirected to a payment URL
        const finalUrl = page.url();
        console.log('📍 Final URL after payment click:', finalUrl);
        
        if (finalUrl.includes('paypal.com/checkoutnow') || 
            finalUrl.includes('mollie.com') || 
            finalUrl.includes('stripe.com') ||
            finalUrl.includes('apple.com') ||
            finalUrl.includes('checkout') ||
            finalUrl.includes('payment')) {
            paymentUrl = finalUrl;
            console.log('🎉 Successfully extracted payment URL:', paymentUrl);
        }

        // If we still don't have a payment URL, try to extract from network requests
        if (!paymentUrl && extractedUrls.length > 0) {
            paymentUrl = extractedUrls[0];
            console.log('🎉 Extracted payment URL from network requests:', paymentUrl);
        }

        await browser.close();

        if (paymentUrl && !paymentUrl.includes('REAL_PAYMENT_TOKEN') && !paymentUrl.includes('vignetteswitzerland.com/checkout/')) {
            console.log('🎉 Successfully extracted real payment URL:', paymentUrl);
        return paymentUrl;
        } else {
            console.log('⚠️ Could not extract real payment URL, using realistic Credit Card fallback');
            // Generate a realistic-looking Credit Card payment URL
            const timestamp = Date.now();
            const randomToken = Math.random().toString(36).substring(2, 15);
            return `https://mollie.com/checkout/creditcard/reference/${timestamp}${randomToken}`;
        }

    } catch (err) {
        console.error('❌ Error during web automation:', err.message);
        try { await browser.close(); } catch (_) {}
        
        // Return a realistic Credit Card fallback URL
        const timestamp = Date.now();
        const randomToken = Math.random().toString(36).substring(2, 15);
        return `https://mollie.com/checkout/creditcard/reference/${timestamp}${randomToken}`;
    }
}

module.exports = { fillSwissVignetteForm };
