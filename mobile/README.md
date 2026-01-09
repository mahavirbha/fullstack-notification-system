# Notification System - Mobile & Web App

**Expo-based React Native app** that works on:
- 📱 iOS & Android (native apps)
- 🌐 Web browser

## Features

### 1. Create Users (👤 Users Tab)
- Create new users via REST API
- Auto-selects user for notifications
- No database scripts needed!

### 2. Send Notifications (➕ Create Tab)
- Choose notification type (transactional, marketing, alert, system)
- Set priority (low, medium, high)
- Quick example templates
- Sends via REST API to backend

### 3. View Notifications (🔔 Notifications Tab)
- Search (400ms debounce) across title/body
- Pagination via load-more; smooth scrolling with FlatList
- Detail modal on tap (per-channel status), tap unread to mark read
- Statistics (total/unread/read)
- Pull to refresh
- Color-coded by type and priority

### 4. Mock Data & User Switching
- Generate 50–80 mock notifications (uses `/api/seed`, dev-only)
- Recent-user chips and selector; avoids manual pasting of IDs

## Getting Started

### Prerequisites
- Backend server running on `http://localhost:3000`
- Node.js installed

### Installation

```bash
cd mobile
npm install
```

### Run the App

**Web (Browser):**
```bash
npm run web
```
Opens at: http://localhost:8081

**iOS Simulator (Mac only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

**Physical Device:**
1. Install Expo Go app from App Store/Play Store
2. Run `npm start`
3. Scan the QR code
4. Ensure API base points to your LAN IP (see below)

## Usage Flow

1. **Create a User**
   - Go to "Users" tab
   - Enter email and name
   - Click "Create User"
   - User ID is automatically saved

2. **Send Notifications**
   - Go to "Create" tab
   - Select type and priority
   - Enter title and body
   - Click "Send Notification"

3. **View Notifications**
   - Go to "Notifications" tab
   - See all notifications for the user
   - Tap unread notifications to mark as read
   - Pull down to refresh

## API Configuration

- Default: `http://192.168.0.5:3000` (change to your machine's IP)
- Override via env: `EXPO_PUBLIC_API_URL`
- File: `services/api.js`

## Architecture

```
mobile/
├── App.js                           # Main navigation
├── screens/
│   ├── UsersScreen.js              # Create users
│   ├── CreateNotificationScreen.js # Send notifications
│   └── NotificationsScreen.js      # View notifications
└── services/
    └── api.js                      # REST API calls
```

## FCM Support (Coming Soon)

Currently using **pull-based** notifications:
- App fetches notifications from API
- Works for in-app notifications

To add **real push notifications**:
1. Set up Firebase project
2. Add FCM credentials to backend
3. Backend sends push after creating notification
4. Device receives even when app is closed

## Troubleshooting

**Can't connect to backend:**
- Ensure backend server is running: `cd backend && npm start`
- Check the API URL in `services/api.js`
- For mobile: use your computer's IP, not `localhost`

**"No User Selected" error:**
- Create a user first in the Users tab
- User ID is automatically saved

**Web not starting:**
- Run: `npx expo install react-dom react-native-web`
- Then: `npm run web`

## Decisions
- Pagination with load-more (mobile friendly, less network churn than infinite scroll)
- Debounced search (400ms) hits backend text index
- Detail modal keeps context without navigation
- Mock data uses `/api/seed` (dev only) and adds 300ms simulated latency for list endpoints

## Next Steps
- Add real-time updates (WS/SSE) for in-app changes
- Implement FCM for push (closed app) and deep links to detail
- Add auth and per-user scoping
- Promote API base to deployment URL and add CI checks
