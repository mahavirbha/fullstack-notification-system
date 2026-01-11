# Expo Go Limitations & Solutions

## ⚠️ Push Notifications Don't Work in Expo Go (SDK 53+)

**Error you're seeing:**
```
ERROR expo-notifications: Android Push notifications (remote notifications) 
functionality provided by expo-notifications was removed from Expo Go with SDK 53.
```

## Why This Happens

Expo Go removed FCM push notification support because:
- Firebase requires app-specific configuration files (`google-services.json`)
- Expo Go is a generic app shared by all developers
- Can't include individual Firebase configs for every user's app

## Solutions

### **Option 1: Use Development Build (Recommended for Real Push)** ✅

This creates a custom version of your app with Firebase configured.

#### Setup Steps:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure project:**
   ```bash
   cd mobile
   eas build:configure
   ```

4. **Build development version:**
   ```bash
   # For Android
   eas build --profile development --platform android
   
   # For iOS (requires Apple Developer account)
   eas build --profile development --platform ios
   ```

5. **Install on device:**
   - Download APK from EAS build page
   - Install on your Android device
   - Or scan QR code to install

6. **Run with dev build:**
   ```bash
   npx expo start --dev-client
   ```

**Benefits:**
- ✅ Real FCM push notifications work
- ✅ Full native functionality
- ✅ More like production app

**Drawbacks:**
- ⏱️ Build takes 5-15 minutes
- 📱 Need to install custom app (not Expo Go)

---

### **Option 2: Test Without Real Push (For Development)** 🔧

Keep using Expo Go but understand limitations.

#### What Works:
- ✅ In-app notifications via WebSocket (real-time updates)
- ✅ Local notifications (scheduled by the app itself)
- ✅ All other app functionality

#### What Doesn't Work:
- ❌ Remote push notifications (FCM)
- ❌ Background push notifications

#### Testing Strategy:

**Use WebSocket for real-time updates (already working):**
```javascript
// When app is open, notifications arrive via WebSocket
// This works perfectly in Expo Go!
socket.on('notification:new', (notification) => {
  // Show local notification
  Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.message,
    },
    trigger: null, // Show immediately
  });
});
```

**For demonstration:**
1. Keep app open/in background
2. Send notification via API
3. App receives it via WebSocket
4. Shows as local notification

---

### **Option 3: Hybrid Approach (Best for Demo)** 🎯

Use Expo Go during development + create one production build for final demo.

**During Development:**
- Use Expo Go for fast iteration
- Test with WebSocket notifications (work great!)
- Test all other features

**For Final Demo:**
- Create one development build
- Install on device
- Demo real FCM push notifications
- Show notification working with app closed

---

## Fixing Your Current Issues

### 1. Fix Network Error

**Problem:** `http://localhost:3000` doesn't work on physical devices.

**Solution:** Update API URL in `mobile/services/api.js`:

```javascript
// Find your computer's IP address
// Windows: Open CMD, run: ipconfig
// Look for "IPv4 Address" under your WiFi/Ethernet adapter
// Example: 192.168.1.100

const API_URL = 'http://YOUR_IP_ADDRESS:3000';
// Example: const API_URL = 'http://192.168.1.100:3000';
```

**Quick IP lookup:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig | grep "inet "

# Or in Windows PowerShell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like '*Wi-Fi*'}
```

### 2. Test Current Functionality

Even without real push, you can demonstrate:

```bash
# Start backend
cd backend
npm run dev

# Start worker
npm run worker

# Start mobile (separate terminal)
cd mobile
npx expo start
```

**What works in Expo Go:**
- ✅ User creation
- ✅ Sending notifications via API
- ✅ Real-time notification list updates (WebSocket)
- ✅ Read/unread functionality
- ✅ Multi-device sync (via WebSocket)
- ✅ Local notifications when app is open

**What requires dev build:**
- ❌ Background push notifications (app closed)
- ❌ System tray notifications (app closed)
- ❌ Real FCM integration

---

## Recommendation for Your Assignment

**If deadline is soon:** Use Expo Go + WebSocket notifications (works perfectly for demo)

**If you have time (1-2 hours):** Create development build for full functionality

**For grading/demo:** Explain that full push works in production build, demo with Expo Go showing real-time WebSocket updates

---

## Quick Command Reference

### Test with Expo Go (Current Setup)
```bash
# Mobile
cd mobile
npx expo start

# Press 'a' for Android emulator
# OR scan QR code with Expo Go app
```

### Build Development Version (For Real Push)
```bash
# One-time setup
npm install -g eas-cli
eas login

# Build
cd mobile
eas build:configure
eas build --profile development --platform android

# Run after build is installed
npx expo start --dev-client
```

---

## Testing Without Real Push

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start worker
cd backend && npm run worker

# 3. Start mobile
cd mobile && npx expo start

# 4. Open app and create user

# 5. Send notification (use API)
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "title": "Test",
    "message": "WebSocket notification!",
    "type": "info"
  }'

# 6. Watch it appear in app instantly via WebSocket!
```

---

## Summary

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Real-time updates (WebSocket) | ✅ Works | ✅ Works |
| Local notifications | ✅ Works | ✅ Works |
| Background push (FCM) | ❌ Removed | ✅ Works |
| Fast development | ✅ Instant | ⚠️ Rebuild needed |
| Setup time | 0 minutes | ~15 minutes |
| Firebase integration | ❌ No | ✅ Yes |

**Bottom line:** Your app is fully functional with Expo Go for most features. Only background push notifications require a development build.
