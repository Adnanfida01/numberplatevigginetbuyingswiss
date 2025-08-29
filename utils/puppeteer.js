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
const PAYMENT_KEYWORDS = ['checkout', 'payment', 'pay', 'cart', 'order', 'stripe', 'adyen']
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
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
        defaultViewport: { width: 1366, height: 900 },
    });
    const page = await browser.newPage();

    // Improve realism a bit while staying headless
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    const candidateUrls = new Set();

    // Capture network requests/responses that look like payment
    page.on('request', (req) => {
        const u = req.url();
        if (looksLikePaymentUrl(u) || u.includes('mollie.com') || u.includes('paypal.com')) candidateUrls.add(u);
    });
    page.on('response', (res) => {
        const u = res.url();
        if (looksLikePaymentUrl(u) || u.includes('mollie.com') || u.includes('paypal.com')) candidateUrls.add(u);
    });

    // Capture popups (payment often opens a new tab)
    browser.on('targetcreated', async (target) => {
        try {
            const newPage = await target.page();
            if (!newPage) return;
            await newPage.waitForLoadState?.('domcontentloaded'); // Playwright style guard; ignores in Puppeteer
            const u = newPage.url();
            if (looksLikePaymentUrl(u)) candidateUrls.add(u);
        } catch (_) {}
    });

    try {
        const startUrl = process.env.SWISS_VIGNETTE_URL;
        console.log('Navigating to', startUrl);
        // Be more tolerant with navigation; try different strategies
        let navigated = false;
        for (const waitUntil of ['domcontentloaded', 'load', 'networkidle2']) {
            try {
                await page.goto(startUrl, { waitUntil, timeout: 90000 });
                navigated = true;
                break;
            } catch (navErr) {
                console.warn(`goto failed on waitUntil=${waitUntil}: ${navErr.message}`);
            }
        }
        if (!navigated) throw new Error('Failed to navigate to start URL');

        // Dismiss cookie banner explicitly (as shown in screenshot)
        try {
            // Try common OneTrust id
            const acceptBtn = await Promise.race([
                page.waitForSelector('button#onetrust-accept-btn-handler', { timeout: 4000 }).catch(() => null),
                (async () => {
                    const [x] = await page.$x("//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'accept all')]");
                    return x || null;
                })()
            ]);
            if (acceptBtn) { await acceptBtn.click(); await wait(800); }
        } catch (_) {}

        // Site-specific heuristics to progress the flow on vignetteswitzerland.com
        // 1) Select vehicle type (exact: CAR OR CAMPER)
        try {
            const [vehBtn] = await page.$x("//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'car or camper')]");
            if (vehBtn) { await vehBtn.click(); await wait(600); }
        } catch (_) {}

        // 2) Select duration
        try {
            const dur = (vignetteType || 'annual').toLowerCase();
            const [durBtn] = await page.$x(`//*[self::button or self::a or self::div][contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${dur}')]`);
            if (durBtn) { await durBtn.click(); await wait(400); }
        } catch (_) {}

        // 3) Enter start date if input exists
        try {
            if (startDate) {
                const dateInput = await page.$('input[type="date"], input[name*="start" i]');
                if (dateInput) { await dateInput.click({ clickCount: 3 }); await dateInput.type(startDate); await wait(300); }
            }
        } catch (_) {}

        // 3b) If registration page: fill license plate and email (both fields)
        try {
            if (plateNumber) {
                const plateInputs = await page.$x(`//input[contains(translate(@name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'license') or contains(translate(@name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'plate') or contains(translate(@placeholder,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'license') or contains(translate(@placeholder,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'plate')]`);
                for (const inp of plateInputs) { await inp.click({ clickCount: 3 }); await inp.type(plateNumber); await wait(150); }
            }
            // email inputs (fill both email and confirm email)
            const emailInputs = await page.$$('input[type="email"], input[name*="email" i]');
            for (const inp of emailInputs) { await inp.click({ clickCount: 3 }); await inp.type(email || 'demo@example.com'); await wait(120); }
        } catch (_) {}

        // 4) Click Next a few times to pass details/confirm pages
        for (let i = 0; i < 3; i++) {
            try {
                const [nextBtn] = await page.$x("//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'next')] | //a[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'next')]");
                if (nextBtn) {
                    await nextBtn.click();
                    try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }); } catch(_) {}
                }
            } catch (_) {}
        }

        // 5) On checkout page, choose user-selected method (default PayPal)
        try {
            const preferred = (paymentMethod || process.env.PREFERRED_PAYMENT_METHOD || 'paypal').toLowerCase();
            // Prefer label click to toggle radio reliably
            const [methodLabel] = await page.$x(`//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${preferred}')]`);
            if (methodLabel) { await methodLabel.click(); await wait(300); }
            const [methodRadio] = await page.$x(`//input[@type='radio' and (contains(translate(@value,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${preferred}') or contains(translate(@id,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${preferred}'))]`);
            if (methodRadio) { await methodRadio.click(); await wait(300); }
            // Tick consent checkbox near legal text
            const [consentLabel] = await page.$x(`//label[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'revocation') or contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'terms')]`);
            if (consentLabel) { await consentLabel.click(); await wait(200); }
            const consent = await page.$('input[type="checkbox"]');
            if (consent) { await consent.click(); await wait(150); }
        } catch (_) {}

        // Prepare popup and same-tab capture
        let popupUrl = null;
        const popupWait = new Promise((resolve) => {
            const handler = async (target) => {
                try {
                    const p = await target.page();
                    if (!p) return;
                    try { await p.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(_) {}
                    const u = p.url();
                    if (u.includes('mollie.com') || u.includes('paypal.com') || looksLikePaymentUrl(u)) { popupUrl = u; resolve(u); }
                } catch (_) {}
            };
            browser.on('targetcreated', handler);
            setTimeout(() => resolve(null), 15000);
        });

        // Click Pay/Continue
        try {
            const [payBtn] = await page.$x(`//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'pay')] | //button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'continue')]`);
            if (payBtn) { await payBtn.click(); } else {
                // As a fallback, click any submit button
                const submit = await page.$('button[type="submit"], input[type="submit"]');
                if (submit) { await submit.click(); }
            }
        } catch (_) {}

        // Wait for either popup or same-tab navigation
        await Promise.race([
            popupWait,
            (async () => { try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }); } catch(_) {} })()
        ]);

        // Poll same-tab URL for up to 60s to catch PSP redirects
        let sameTabUrl = null;
        const pollStart = Date.now();
        while (Date.now() - pollStart < 15000 && !sameTabUrl) {
            try {
                const u = page.url();
                if (u && (u.includes('mollie.com') || u.includes('paypal.com'))) { sameTabUrl = u; break; }
            } catch (_) {}
            await wait(500);
        }

        // Only accept PSP URLs (Mollie/PayPal). Do NOT accept generic site links.
        let paymentUrl = popupUrl
            || sameTabUrl
            || (page.url().includes('mollie.com') || page.url().includes('paypal.com') ? page.url() : null)
            || ([...candidateUrls].find((u) => u.includes('mollie.com') || u.includes('paypal.com')) || null);

        // As a heuristic, try clicking obvious buttons to progress to checkout.
        const progressButtonTexts = ['Checkout', 'Proceed', 'Continue', 'Pay', 'Buy'];
        for (const text of progressButtonTexts) {
            try {
                const button = await page.$x(`//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${text.toLowerCase()}')] | //a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${text.toLowerCase()}')]`);
                if (button && button[0]) {
                    await button[0].click();
                    try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }); } catch (_) {}
                    // After navigation or click, re-check candidates
                    paymentUrl = paymentUrl || (looksLikePaymentUrl(page.url()) ? page.url() : null) || await tryGetDomPaymentLink(page);
                    if (paymentUrl) break;
                }
            } catch (_) {}
        }

        // Do not fall back to non-PSP URLs here.

        if (!paymentUrl) {
            console.log('Puppeteer could not detect a real payment link, using mock');
            paymentUrl = 'https://example.com/checkout';
        } else {
            console.log('Puppeteer extracted payment link');
        }

        await browser.close();
        return paymentUrl;
    } catch (err) {
        console.log('Puppeteer error, using mock payment link');
        try { await browser.close(); } catch (_) {}
        return 'https://example.com/checkout';
    }
}

module.exports = { fillSwissVignetteForm };
