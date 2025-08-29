const express = require('express');
const router = express.Router();
const { fillSwissVignetteForm } = require('../utils/puppeteer');
const { checkStatus } = require('../mock/status');
const { sendConfirmationEmail } = require('../utils/email');

router.post('/order', async (req, res) => {
    const { plateNumber, startDate, vignetteType, vehicleType, email, paymentMethod } = req.body;

    try {
        console.log('Starting automation...');
        const paymentLink = await fillSwissVignetteForm({ plateNumber, startDate, vignetteType, vehicleType, paymentMethod, email });

        console.log('Waiting for vignette status...');
        const status = await checkStatus();

        if (status === 'valid') {
            await sendConfirmationEmail(email, `Your vignette is ready! Payment link: ${paymentLink}`);
        }

        // Show simple result page (modernized)
        res.send(`
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body{margin:0;background:#0f172a;color:#e2e8f0;font-family:Inter,system-ui,Arial,sans-serif}
                .wrap{max-width:760px;margin:40px auto;background:#111827;border:1px solid #1f2937;border-radius:14px;padding:24px 28px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
                h2{margin:0 0 8px 0;font-weight:700}
                .ok{display:inline-block;background:#10b981;color:#052e1d;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:600}
                .row{margin-top:14px}
                a.btn{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600}
                .box{background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:14px;margin-top:10px;word-break:break-all}
                .muted{color:#94a3b8;font-size:12px}
            </style>
            <div class="wrap">
                <h2>Demo Completed</h2>
                <span class="ok">Status: ${status}</span>
                <div class="row">
                    <div class="muted">Payment link</div>
                    <div class="box"><a class="btn" href="${paymentLink}" target="_blank">Open Checkout</a><br/>${paymentLink}</div>
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

    } catch (err) {
        console.error(err);
        res.send(`<h2>Error occurred</h2><p>${err.message}</p><a href="/">Go Back</a>`);
    }
});

module.exports = router;
