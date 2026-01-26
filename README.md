# Fullstack Notification System

Complete end-to-end notification system with job queues, worker processes, provider integrations, and real-time updates.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                 │
│  📱 Mobile App (React Native)    🌐 Web App (React)             │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  REST API    │  │  WebSocket   │  │   MongoDB    │          │
│  │  Endpoints   │  │  (Socket.IO) │  │  Connection  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         ▼                 ▼                  ▼                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │         BULL QUEUES (Redis-backed)                │           │
│  │  ┌──────────────────┐  ┌──────────────────┐     │           │
│  │  │  Push Queue      │  │  Email Queue     │     │           │
│  │  └──────────────────┘  └──────────────────┘     │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORKER PROCESSES                              │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Push Worker     │  │  Email Worker    │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
│           │                     │                                │
│           ▼                     ▼                                │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  FCM/Mock Push   │  │ SendGrid/Mock    │                    │
│  │  Provider        │  │ Email Provider   │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA STORAGE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MongoDB    │  │    Redis     │  │  Job Queue   │          │
│  │  (Persist)   │  │  (Cache)     │  │  Storage     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
fullstack-notification-system/
├── backend/                      # Node.js Express API + WebSocket
│   ├── server.js                 # Main server with REST API
│   ├── queues/
│   │   └── notificationQueue.js  # Bull queue configuration
│   ├── services/
│   │   ├── emailProvider.js      # Email provider (SendGrid/Mock)
│   │   └── pushProvider.js       # Push provider (FCM V1/Mock)
│   ├── workers/
│   │   └── start.js              # Worker processes
│   ├── package.json
│   └── .env
├── mobile/                       # React Native mobile app
│   ├── screens/
│   │   ├── UsersScreen.js        # User creation & selection
│   │   ├── CreateNotificationScreen.js
│   │   └── NotificationsScreen.js  # List with real-time updates
│   ├── context/
│   │   └── UserContext.js        # User state + WebSocket
│   ├── services/
│   │   └── api.js
│   └── package.json
├── task4-admin-panel/            # React web admin panel (OPTIONAL)
│   ├── src/
│   │   ├── components/
│   │   │   ├── NotificationTable.jsx
│   │   │   └── CreateNotificationForm.jsx
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
├── task1-database/
│   └── README.md                 # Schema & indexes
├── task2-architecture/
│   └── README.md                 # Architecture diagram
├── SETUP.md                      # External services setup
├── TESTING_GUIDE.md              # Complete testing guide
└── README.md                     # This file
```

## 🌐 Live Demo

**Backend API (Deployed on Railway):**
- Health Check: https://fullstack-notification-system-production.up.railway.app/health
- API Base URL: https://fullstack-notification-system-production.up.railway.app

**Admin Panel (Deployed on Vercel):**
- Dashboard: https://fullstack-notification-system-admin-panel.mahavirbha.in/

**Mobile Web App (Deployed on Vercel):**
- Web App: https://notifications-expo-web.mahavirbha.in/

**Database:**
- MongoDB Atlas (Cloud-hosted)
- Redis Cloud (Managed instance)

> **Note:** Mobile and Admin Panel clients are configured to connect to the live backend by default. For local development, see [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md).

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16+)
2. **MongoDB Atlas** account (already configured)
3. **Redis** (local or cloud)
4. **SendGrid** API key (optional - mock available)
5. **Firebase FCM** credentials (optional - mock available)

### Step 1: Install Redis

**Windows:**
```bash
choco install redis-64
redis-server
```

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment (backend/.env)
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://notif_user:***@notificationcluster.ajsscku.mongodb.net/notification_system
DB_NAME=notification_system
REDIS_URL=redis://localhost:6379
USE_MOCK_PROVIDERS=true

# Optional real providers
SENDGRID_API_KEY=SG.your_key_here
FCM_SERVER_KEY=your_fcm_key_here
```

### Step 3: Start Backend Services

**Terminal 1 - API Server:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Worker Process:**
```bash
cd backend
npm run worker
```

### Step 4: Setup Mobile App

```bash
cd mobile
npm install
npm start
```

Then:
- Press `w` for web
- Press `a` for Android
- Press `i` for iOS
- Scan QR code for physical device

### Step 5: Setup Admin Panel (OPTIONAL)

```bash
cd task4-admin-panel
npm install
npm run dev
```

Open browser: `http://localhost:3001`

## 🔧 How It Works

### 1. Notification Creation Flow

```
User sends notification
    ↓
POST /api/notifications
    ├─→ Save to MongoDB (inApp: unread)
    ├─→ Enqueue push job → Bull Queue
    ├─→ Enqueue email job → Bull Queue
    └─→ Emit WebSocket event → Mobile client updates instantly
            ↓
Workers pick up jobs from Redis queue
    ├─→ Push Worker
    │   ├─→ Calls FCM/Mock provider
    │   └─→ Updates MongoDB: push: pending → sent → delivered/failed
    └─→ Email Worker
        ├─→ Calls SendGrid/Mock provider
        └─→ Updates MongoDB: email: pending → sent → delivered/failed
```

### 2. Real-Time Updates

- Mobile app connects to WebSocket on launch
- Subscribes to user-specific room: `user:{userId}`
- Server emits events:
  - `notification:created` - New notification
  - `notification:updated` - Status change
- Mobile auto-refreshes list when event received

### 3. Job Queue & Workers

- **Bull + Redis** for reliable job processing
- **Automatic retries** with exponential backoff (3 attempts)
- **Priority queuing** based on notification priority
- **Graceful failure handling** with error logging

### 4. Provider System

**Mock Mode (Default):**
- Simulates realistic delays (1-2 seconds)
- Random failures for testing (10-15% failure rate)
- No external API keys needed

**Production Mode:**
- Real SendGrid email delivery
- Real FCM push notifications
- Set `USE_MOCK_PROVIDERS=false` in `.env`

## 📡 API Endpoints

### Notifications
- `POST /api/notifications` - Create notification (enqueues jobs)
- `GET /api/notifications?userId={id}` - List notifications
- `GET /api/notifications/:id` - Get single notification
- `PATCH /api/notifications/:id/read` - Mark as read
- `GET /api/stats?userId={id}` - Get notification statistics
- `POST /api/seed` - Generate mock notifications (dev only)

### Users
- `POST /api/users` - Create user
- `GET /api/users` - List users (with pagination)

### Queue Monitoring
- `GET /api/queue/stats` - Queue statistics (jobs pending/active/completed/failed)

### WebSocket Events
- `subscribe` - Join user room
- `unsubscribe` - Leave user room
- `notification:created` - New notification event
- `notification:updated` - Status update event

## 🧪 Testing the System

### 1. Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### 2. Send Notification
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_FROM_STEP_1",
    "type": "transactional",
    "title": "Test Notification",
    "body": "This is a test",
    "priority": "high"
  }'
```

### 3. Monitor Queue
```bash
curl http://localhost:3000/api/queue/stats
```

Expected output:
```json
{
  "success": true,
  "stats": {
    "push": {
      "waiting": 0,
      "active": 0,
      "completed": 5,
      "failed": 1
    },
    "email": {
      "waiting": 0,
      "active": 0,
      "completed": 4,
      "failed": 2
    }
  }
}
```

### 4. Check Worker Logs

Worker terminal should show:
```
📱 Processing push job 1 for notification 673abc...
✅ Push delivered for notification 673abc...
📧 Processing email job 2 for notification 673abc...
✅ Email delivered for notification 673abc...
```

## 🎨 Mobile Features

### User Management
- Create users with email/name
- Select current user (synced across all tabs)
- Visual user picker with avatars

### Send Notifications
- Select notification type (transactional, marketing, alert, system)
- Set priority (low, medium, high)
- Quick templates for common notifications
- Shows selected recipient at top

### View Notifications
- **Search** with 400ms debounce
- **Pagination** (load more + pull to refresh)
- **Real-time updates** via WebSocket
- **Channel status badges** (📱 push, 📧 email)
  - Pending (yellow)
  - Sent (blue)
  - Delivered (green)
  - Failed (red)
- **Detail modal** with full channel status
- **Statistics** (total/unread/read)
- **Mock data generator** (80 notifications)

## 🔍 Monitoring & Debugging

### Check Redis Connection
```bash
redis-cli ping  # Should return "PONG"
```

### Monitor Redis Keys
```bash
redis-cli keys "bull:*"
```

### Watch Queue in Real-Time
```bash
redis-cli monitor
```

### Check MongoDB Connection
```bash
# Already working - check server startup logs
```

### WebSocket Connection Test
Open browser console on mobile web:
```javascript
const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('Connected'));
socket.emit('subscribe', 'USER_ID');
```

## 📊 Performance & Scaling

### Current Capacity
- **Queue throughput**: ~1000 jobs/second (Redis)
- **WebSocket connections**: ~10k concurrent (Socket.IO default)
- **MongoDB**: Optimized with indexes

### Scaling Options
1. **Horizontal scaling**: Run multiple worker processes
2. **Redis clustering**: For queue persistence
3. **MongoDB replicas**: For read scaling
4. **Load balancer**: For API servers
5. **Socket.IO adapter**: Redis pub/sub for multi-server WebSocket

## 🐛 Troubleshooting

### "Redis connection failed"
- Ensure Redis is running: `redis-cli ping`
- Check REDIS_URL in .env
- On Windows, Redis service may need manual start

### "Queue jobs not processing"
- Verify worker process is running (Terminal 2)
- Check worker logs for errors
- Ensure Redis is accessible from worker

### "WebSocket not connecting"
- Check Socket.IO client version matches server
- Verify API_URL in mobile app
- Check CORS configuration in server.js

### "Notifications not appearing in mobile"
- Verify user is selected (Users tab)
- Check WebSocket connection (logs)
- Pull to refresh manually
- Check API endpoint in mobile/services/api.js

## 📝 Assignment Deliverables

✅ **Task 1: Database Design**
- [task1-database/README.md](task1-database/README.md) - Complete schema + 3 indexes

✅ **Task 2: System Architecture**
- [task2-architecture/README.md](task2-architecture/README.md) - Architecture diagram + flow

✅ **Task 3: React Native Mobile App**
- Full implementation with all required features
- [mobile/README.md](mobile/README.md) - Run instructions

✅ **Bonus: End-to-End Implementation**
- Job queues with Bull + Redis
- Worker processes for background jobs
- Email provider (SendGrid + mock)
- Push provider (FCM + mock)
- Real-time WebSocket updates
- Queue monitoring dashboard

## 🎯 Key Technical Decisions

1. **Bull over Agenda**: Better Redis integration, built-in retries, priority queuing
2. **Socket.IO over native WebSocket**: Auto-reconnection, room-based subscriptions, fallback to polling
3. **Mock providers by default**: Enables testing without external accounts
4. **Separate worker process**: Decouples job processing from API, enables horizontal scaling
5. **React Context for user state**: Syncs user selection across all tabs
6. **Channel status tracking**: Per-channel status (push/email/inApp) for granular monitoring

## 📚 Documentation

- [SETUP.md](SETUP.md) - External services setup (Redis, SendGrid, FCM)
- [task1-database/README.md](task1-database/README.md) - Database schema
- [task2-architecture/README.md](task2-architecture/README.md) - System architecture
- [backend/README.md](backend/README.md) - Backend API documentation
- [mobile/README.md](mobile/README.md) - Mobile app documentation

## 🚀 Production Deployment

### Backend
1. Deploy API server (Heroku, AWS, DigitalOcean)
2. Deploy worker process (same server or separate)
3. Use managed Redis (Redis Cloud, AWS ElastiCache)
4. Enable real providers (SendGrid, FCM)
5. Add monitoring (Sentry, Datadog)

### Mobile
1. Build production APK/IPA
2. Update API_URL to production server
3. Publish to App Store / Play Store
4. Or deploy web version (Vercel, Netlify)

## 📄 License

MIT

## 👤 Author

Developed as technical assignment for Fullstack React Native Developer position.
