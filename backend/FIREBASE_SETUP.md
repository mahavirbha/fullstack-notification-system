# Firebase Cloud Messaging (FCM) Setup Guide

This guide will help you set up Firebase Cloud Messaging V1 API for real push notifications.

## Prerequisites

- A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
- Admin access to the Firebase project

## Step 1: Enable Firebase Cloud Messaging API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Library**
4. Search for "Firebase Cloud Messaging API"
5. Click **Enable**

## Step 2: Generate Service Account Key

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** (⚙️) → **Project settings**
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** in the confirmation dialog
7. A JSON file will be downloaded

## Step 3: Configure Backend

1. **Place the service account JSON file:**
   ```bash
   # Move the downloaded file to:
   backend/firebase-service-account.json
   ```

2. **Update environment variables in `.env`:**
   ```env
   # Enable real push notifications
   USE_MOCK_PROVIDERS=false
   
   # Path to Firebase service account JSON
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

3. **Restart backend services:**
   ```bash
   # Stop all services (Ctrl+C)
   
   # Install firebase-admin if not already installed
   npm install
   
   # Restart server
   npm run dev
   
   # In another terminal, restart worker
   npm run worker
   ```

## Step 4: Configure Mobile App

Your mobile app needs to be configured to receive FCM push notifications.

### For Expo/React Native:

1. **Install expo-notifications** (already done):
   ```bash
   npx expo install expo-notifications expo-device expo-constants
   ```

2. **Add Firebase configuration to app.json:**
   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json"
       },
       "ios": {
         "googleServicesFile": "./GoogleService-Info.plist"
       }
     }
   }
   ```

3. **Download configuration files from Firebase:**
   - **Android:** Go to Project Settings → Android app → Download `google-services.json`
   - **iOS:** Go to Project Settings → iOS app → Download `GoogleService-Info.plist`

4. **Place configuration files:**
   ```
   mobile/google-services.json        (for Android)
   mobile/GoogleService-Info.plist    (for iOS)
   ```

## Step 5: Test Push Notifications

1. **Run mobile app:**
   ```bash
   cd mobile
   npx expo start
   ```

2. **Create a user and send a notification:**
   ```bash
   # Create user
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "preferences": {
         "email": true,
         "push": true
       }
     }'

   # Send notification (replace USER_ID)
   curl -X POST http://localhost:3000/api/notifications \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "USER_ID",
       "title": "Test Notification",
       "message": "Testing FCM V1 API",
       "type": "info"
     }'
   ```

3. **Verify notification is received** on your mobile device

## Troubleshooting

### Error: "Service account not found"
- Ensure `firebase-service-account.json` exists in the backend folder
- Check that `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env` is correct

### Error: "Firebase Cloud Messaging API has not been used"
- Enable Firebase Cloud Messaging API in Google Cloud Console (Step 1)
- Wait a few minutes for API activation

### Error: "Invalid registration token"
- Device token may be expired
- Re-install the mobile app to generate a new token
- Check that the mobile app is configured with the correct Firebase project

### Mock mode is still active
- Set `USE_MOCK_PROVIDERS=false` in `.env`
- Restart backend server and worker

### No notifications received on mobile
- Ensure mobile app has notification permissions
- Check that device token is registered (check MongoDB `users` collection, `devices` array)
- Verify Firebase configuration files are in place
- Check backend logs for FCM errors

## Security Notes

⚠️ **Important:**
- Never commit `firebase-service-account.json` to version control
- The `.gitignore` file excludes this file automatically
- Treat service account credentials like passwords
- Rotate keys regularly from Firebase Console

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [FCM V1 API Documentation](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
