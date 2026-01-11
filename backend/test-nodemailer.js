require('dotenv').config();
const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('--- Nodemailer Direct Test ---');
console.log(`User: ${EMAIL_USER}`);
console.log(`Pass length: ${EMAIL_PASS ? EMAIL_PASS.length : 0}`);

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('❌ Missing EMAIL_USER or EMAIL_PASS in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const mailOptions = {
  from: EMAIL_USER,
  to: EMAIL_USER, // Send to self
  subject: 'Nodemailer Direct Test',
  text: 'If you see this, your App Password is working correctly.',
};

(async () => {
  try {
    console.log('Attempting to send...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent: ' + info.response);
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
  }
})();
