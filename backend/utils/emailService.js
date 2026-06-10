const nodemailer = require('nodemailer');
const logger = require('./logger');

// Transporter configuration - use environment variables in production
// For development, you can use Ethereal or a test Gmail account
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'test@example.com',
    pass: process.env.EMAIL_PASS || 'password',
  },
});

/**
 * Sends a low stock alert email to administrators
 * @param {Object} product - The product that is low in stock
 * @param {Array} adminEmails - List of admin email addresses
 */
const sendLowStockAlert = async (product, adminEmails) => {
  if (!adminEmails || adminEmails.length === 0) return;

  try {
    const info = await transporter.sendMail({
      from: '"Inventory System" <alerts@smart-inventory.com>',
      to: adminEmails.join(', '),
      subject: `🚨 LOW STOCK ALERT: ${product.name}`,
      text: `The following product has reached its minimum limit:
      
      Product: ${product.name}
      SKU: ${product.sku}
      Current Quantity: ${product.quantity}
      Minimum Limit: ${product.minLimit}
      
      Please restock soon.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #e11d48;">🚨 Low Stock Alert</h2>
          <p>The following product has reached its safety threshold:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f9fafb;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Product</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${product.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>SKU</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${product.sku}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Current Quantity</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #e11d48; font-weight: bold;">${product.quantity} units</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Min Limit</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${product.minLimit} units</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">Please login to the dashboard to issue a restock order.</p>
        </div>
      `,
    });

    logger.info(`Low stock email alert sent for ${product.sku} to ${adminEmails.length} admins.`);
    return info;
  } catch (error) {
    logger.error('Failed to send low stock email alert:', error);
  }
};

module.exports = { sendLowStockAlert };
