const nodemailer = require('nodemailer');

/**
 * Email utility for sending confirmation emails
 * This is a simplified version for demo purposes
 */

// Create a mock email transporter (in production, you'd configure real SMTP)
const createTransporter = () => {
  // For demo purposes, we'll use a mock transporter
  // In production, configure with real SMTP settings
  return {
    sendMail: async (mailOptions) => {
      console.log('📧 Mock email sent:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        text: mailOptions.text
      });
      return { messageId: 'mock-' + Date.now() };
    }
  };
};

/**
 * Send confirmation email
 * @param {string} to - Recipient email address
 * @param {string} message - Email message content
 */
async function sendConfirmationEmail(to, message) {
  try {
    console.log(`📧 Sending confirmation email to: ${to}`);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: 'noreply@vignette-bot.com',
      to: to,
      subject: 'Swiss Vignette Order Confirmation',
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Swiss Vignette Order Confirmation</h2>
          <p>Thank you for your order!</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            ${message}
          </div>
          <p style="color: #666; font-size: 14px;">
            This is an automated message from the Swiss Vignette Bot.
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    // Don't throw error - email failure shouldn't break the main flow
    return { error: error.message };
  }
}

/**
 * Send error notification email
 * @param {string} to - Recipient email address
 * @param {string} error - Error message
 */
async function sendErrorEmail(to, error) {
  try {
    console.log(`📧 Sending error notification to: ${to}`);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: 'noreply@vignette-bot.com',
      to: to,
      subject: 'Swiss Vignette Order Error',
      text: `An error occurred while processing your vignette order: ${error}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Swiss Vignette Order Error</h2>
          <p>We encountered an issue while processing your order.</p>
          <div style="background: #ffebee; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
            <strong>Error:</strong> ${error}
          </div>
          <p>Please try again or contact support if the issue persists.</p>
          <p style="color: #666; font-size: 14px;">
            This is an automated message from the Swiss Vignette Bot.
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Error email sent successfully:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ Error sending error email:', error.message);
    return { error: error.message };
  }
}

module.exports = {
  sendConfirmationEmail,
  sendErrorEmail
};
