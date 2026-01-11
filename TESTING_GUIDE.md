# Testing Guide - Complete System Demonstration

This guide will help you test and demonstrate the complete notification system functionality.

## Prerequisites Checklist

- [ ] MongoDB Atlas connection working
- [ ] Redis Cloud connection working
- [ ] Node.js dependencies installed in `backend/`
- [ ] Expo/React Native dependencies installed in `mobile/`
- [ ] Mobile device or emulator ready

## Step 1: Start All Services

### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 3000
✅ MongoDB connected: notification_system
✅ Redis connected
✅ Socket.IO server initialized
📱 Using MOCK push provider
```

### Terminal 2 - Background Worker
```bash
cd backend
npm run worker
```

**Expected Output:**
```
🔄 Worker started and processing jobs...
✅ Redis connected
📧 Using MOCK email provider
📱 Using MOCK push provider
Waiting for jobs...
```

### Terminal 3 - Mobile App
```bash
cd mobile
npx expo start
```

**Expected Output:**
```
Metro waiting on exp://192.168.x.x:8081
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

## Step 2: Test Backend API (Without Mobile App)

### A. Create a Test User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser\",
    \"email\": \"test@example.com\",
    \"preferences\": {
      \"email\": true,
      \"push\": true
    }
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "679f1234abcd5678ef901234",
    "username": "testuser",
    "email": "test@example.com",
    "preferences": { "email": true, "push": true },
    "devices": [],
    "createdAt": "2026-01-09T10:30:00.000Z"
  }
}
```

**Save the `_id` - you'll need it for next steps!**

### B. Send a Notification
```bash
# Replace USER_ID with the _id from step A
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Test Notification\",
    \"message\": \"This is a test message\",
    \"type\": \"info\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "679f5678abcd1234ef905678",
    "userId": "679f1234abcd5678ef901234",
    "title": "Test Notification",
    "message": "This is a test message",
    "type": "info",
    "status": "pending",
    "channels": {
      "email": { "status": "pending" },
      "push": { "status": "pending" }
    },
    "createdAt": "2026-01-09T10:31:00.000Z"
  }
}
```

### C. Check Worker Logs

**In Terminal 2 (worker), you should see:**
```
🔄 Processing notification job 1 for user 679f1234...
📧 [MOCK] Email sent to test@example.com: "Test Notification"
📱 [MOCK] Push sent to user 679f1234...: "Test Notification"
✅ Notification 679f5678... processed successfully
  - Email: delivered (mock-email-...)
  - Push: delivered (mock-push-...)
```

### D. Verify Notification Status
```bash
# Get all notifications for the user
curl http://localhost:3000/api/users/USER_ID/notifications
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "679f5678abcd1234ef905678",
      "title": "Test Notification",
      "message": "This is a test message",
      "type": "info",
      "status": "delivered",
      "channels": {
        "email": {
          "status": "delivered",
          "messageId": "mock-email-1736419860123-abc123",
          "provider": "mock",
          "timestamp": "2026-01-09T10:31:00.123Z"
        },
        "push": {
          "status": "delivered",
          "messageId": "mock-push-1736419860456-xyz789",
          "provider": "mock",
          "timestamp": "2026-01-09T10:31:00.456Z"
        }
      },
      "read": false,
      "createdAt": "2026-01-09T10:31:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "pages": 1
  }
}
```

### E. Check Queue Statistics
```bash
curl http://localhost:3000/api/queue/stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "waiting": 0,
    "active": 0,
    "completed": 3,
    "failed": 0,
    "delayed": 0,
    "paused": 0
  }
}
```

## Step 3: Test Mobile App

### A. Launch Mobile App
1. Open Expo app on your device (scan QR code from Terminal 3)
2. Or press `a` for Android emulator / `i` for iOS simulator

**Expected UI:**
- Login screen with username/email inputs
- "Login" and "Create User" buttons

### B. Create User via Mobile
1. Enter username: `mobileuser`
2. Enter email: `mobile@example.com`
3. Click **"Create User"**

**Expected Behavior:**
- Shows success message
- Automatically logs in
- Navigates to notifications screen
- Shows empty notifications list

**Check Terminal 1 (server logs):**
```
POST /api/users 201 - 123ms
Device registered for user 679f9999...: device-abc123 (Expo token: ExponentPushToken[...])
```

### C. Send Notification to Mobile User

**In a new terminal:**
```bash
# Get the user ID from the mobile app logs or MongoDB
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"MOBILE_USER_ID\",
    \"title\": \"Welcome!\",
    \"message\": \"Your notification system is working!\",
    \"type\": \"success\"
  }"
```

**Expected Mobile App Behavior:**
1. **Notification appears in list immediately** (via WebSocket)
2. Push notification shows on device (if USE_MOCK_PROVIDERS=true, check worker logs)
3. Badge shows unread count
4. Tap notification to mark as read

### D. Test Real-Time Updates

**Open mobile app on two devices (or one device + web):**

1. Login as same user on both devices
2. Send notification via API
3. **Both devices should receive notification instantly** via WebSocket

**Expected:** Real-time sync across all connected devices

## Step 4: Test Multi-Device Support

### A. Register Multiple Devices

**Device 1 (Phone):**
- Login as `testuser`
- Device automatically registers

**Device 2 (Tablet/Emulator):**
- Login as same `testuser` on different device
- New device registers

**Verify in MongoDB:**
```bash
# Or use MongoDB Compass
curl http://localhost:3000/api/users/USER_ID
```

**Expected:**
```json
{
  "devices": [
    {
      "deviceId": "device-abc123",
      "expoPushToken": "ExponentPushToken[...]",
      "platform": "android",
      "registeredAt": "2026-01-09T10:35:00.000Z"
    },
    {
      "deviceId": "device-xyz789",
      "expoPushToken": "ExponentPushToken[...]",
      "platform": "ios",
      "registeredAt": "2026-01-09T10:36:00.000Z"
    }
  ]
}
```

### B. Send Notification to All Devices
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Multi-Device Test\",
    \"message\": \"You should receive this on all devices!\",
    \"type\": \"info\"
  }"
```

**Expected Worker Logs:**
```
🔄 Processing notification job...
📱 Sending push to 2 device(s) for user...
📱 [MOCK] Push sent to user ... : "Multi-Device Test"
📱 [MOCK] Push sent to user ... : "Multi-Device Test"
✅ Push notifications: 2 successful, 0 failed
```

**Expected Behavior:**
- Both devices receive push notification
- Both devices show notification in list via WebSocket
- Both devices can independently mark as read/unread

## Step 5: Test Different Notification Types

### A. Info Notification (Blue)
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Information\",
    \"message\": \"This is an info notification\",
    \"type\": \"info\"
  }"
```

### B. Success Notification (Green)
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Success!\",
    \"message\": \"Your action was successful\",
    \"type\": \"success\"
  }"
```

### C. Warning Notification (Yellow)
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Warning\",
    \"message\": \"Please review this action\",
    \"type\": \"warning\"
  }"
```

### D. Error Notification (Red)
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Error\",
    \"message\": \"Something went wrong\",
    \"type\": \"error\"
  }"
```

**Expected Mobile UI:**
- Each notification type has different colored icon
- Sorted by newest first
- Unread notifications are bold

## Step 6: Test Read/Unread Functionality

### A. Mark Notification as Read
```bash
curl -X PATCH http://localhost:3000/api/notifications/NOTIFICATION_ID/read \
  -H "Content-Type: application/json"
```

**Expected:**
- Notification marked as read in database
- Mobile app updates instantly via WebSocket
- Badge count decreases

### B. Mark Notification as Unread
```bash
curl -X DELETE http://localhost:3000/api/notifications/NOTIFICATION_ID/read
```

**Expected:**
- Notification marked as unread
- Badge count increases
- Mobile UI updates

### C. Mark All as Read
```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID/notifications/read-all
```

**Expected:**
- All notifications marked as read
- Badge shows 0
- All notification items lose bold styling

## Step 7: Test WebSocket Real-Time Updates

### A. Keep Mobile App Open

**Send notification via API:**
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Real-Time Test\",
    \"message\": \"This should appear instantly!\",
    \"type\": \"info\"
  }"
```

**Expected Mobile Behavior:**
- Notification appears **immediately** without refresh
- Badge count updates
- No pull-to-refresh needed

**Check Server Logs (Terminal 1):**
```
📡 Emitting notification:new to user 679f1234...
📡 Emitting notification:update to user 679f1234...
```

### B. Test Connection Handling

1. Turn off device WiFi → App shows "Disconnected"
2. Turn on WiFi → App reconnects automatically
3. Send notification while offline
4. Reconnect → Pull to refresh to see missed notifications

## Step 8: Test Queue System

### A. Send Bulk Notifications
```bash
# Send 10 notifications rapidly
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/notifications \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"USER_ID\",
      \"title\": \"Bulk Test #$i\",
      \"message\": \"Testing queue system\",
      \"type\": \"info\"
    }" &
done
wait
```

**Expected Worker Behavior:**
- Processes jobs sequentially
- No race conditions
- All notifications delivered
- Queue statistics update correctly

### B. Verify Queue Stats
```bash
curl http://localhost:3000/api/queue/stats
```

**Should show:**
- `completed` count increased by 10 (or 20 with email + push)
- `failed` should be 0
- `waiting` should be 0 (all processed)

## Step 9: Test Error Handling

### A. Invalid User ID
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"invalid123\",
    \"title\": \"Test\",
    \"message\": \"Test\",
    \"type\": \"info\"
  }"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "User not found"
}
```

### B. Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Test\"
  }"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Missing required fields: message"
}
```

### C. Invalid Notification Type
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Test\",
    \"message\": \"Test\",
    \"type\": \"invalid\"
  }"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid notification type"
}
```

## Step 10: Performance Testing

### A. Check Response Times
```bash
# Time the API response
time curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"USER_ID\",
    \"title\": \"Performance Test\",
    \"message\": \"Testing response time\",
    \"type\": \"info\"
  }"
```

**Expected:** Response time < 100ms (queue adds job, doesn't wait for processing)

### B. Check Worker Processing Time

**Watch worker logs for:**
```
⏱️  Job 123 completed in 1.234s
```

**Expected:** Each job processes in 1-3 seconds (with mock delays)

## Complete System Checklist

- [ ] Backend server starts without errors
- [ ] Worker connects and processes jobs
- [ ] Mobile app loads and allows user creation
- [ ] Device registration works (push token saved)
- [ ] API can create notifications
- [ ] Worker processes email jobs (mock)
- [ ] Worker processes push jobs (mock)
- [ ] Notifications appear in mobile app
- [ ] WebSocket delivers real-time updates
- [ ] Multi-device support works
- [ ] All notification types display correctly
- [ ] Read/unread functionality works
- [ ] Mark all as read works
- [ ] Queue statistics are accurate
- [ ] Error handling works correctly
- [ ] Multiple devices sync properly

## Troubleshooting

### Mobile app not receiving notifications
1. Check device is registered: `GET /api/users/USER_ID`
2. Verify WebSocket connection in app logs
3. Check server logs for Socket.IO events
4. Ensure USER_ID is correct

### Worker not processing jobs
1. Check Redis connection in worker logs
2. Verify queue stats: `GET /api/queue/stats`
3. Check for errors in worker terminal
4. Restart worker: `Ctrl+C` then `npm run worker`

### WebSocket not working
1. Check server logs for "Socket.IO server initialized"
2. Verify mobile app console for connection status
3. Check network connectivity
4. Try restarting both server and app

## Next Steps: Enable Real FCM

Once everything works in mock mode:
1. Follow [FIREBASE_SETUP.md](backend/FIREBASE_SETUP.md)
2. Get service account JSON
3. Set `USE_MOCK_PROVIDERS=false`
4. Restart services
5. Test real push notifications!
