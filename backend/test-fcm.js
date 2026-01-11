require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

console.log('--- FCM Direct Test ---');

// Initialize Firebase
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// Test Token (This is a fake token, so we EXPECT an error)
// If credentials are wrong, we get "Auth error". 
// If credentials are right but token is wrong, we get "Invalid argument" or "Not found".
const fakeToken = 'emp_fake_token_for_testing_1234567890';

const message = {
  notification: {
    title: 'Test Push',
    body: 'This is a test to verify Firebase credentials.'
  },
  token: fakeToken
};

(async () => {
  try {
    console.log('Attempting to send to fake token...');
    await admin.messaging().send(message);
    console.log('✅ Sent! (Unexpected for a fake token)');
  } catch (error) {
    console.log('\n--- Result ---');
    if (error.code === 'messaging/registration-token-not-registered' || 
        error.code === 'messaging/invalid-argument') {
      console.log('✅ SUCCESS: Firebase accepted our credentials (but rejected the fake token as expected).');
      console.log('Error Code:', error.code);
      console.log('Message:', error.message);
    } else {
      console.error('❌ FAILURE: There is a configuration or auth issue.');
      console.error('Error Code:', error.code);
      console.error('Message:', error.message);
    }
  }
})();
