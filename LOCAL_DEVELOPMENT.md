# Local Development Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB running (local or Atlas)
- Redis running (local or cloud)
- Android Studio with emulator (for mobile app testing)

## Environment Setup

### 1. Backend Configuration

Create `backend/.env` file with:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017
DB_NAME=notification_system
REDIS_URL=redis://localhost:6379

# Optional: Email provider (pick one)
USE_MOCK_PROVIDERS=true
# SENDGRID_API_KEY=your_key
# NODEMAILER_USER=your_email
# NODEMAILER_PASS=your_password

# Optional: Push notifications
# FCM_PROJECT_ID=your_project_id
```

### 2. Mobile App Configuration

No configuration needed if using mock providers.
For real push notifications, add:
- `mobile/google-services.json` (Android)
- `mobile/GoogleService-Info.plist` (iOS)

## Running the Full Stack

### Step 1: Install Dependencies

```powershell
# Backend
cd backend
npm install

# Mobile App
cd ../mobile
npm install

# Admin Panel
cd ../task4-admin-panel
npm install

# Return to root
cd ..
```

### Step 2: Start Backend Server

```powershell
cd backend
npm start
```

**Expected Output:**
```
✅ Connected to MongoDB
✅ Redis client connected
🚀 Notification System Backend
Server: http://localhost:3000
```

**Keep this terminal open.**

### Step 3: Start Mobile App (New Terminal)

```powershell
cd mobile
npx expo start
```

**Then press:**
- `a` - to open Android emulator
- `i` - to open iOS simulator (Mac only)
- `w` - to open in web browser

**Keep this terminal open.**

### Step 4: Start Admin Panel (New Terminal)

```powershell
cd task4-admin-panel
npm run dev
```

**Expected Output:**
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

Open `http://localhost:5173` in your browser.

**Keep this terminal open.**

## Testing the System

### 1. Create a User

**Option A: Using Mobile App**
- Open the mobile app
- Go to "Users" tab
- Tap "+" to create a new user
- Enter name and email

**Option B: Using API**
```powershell
curl -X POST http://localhost:3000/api/users `
  -H "Content-Type: application/json" `
  -d '{"name": "Test User", "email": "test@example.com"}'
```

### 2. Send a Notification

**Option A: Using Mobile App**
- Go to "Create" tab
- Select the user you created
- Enter title and body
- Tap "Send Notification"

**Option B: Using Admin Panel**
- Open http://localhost:5173
- Click "Create Notification"
- Fill in the form and submit

**Option C: Using API**
```powershell
curl -X POST http://localhost:3000/api/notifications `
  -H "Content-Type: application/json" `
  -d '{"userId": "USER_ID_HERE", "type": "alert", "title": "Test", "body": "Hello!", "priority": "high"}'
```

### 3. View Notifications

**Option A: Mobile App**
- Go to "Notifications" tab
- Pull down to refresh

**Option B: Admin Panel**
- View the notification table
- Check status and delivery stats

**Option C: API**
```powershell
curl http://localhost:3000/api/notifications?userId=USER_ID_HERE
```

## Troubleshooting

### Backend won't start

**Issue:** `Cannot connect to MongoDB`
- Ensure MongoDB is running locally or update `MONGODB_URI` in `.env`

**Issue:** `Cannot connect to Redis`
- Ensure Redis is running locally or update `REDIS_URL` in `.env`
- Install Redis: `choco install redis-64` (Windows) or use Docker

### Mobile app errors

**Issue:** `Network request failed`
- Check that backend is running on `http://localhost:3000`
- For Android emulator, the app uses `http://10.0.2.2:3000` automatically

**Issue:** `Expo start fails`
- Clear cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Admin panel won't load

**Issue:** `Failed to fetch`
- Ensure backend is running
- Check browser console for CORS errors
- Verify API_URL in `task4-admin-panel/src/services/api.js`

## Quick Commands Reference

```powershell
# Start all services (requires 3 terminals)

# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Mobile App
cd mobile && npx expo start

# Terminal 3: Admin Panel
cd task4-admin-panel && npm run dev
```

## Available Endpoints

### Backend API
- Health Check: http://localhost:3000/health
- API Docs: http://localhost:3000/api
- Queue Stats: http://localhost:3000/api/queue/stats

### Mobile App
- Web Version: http://localhost:19006 (when running with Expo)

### Admin Panel
- Dashboard: http://localhost:5173

## Next Steps

- See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing scenarios
- See [FCM_SETUP.md](FCM_SETUP.md) for real push notification setup
- See [SETUP.md](SETUP.md) for production deployment
