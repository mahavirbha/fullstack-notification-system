# FCM Push Notifications Setup

## ✅ What Was Implemented

### Backend Changes:
1. **User Model Updated** - Added `deviceToken` field to store FCM device tokens
2. **API Endpoint** - Added `PUT /api/users/:userId/device-token` to register device tokens
3. **Worker Enhancement** - Worker now fetches user's device token before sending push
4. **Push Provider** - Updated to:
   - Use actual FCM device tokens for real mode
   - Gracefully skip if no device token (instead of failing)
   - Keep mock mode working as before

### Mobile App Changes:
1. **Dependencies Added**:
   - `expo-notifications` - Expo's push notification library
   - `expo-device` - Device detection
2. **Push Service Created** (`services/pushNotifications.js`):
   - Registers for push permissions
   - Gets FCM device token (Android) or Expo token (iOS)
   - Sends token to backend API
   - Sets up notification listeners
3. **UserContext Updated**:
   - Auto-registers for push notifications when user logs in
   - Handles received notifications
   - Handles tapped notifications
4. **App Configuration** (`app.json`):
   - Added notification permissions for iOS and Android
   - Added expo-notifications plugin

---

## 🚀 How to Test

### Option 1: Mock Mode (No FCM Key Required) ✅
**Current default - works immediately!**

1. **Install dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Start all services**:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Worker  
   cd backend
   npm run worker

   # Terminal 3: Mobile
   cd mobile
   npm start
   ```

3. **Test flow**:
   - Create user in Users tab
   - Send notification with Push channel
   - Worker simulates FCM (no actual token needed)
   - Status updates in real-time

**Mock mode behavior:**
- Simulates device registration ✅
- Simulates FCM API calls ✅
- Shows realistic delays and failures (15% failure rate) ✅
- Updates status: pending → sent → delivered ✅
- **No actual push to device** ❌

---

### Option 2: Real FCM (Sends Actual Push Notifications) 🔥

#### Prerequisites:
1. **Physical Android device** (push notifications don't work on emulator)
2. **Expo Go app** installed on device
3. **Firebase project** with FCM enabled

#### Step 1: Get FCM Server Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create/select your project
3. Project Settings → Cloud Messaging tab
4. Copy the **Server key** (starts with `AAAA...`)

#### Step 2: Configure Backend
Update `backend/.env`:
```bash
USE_MOCK_PROVIDERS=false
FCM_SERVER_KEY=AAAA[your-actual-key-here]
```

#### Step 3: Download google-services.json (Android Only)
1. In Firebase Console → Project Settings
2. Add Android app or download existing
3. Package name: `com.notificationsystem.app`
4. Download `google-services.json`
5. Place in `mobile/google-services.json`

#### Step 4: Run on Physical Device
```bash
cd mobile
npm install

# For Android
npx expo start
# Then press 'a' to open on connected Android device
# OR scan QR code with Expo Go app
```

#### Step 5: Test Real FCM
1. Open app on physical device
2. Create/select a user
3. **Device token will auto-register** (check logs: "Device token registered with backend")
4. Send notification with Push channel
5. **Receive actual push notification on device** 🎉

---

## 🔍 Verification

### Check Device Token Registration:
```bash
# Get user from MongoDB
curl http://localhost:3000/api/users

# Should see deviceToken field populated:
{
  "_id": "...",
  "email": "test@example.com",
  "name": "Test User",
  "deviceToken": "ExponentPushToken[...]" or "FCM-token-string"
}
```

### Check Worker Logs:
```
📱 Processing push job 1 for notification 678...
📱 [MOCK] Push sent to user 678: "Test Notification"
✅ Push delivered for notification 678
```

With real FCM:
```
📱 Processing push job 1 for notification 678...
📱 [FCM] Push sent: "Test Notification"
✅ Push delivered for notification 678
```

---

## 🛠️ Troubleshooting

### "No device token registered"
- **Mock mode**: This is normal - token registration is skipped in mock
- **Real FCM**: Device token failed to register
  - Check device permissions granted
  - Check internet connection
  - Check backend logs for API errors

### "Push notifications only work on physical devices"
- **Solution**: Use real Android/iOS device, not simulator

### "Device token required for FCM"
- **Issue**: Real FCM mode but user has no token
- **Solution**: 
  1. User needs to open app once to register token
  2. Or keep `USE_MOCK_PROVIDERS=true` for users without tokens

### FCM API errors (401, 403)
- Check `FCM_SERVER_KEY` is correct
- Ensure Firebase project has FCM enabled
- Check `google-services.json` package name matches `app.json`

---

## 📊 Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     REAL FCM FLOW                               │
└─────────────────────────────────────────────────────────────────┘

1. User opens mobile app
   ↓
2. UserContext registers for push notifications
   ↓
3. Expo gets FCM device token from Firebase
   ↓
4. Mobile app sends token to: PUT /api/users/:userId/device-token
   ↓
5. Backend stores token in MongoDB users collection
   ↓
6. User sends notification (Create tab)
   ↓
7. Backend enqueues push job with userId
   ↓
8. Worker fetches user from MongoDB (gets deviceToken)
   ↓
9. Worker calls FCM API with actual device token
   ↓
10. Firebase delivers push notification to device
    ↓
11. User receives push on lock screen / notification tray
    ↓
12. Tapping notification opens app
```

---

## 🔒 Security Notes

1. **FCM Server Key**: Keep this secret! Don't commit to git
2. **Device Tokens**: 
   - Expire/refresh periodically
   - Should be re-registered on app updates
   - Current implementation: registers once per user login
3. **Production**: Use environment variables for sensitive keys

---

## ✨ Features Implemented

- ✅ Device token registration (automatic)
- ✅ Permission handling (iOS + Android)
- ✅ Foreground notification display
- ✅ Background notification delivery
- ✅ Notification tap handling
- ✅ Real-time status updates (via WebSocket)
- ✅ Graceful fallback (users without tokens)
- ✅ Mock mode for testing without FCM
- ✅ Support for both Expo tokens (iOS) and FCM tokens (Android)

---

## 🎯 Next Steps (Optional Enhancements)

1. **Token Refresh**: Re-register token periodically
2. **Multi-Device**: Support multiple devices per user
3. **Rich Notifications**: Add images, actions, categories
4. **Notification Channels**: Android notification categories
5. **Analytics**: Track delivery rates, open rates
6. **Badge Management**: Update app icon badge count
7. **iOS APNs**: Direct Apple Push Notification service integration
