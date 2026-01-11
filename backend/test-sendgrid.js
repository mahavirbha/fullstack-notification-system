require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const TO_EMAIL = 'robow877@gmail.com'; // Trying a generic one or the from address for testing

console.log('--- SendGrid Test Script ---');
console.log(`API Key present: ${!!API_KEY}`);
console.log(`From Email: ${FROM_EMAIL}`);

if (!API_KEY) {
    console.error('❌ Missing SENDGRID_API_KEY in .env');
    process.exit(1);
}

sgMail.setApiKey(API_KEY);

const msg = {
  to: FROM_EMAIL, // Send to self to verify
  from: FROM_EMAIL,
  subject: 'Test Email from Notification System Debugger',
  text: 'If you receive this, SendGrid configuration is working correctly.',
  html: '<strong>If you receive this, SendGrid configuration is working correctly.</strong>',
};

(async () => {
  try {
    console.log(`Attempting to send email to ${FROM_EMAIL}...`);
    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully!');
    console.log('Status Code:', response[0].statusCode);
    console.log('Headers:', response[0].headers);
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
    if (error.response) {
      console.error('Body:', error.response.body);
    }
  }
})();
