# External Services Setup Guide

## Required Services for End-to-End Implementation

### 1. Redis (Required)
**Purpose**: Job queue backend for Bull, pub/sub for WebSocket scaling

**Setup Options**:

**Option A: Local Redis (Recommended for Development)**
```bash
# Windows (using Chocolatey)
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
# Start Redis:
redis-server

# Verify:
redis-cli ping  # Should return "PONG"
```

**Option B: Redis Cloud (Free tier)**
- Go to: https://redis.com/try-free/
- Create free account
- Create database
- Copy connection URL: `redis://username:password@host:port`

**Environment Variable**:
```bash
REDIS_URL=redis://localhost:6379  # Local
# OR
REDIS_URL=redis://default:password@redis-12345.c1.us-east-1-1.ec2.redns.redis-cloud.com:12345  # Cloud
```

---

### 2. SendGrid (Optional - Mock Available)
**Purpose**: Email delivery provider

**Setup Options**:

**Option A: Real SendGrid**
- Go to: https://signup.sendgrid.com/
- Create free account (100 emails/day free)
- Verify email address
- Go to Settings → API Keys
- Create API key with "Mail Send" permission
- Copy key: `SG.xxxxxxxxx`

**Environment Variable**:
```bash
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=notifications@yourdomain.com
```

**Option B: Mock Mode (Default)**
- No setup needed
- Simulates email sending with realistic delays
- Always succeeds after 1-2 seconds

---

### 3. Firebase Cloud Messaging (Optional - Mock Available)
**Purpose**: Push notifications to iOS/Android devices

**Setup Options**:

**Option A: Real FCM**
- Go to: https://console.firebase.google.com/
- Create new project
- Add iOS/Android app
- Download `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
- Go to Project Settings → Cloud Messaging
- Copy Server Key or create new Service Account JSON
- Enable Cloud Messaging API in Google Cloud Console

**Environment Variable**:
```bash
FCM_SERVER_KEY=your_fcm_server_key_here
# OR
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**Option B: Mock Mode (Default)**
- No setup needed
- Simulates push sending with realistic delays
- Randomly succeeds/fails for testing

---

### 4. MongoDB Atlas (Already Set Up)
**Status**: ✅ Already configured
```bash
MONGODB_URI=mongodb+srv://notif_user:***@notificationcluster.ajsscku.mongodb.net/notification_system
```

---

## Quick Start for Development

### Minimal Setup (Mock Providers)
```bash
# 1. Install Redis locally
choco install redis-64
redis-server

# 2. Update backend/.env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://notif_user:***@notificationcluster.ajsscku.mongodb.net/notification_system
DB_NAME=notification_system
REDIS_URL=redis://localhost:6379
USE_MOCK_PROVIDERS=true  # Uses mock email/push

# 3. Install dependencies
cd backend
npm install

# 4. Start backend + workers
npm run dev          # Terminal 1: API server
npm run worker       # Terminal 2: Background workers

# 5. Start mobile app
cd ../mobile
npm install
npm start
```

### Full Production Setup (Real Providers)
```bash
# backend/.env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=notifications@yourdomain.com
FCM_SERVER_KEY=xxxxxx
USE_MOCK_PROVIDERS=false
```

---

## Verification Steps

### 1. Test Redis Connection
```bash
node -e "const redis = require('redis'); const client = redis.createClient({url: 'redis://localhost:6379'}); client.connect().then(() => console.log('✅ Redis OK')).catch(e => console.log('❌', e.message));"
```

### 2. Test Queue System
```bash
# Create notification via API
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","type":"transactional","title":"Test","body":"Test notification"}'

# Check queue stats
curl http://localhost:3000/api/queue/stats
```

### 3. Monitor Workers
```bash
# Worker logs should show:
# ✅ Worker connected to Redis
# ✅ Processing push notification job
# ✅ Processing email notification job
# 📧 Email sent successfully
# 📱 Push sent successfully
```

---

## Architecture Flow After Setup

```
Mobile App
    ↓
    POST /api/notifications
    ↓
Express API
    ├─→ Save to MongoDB (inApp: unread)
    ├─→ Enqueue push job → Bull Queue (Redis)
    ├─→ Enqueue email job → Bull Queue (Redis)
    └─→ Emit WebSocket event
            ↓
        Workers (separate process)
            ├─→ Process push job
            │   ├─→ Call FCM/Mock
            │   └─→ Update MongoDB (push: sent/delivered/failed)
            └─→ Process email job
                ├─→ Call SendGrid/Mock
                └─→ Update MongoDB (email: sent/delivered/failed)
```

---

## Troubleshooting

### Redis Connection Errors
```bash
# Check if Redis is running
redis-cli ping

# Windows: Start Redis service
redis-server

# Check port conflicts
netstat -ano | findstr :6379
```

### Queue Not Processing
- Ensure worker process is running separately from API
- Check Redis connection in worker logs
- Verify `REDIS_URL` environment variable

### WebSocket Not Connecting
- Check CORS configuration in server.js
- Verify Socket.IO versions match (server & client)
- Test with: `curl http://localhost:3000/socket.io/`

---

## Cost Estimate (Production)

| Service | Free Tier | Cost After Free |
|---------|-----------|-----------------|
| Redis Cloud | 30MB free | ~$5/month for 100MB |
| SendGrid | 100 emails/day | ~$15/month for 40k emails |
| Firebase FCM | Unlimited | Free (pay for Firebase features) |
| MongoDB Atlas | 512MB free | Already using paid tier |

**Total for Development**: $0 (all free tiers sufficient)
**Total for Production (~10k users)**: ~$20/month
