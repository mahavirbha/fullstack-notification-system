# 📱 Build Android APK - Step by Step

## ✅ Current Status
- ✅ EAS CLI installed and configured
- ✅ Logged in as: **mahavirbha**
- ✅ EAS project ID configured in app.json
- ✅ eas.json build configuration created

## 🚀 Run These Commands to Build APK

### Step 1: Open Terminal in Mobile Folder
```powershell
cd c:\dev\notif\mobile
```

### Step 2: Build Android APK (Cloud Build)
```powershell
eas build --platform android --profile preview
```

**What happens:**
1. EAS uploads your project to Expo servers
2. Builds APK in the cloud (~10-15 minutes)
3. Shows progress and download link when complete

**Expected prompts:**
- "Generate a new Android Keystore?" → **Yes** (first time only)
- This creates signing credentials automatically

### Step 3: Wait for Build
```
✔ Build completed!
📦 Download: https://expo.dev/artifacts/eas/...

Or visit: https://expo.dev/accounts/mahavirbha/projects/notification-system/builds
```

### Step 4: Download APK
- Click the download link from terminal, OR
- Visit EAS dashboard: https://expo.dev/accounts/mahavirbha/projects/notification-system/builds
- Download the `.apk` file

### Step 5: Install on Android Device

**Method A: Direct Download on Phone**
1. Scan QR code shown in EAS dashboard
2. Download APK directly on your Android device
3. Install (enable "Install from Unknown Sources" if prompted)

**Method B: Transfer via USB**
1. Download APK to your computer
2. Connect Android phone via USB
3. Copy APK to phone storage
4. On phone: Open Files app → tap APK → Install

**Method C: Cloud Storage**
1. Upload APK to Google Drive / Dropbox
2. Open link on Android device
3. Download and install

---

## 📋 Alternative: Local Build (If Cloud Build Fails)

If you prefer building locally with Android Studio:

### Prerequisites:
```powershell
# Install Android Studio first
# Then set environment variables:
ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
```

### Build Commands:
```powershell
cd c:\dev\notif\mobile

# Generate native Android folder
npx expo prebuild --platform android

# Build APK
cd android
.\gradlew.bat assembleRelease

# APK location:
# android\app\build\outputs\apk\release\app-release.apk
```

---

## 🔍 Check Build Status

### View all builds:
```powershell
eas build:list
```

### View specific build:
```powershell
eas build:view [BUILD_ID]
```

### Download specific build:
```powershell
eas build:download [BUILD_ID]
```

---

## 🎯 What to Expect

### Build Output:
- **File**: `app-preview-*.apk`
- **Size**: ~40-60 MB
- **Version**: 1.0.0 (from app.json)
- **Package**: com.notificationsystem.app

### Features Included:
✅ Push notifications (FCM)
✅ Real-time WebSocket updates
✅ User management
✅ Notification creation and viewing
✅ Search and pagination
✅ Multi-device support

### Backend Connection:
✅ Pre-configured to connect to production backend:
- API: https://fullstack-notification-system-production.up.railway.app

---

## 🐛 Troubleshooting

### "Build failed - credentials error"
```powershell
# Clear and regenerate credentials
eas build --platform android --profile preview --clear-credentials
```

### "Project not configured"
```powershell
# Reinitialize project
eas init
```

### "API URL not found"
Check `mobile/services/api.js` - should use production URL.

### APK won't install
- Enable "Install from Unknown Sources" in Android settings
- Check minimum Android version (should be Android 5.0+)

---

## 📊 Build Time Estimate

- **Upload**: 1-2 minutes
- **Build**: 8-12 minutes
- **Total**: ~10-15 minutes

Free tier: 30 builds/month (more than enough for testing!)

---

## ✨ After Installation

### Test Checklist:
1. **Launch app** - Should load without crashes
2. **Create/Select user** - Test user management
3. **Send notification** - Create test notification
4. **View notifications** - Check list view
5. **Search** - Test search functionality
6. **Push notifications** - Send push, verify device receives
7. **Real-time updates** - Verify WebSocket connection

---

## 🎉 Next Steps

Once APK is working:

1. **Share with testers**: Send APK to team members
2. **Gather feedback**: Test on different Android devices
3. **Iterate**: Fix bugs, add features
4. **Prepare for Play Store**: Build production AAB when ready

---

## 📞 Support

- **EAS Builds Dashboard**: https://expo.dev/accounts/mahavirbha/projects/notification-system/builds
- **Expo Documentation**: https://docs.expo.dev/build/introduction/
- **Discord**: https://chat.expo.dev/

---

## 🚀 Ready to Build!

Run this now:
```powershell
cd c:\dev\notif\mobile
eas build --platform android --profile preview
```

Then wait for the download link! 📦
