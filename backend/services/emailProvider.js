// Email provider service - supports SendGrid, Nodemailer (Gmail), and mock mode
const nodemailer = require('nodemailer');
const USE_MOCK = process.env.USE_MOCK_PROVIDERS !== 'false';
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'sendgrid'; // 'sendgrid' | 'nodemailer'
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'mahavirsinhchauhan29@gmail.com';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock email provider (for testing without SendGrid)
 */
class MockEmailProvider {
  async send({ to, subject, body, html }) {
    // Simulate network latency
    await delay(1000 + Math.random() * 2000);

    // Simulate random failures (10% failure rate)
    if (Math.random() < 0.1) {
      throw new Error('Mock email delivery failed: Temporary network error');
    }

    console.log(`📧 [MOCK] Email sent to ${to}: "${subject}"`);

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider: 'mock',
      timestamp: new Date(),
    };
  }
}

/**
 * Nodemailer provider (Gmail SMTP)
 */
class NodemailerProvider {
  constructor(user, pass) {
    if (!user || !pass) {
      throw new Error('Nodemailer configuration missing (EMAIL_USER, EMAIL_PASS)');
    }
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });
    this.fromEmail = user;
  }

  async send({ to, subject, body, html }) {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        text: body,
        html: html || `<p>${body}</p>`,
      });

      console.log(`📧 [Nodemailer] Email sent to ${to}: "${subject}"`);

      return {
        success: true,
        messageId: info.messageId,
        provider: 'nodemailer',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Nodemailer error:', error.message);
      throw new Error(`Nodemailer delivery failed: ${error.message}`);
    }
  }
}

/**
 * SendGrid email provider (real integration)
 */
class SendGridProvider {
  constructor(apiKey, fromEmail) {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured');
    }
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send({ to, subject, body, html }) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(this.apiKey);

    const msg = {
      to,
      from: this.fromEmail,
      subject,
      text: body,
      html: html || `<p>${body}</p>`,
    };

    try {
      const [response] = await sgMail.send(msg);
      
      console.log(`📧 [SendGrid] Email sent to ${to}: "${subject}"`);

      return {
        success: true,
        messageId: response.headers['x-message-id'],
        provider: 'sendgrid',
        statusCode: response.statusCode,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ SendGrid error:', error.message);
      throw new Error(`SendGrid delivery failed: ${error.message}`);
    }
  }
}

/**
 * Email provider factory
 */
function createEmailProvider() {
  if (USE_MOCK) {
    console.log('📧 Using MOCK email provider');
    return new MockEmailProvider();
  } 
  
  if (EMAIL_PROVIDER === 'nodemailer') {
     console.log('📧 Using Nodemailer (Gmail) provider');
     return new NodemailerProvider(EMAIL_USER, EMAIL_PASS);
  }

  if (SENDGRID_API_KEY) {
    console.log('📧 Using SendGrid email provider');
    return new SendGridProvider(SENDGRID_API_KEY, SENDGRID_FROM_EMAIL);
  }
  
  // Fallback to mock if nothing configured
  console.log('⚠️ No email provider configured, falling back to MOCK');
  return new MockEmailProvider();
}

/**
 * Send email notification
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.userName - Recipient name
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {string} params.type - Notification type
 * @returns {Promise<Object>} Result with success, messageId, provider
 */
async function sendEmail({ to, userName, title, body, type }) {
  const provider = createEmailProvider();

  const subject = `[${type.toUpperCase()}] ${title}`;
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
        .badge { display: inline-block; padding: 5px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; color: white; }
        .badge-transactional { background-color: #2196F3; }
        .badge-marketing { background-color: #9C27B0; }
        .badge-alert { background-color: #F44336; }
        .badge-system { background-color: #607D8B; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">New Notification</h2>
        </div>
        <div class="content">
          <p>Hi ${userName || 'there'},</p>
          <div style="margin: 20px 0;">
            <span class="badge badge-${type}">${type.toUpperCase()}</span>
          </div>
          <h3>${title}</h3>
          <p>${body}</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Notification System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await provider.send({
      to,
      subject,
      body,
      html: htmlBody,
    });

    return {
      success: true,
      status: 'delivered',
      ...result,
    };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      error: error.message,
      provider: USE_MOCK ? 'mock' : 'sendgrid',
      timestamp: new Date(),
    };
  }
}

module.exports = {
  sendEmail,
};
