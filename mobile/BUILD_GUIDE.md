# Mobile App APK Build Guide

This guide explains how to build an APK file for Android installation.

## 🚀 Quick Build (Recommended)

### Option 1: EAS Build (Cloud Build - Easiest)

EAS Build compiles your app in the cloud. No Android Studio or local setup needed!

#### Prerequisites:
- Expo account (free): https://expo.dev/signup
- EAS CLI installed globally

#### Steps:

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   cd mobile
   eas login
   ```
   Enter your Expo credentials.

3. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```
   
   - First time: Will ask to configure Android credentials (auto-generate is fine)
   - Build time: ~10-15 minutes
   - Output: Download link for APK file

4. **Download APK**:
   - You'll get a URL like: `https://expo.dev/artifacts/eas/...`
   - Download the APK to your computer
   - Or scan QR code with your Android device to download directly

5. **Install on Android**:
   - Transfer APK to your Android device
   - Enable "Install from Unknown Sources" in Android settings
   - Tap the APK file to install

#### Build Types:
- **preview**: APK file (easy to install, larger file)
- **production**: AAB file (for Google Play Store)

---

## 🏗️ Option 2: Local Build (Advanced)

Requires Android Studio and full Android SDK setup.

### Prerequisites:
- Android Studio installed
- Android SDK configured
- Environment variables set (`ANDROID_HOME`, etc.)

### Steps:

1. **Prebuild native Android folder**:
   ```bash
   cd mobile
   npx expo prebuild --platform android
   ```

2. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **Find APK**:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Install**:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

---

## 📦 Build Profiles Explained

From `eas.json`:

### Development Build
```json
"development": {
  "developmentClient": true,
  "distribution": "internal"
}
```
- For development/testing with Expo Dev Client
- Includes debugging tools

### Preview Build (APK)
```json
"preview": {
  "android": {
    "buildType": "apk"
  }
}
```
- **Use this for manual installation on devices**
- Generates `.apk` file
- Easy to share and install
- File size: ~40-60 MB

### Production Build (AAB)
```json
"production": {
  "android": {
    "buildType": "app-bundle"
  }
}
```
- For Google Play Store submission
- Generates `.aab` (Android App Bundle)
- Smaller download size for end users

---

## 🎯 Recommended Workflow

### For Testing/Distribution:
```bash
# Build preview APK
eas build --platform android --profile preview

# Wait for build to complete
# Download APK from Expo dashboard or CLI link
# Share APK with testers
```

### For Production (Play Store):
```bash
# Build production AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

---

## 📱 Installing APK on Android Device

### Method 1: USB Transfer
1. Connect Android device to computer
2. Copy APK to device storage
3. On device, open Files app
4. Navigate to APK file
5. Tap to install (enable "Install Unknown Apps" if prompted)

### Method 2: Direct Download
1. Upload APK to cloud storage (Google Drive, Dropbox)
2. Open link on Android device
3. Download and install

### Method 3: QR Code (EAS Build)
1. After build completes, EAS shows QR code
2. Scan with Android device camera
3. Download and install directly

---

## 🔧 Troubleshooting

### "eas: command not found"
```bash
npm install -g eas-cli
```

### "Not logged in to Expo"
```bash
eas login
```

### "Build failed - signing key error"
Let EAS auto-generate credentials:
```bash
eas build --platform android --profile preview --clear-credentials
```

### "APK won't install on device"
- Enable "Install from Unknown Sources" in Android Settings
- Check Android version compatibility (minimum SDK 21+)
- Ensure APK is not corrupted (re-download if needed)

### "App crashes on startup"
- Check API_URL in services/api.js points to production backend
- Verify google-services.json is present for push notifications
- Check Expo logs: `npx expo start` and press 'r' to reload

---

## 🚀 Build Commands Reference

```bash
# Preview APK (recommended for manual install)
eas build --platform android --profile preview

# Production AAB (for Play Store)
eas build --platform android --profile production

# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]

# Download APK locally
eas build:download [BUILD_ID]

# Both platforms (iOS + Android)
eas build --platform all --profile preview
```

---

## 📊 Expected Build Times

- **Cloud Build (EAS)**: 10-15 minutes
- **Local Build**: 5-10 minutes (after initial setup)

---

## 💰 EAS Build Pricing

- **Free tier**: 30 builds/month
- **Production**: Unlimited builds ($29/month per developer)

For testing this project, free tier is sufficient!

---

## 📝 Next Steps After Build

1. **Test APK**: Install on multiple Android devices
2. **Gather feedback**: Share with testers
3. **Iterate**: Make changes, rebuild
4. **Production**: When ready, build AAB and submit to Play Store

---

## 🔗 Useful Links

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Dashboard](https://expo.dev/accounts/mahavirbha/projects/notification-system/builds)
- [Android APK vs AAB](https://docs.expo.dev/build-reference/apk/)
- [Submitting to Play Store](https://docs.expo.dev/submit/android/)

---

## ✅ Quick Checklist

Before building:
- [ ] Update version in app.json
- [ ] Test app locally (`npm start`)
- [ ] Verify API_URL points to production
- [ ] Ensure google-services.json is present
- [ ] Commit all changes to git

Build:
- [ ] Run `eas build --platform android --profile preview`
- [ ] Wait for build completion
- [ ] Download APK

Test:
- [ ] Install on Android device
- [ ] Test all features (create user, send notification)
- [ ] Verify push notifications work
- [ ] Check real-time updates via WebSocket

Ready for production!
