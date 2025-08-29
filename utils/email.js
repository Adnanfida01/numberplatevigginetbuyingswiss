const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendConfirmationEmail(toEmail, message) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Vignette Confirmation',
        text: message,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent to', toEmail);
    } catch (err) {
        console.error('Email sending error:', err);
    }
}

module.exports = { sendConfirmationEmail };
