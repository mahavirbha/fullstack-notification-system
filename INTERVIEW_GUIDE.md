# Interview Guide - Fullstack Notification System

A comprehensive guide covering common interview questions about this project with clear, easy-to-understand answers.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Database Design](#database-design)
4. [Backend Development](#backend-development)
5. [Frontend/Mobile Development](#frontendmobile-development)
6. [Job Queue & Workers](#job-queue--workers)
7. [Real-Time Features](#real-time-features)
8. [Scalability & Performance](#scalability--performance)
9. [Deployment & DevOps](#deployment--devops)
10. [Problem-Solving](#problem-solving)

---

## Project Overview

### Q: Can you give me a high-level overview of this project?

**A:** This is a full-stack notification system that sends messages to users via multiple channels (Push, Email, and In-App). It's built with:
- **Backend**: Node.js + Express + MongoDB + Redis
- **Mobile**: React Native + Expo (iOS/Android/Web support)
- **Admin Panel**: React + Vite web dashboard
- **Architecture**: Decoupled job queue system with background workers

The system handles notification creation, queues slow operations (email/push), processes them asynchronously in background workers, and provides real-time status updates to clients via WebSocket.

### Q: What problem does this system solve?

**A:** It solves three main problems:
1. **Non-blocking API**: Sending emails and push notifications is slow (1-5 seconds). The system uses job queues so the API responds immediately without waiting.
2. **Reliability**: With job queues and automatic retries, notifications won't be lost if a provider fails temporarily.
3. **Real-time tracking**: Users can see delivery status in real-time as notifications move through pending → sent → delivered states.

### Q: Why did you build it this way?

**A:** I followed production best practices:
- **Job queues** decouple slow operations from the API
- **Background workers** can scale independently from the API
- **WebSocket** provides instant updates without polling
- **Mock providers** enable testing without external accounts
- **Multi-channel tracking** allows granular status per channel (email success but push failed)

---

## System Architecture

### Q: Walk me through the flow when a user creates a notification.

**A:** Here's the complete flow:

1. **Client** calls `POST /api/notifications` with notification details
2. **API Server** immediately:
   - Validates the request
   - Saves notification to MongoDB (status: `pending` for each channel)
   - Enqueues 2 jobs: one for push, one for email (to Redis via Bull)
   - Emits WebSocket event to notify connected clients
   - Returns success response (~50ms total)
3. **Background Workers** pick up jobs from Redis:
   - **Push Worker**: Calls FCM API → updates MongoDB with status
   - **Email Worker**: Calls SendGrid API → updates MongoDB with status
4. **Real-time Update**: After each channel completes, worker emits WebSocket event
5. **Client** receives WebSocket event → auto-refreshes the notification list

Total time: API responds in <100ms, actual delivery happens in background over 1-5 seconds.

### Q: Why separate the API server and worker processes?

**A:** For scalability and reliability:
- **Independent scaling**: If emails are slow, I can add more email workers without scaling the API
- **Fault isolation**: If a worker crashes, the API stays up and jobs remain in queue
- **Resource allocation**: Workers need more CPU (processing), API needs more memory (connections)
- **Flexibility**: Can deploy workers on cheaper background job servers

### Q: How do you handle failures?

**A:** Multiple layers:
1. **Automatic retries**: Bull queue retries failed jobs 3 times with exponential backoff (5s, 30s, 5min)
2. **Status tracking**: Each failure is logged with error message in MongoDB
3. **Provider fallback**: Could add secondary email provider (Nodemailer as fallback to SendGrid)
4. **Manual retry**: Admin can view failed jobs and manually retry via queue API
5. **Alerting**: Failed jobs can trigger alerts (Sentry, Slack) in production

### Q: What happens if Redis goes down?

**A:** Two scenarios:
- **Temporary outage**: Bull auto-reconnects when Redis comes back. In-flight jobs resume.
- **Data loss**: Jobs in Redis are lost. To prevent this:
  - Use Redis persistence (AOF + RDB)
  - Or use Redis Cloud with automatic backups
  - Could also log job creation to MongoDB as backup

The API would start returning errors for new notifications until Redis reconnects.

---

## Database Design

### Q: Why MongoDB instead of PostgreSQL?

**A:** MongoDB fits this use case well:
- **Flexible schema**: Each notification has different channels enabled (push only, email only, both)
- **Nested documents**: Channel status is naturally nested (push.status, email.status)
- **Easy indexing**: Compound indexes on `userId` + `createdAt` are simple
- **Horizontal scaling**: Can shard by userId easily for millions of users

For a relational DB, I'd need separate tables for channels, making queries more complex.

### Q: Explain your notification schema.

**A:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to user
  type: 'alert',              // transactional|marketing|alert|system
  title: 'Test',
  body: 'Message...',
  priority: 'high',           // low|medium|high
  
  channels: {
    push: {
      status: 'delivered',    // pending|sent|delivered|failed
      provider: 'FCM',
      attempts: 1,
      sentAt: ISODate,
      deliveredAt: ISODate,
      error: null,
      deviceToken: 'ExponentPushToken[...]',
      deviceCount: 2,         // Multi-device support
      successCount: 2,
      failureCount: 0
    },
    email: {
      status: 'delivered',
      provider: 'SendGrid',
      attempts: 1,
      sentAt: ISODate,
      deliveredAt: ISODate,
      error: null,
      messageId: 'sg-msg-123'
    },
    inApp: {
      status: 'unread',       // unread|read
      readAt: null
    }
  },
  
  metadata: {},               // Extensible for campaign IDs, etc.
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Q: What indexes did you create and why?

**A:** Four critical indexes:

1. **`{ userId: 1, createdAt: -1 }`**
   - **Why**: User feed queries (`GET /api/notifications?userId=X`)
   - **Performance**: Enables fast pagination sorted by time
   
2. **`{ "channels.inApp.status": 1, createdAt: -1 }`**
   - **Why**: Fetch unread notifications for badge count
   - **Performance**: Quickly filter `status: "unread"`
   
3. **Text index: `{ title: "text", body: "text" }`**
   - **Why**: Search functionality in mobile app
   - **Performance**: Full-text search across title and body
   
4. **`{ type: 1, priority: 1, createdAt: -1 }`** (optional)
   - **Why**: Analytics queries grouping by type/priority
   - **Performance**: Dashboard aggregations

### Q: How do you handle multi-device support for push notifications?

**A:** Users can have multiple devices (phone + tablet). I store an array:

```javascript
{
  email: 'user@example.com',
  devices: [
    {
      deviceId: 'android-samsung-s21-123',
      deviceToken: 'ExponentPushToken[...]',
      platform: 'android',
      lastActive: ISODate
    },
    {
      deviceId: 'ios-iphone-14-456',
      deviceToken: 'ExponentPushToken[...]',
      platform: 'ios',
      lastActive: ISODate
    }
  ]
}
```

When sending push, the worker loops through all devices and sends in parallel. Status tracks `deviceCount`, `successCount`, `failureCount`.

---

## Backend Development

### Q: What are the main API endpoints?

**A:**

**Notifications:**
- `POST /api/notifications` - Create notification (enqueues jobs)
- `GET /api/notifications?userId=X&page=1` - List notifications (paginated)
- `GET /api/notifications/:id` - Get single notification
- `PATCH /api/notifications/:id/read` - Mark as read
- `GET /api/stats?userId=X` - Statistics (total/unread/read)

**Users:**
- `POST /api/users` - Create user
- `GET /api/users` - List users (paginated)
- `POST /api/users/:userId/devices` - Register device token
- `DELETE /api/users/:userId/devices/:deviceId` - Remove device

**Queue Monitoring:**
- `GET /api/queue/stats` - Queue statistics (waiting/active/completed/failed)

**Health:**
- `GET /api/health` - Health check (MongoDB, Redis, Queue status)

### Q: How do you structure your backend code?

**A:**
```
backend/
├── server.js              # Main entry: Express app, routes, Socket.IO
├── queues/
│   └── notificationQueue.js  # Bull queue configuration
├── services/
│   ├── emailProvider.js   # Email sending logic (SendGrid/Mock)
│   └── pushProvider.js    # Push sending logic (FCM/Mock)
└── workers/
    └── start.js           # Worker process that consumes jobs
```

**Separation of concerns:**
- `server.js`: HTTP routes + WebSocket + DB connection
- `queues/`: Queue setup only (enqueue/dequeue logic)
- `services/`: Provider abstractions (easy to swap providers)
- `workers/`: Job processing (separate from API)

### Q: How do you handle environment-specific configuration?

**A:** Using `.env` files with dotenv:

```bash
# Development (mock providers)
NODE_ENV=development
USE_MOCK_PROVIDERS=true

# Production (real providers)
NODE_ENV=production
USE_MOCK_PROVIDERS=false
SENDGRID_API_KEY=SG.xxx
FCM_SERVER_KEY=xxx
```

The provider services check `USE_MOCK_PROVIDERS`:
```javascript
if (process.env.USE_MOCK_PROVIDERS === 'true') {
  return mockEmailProvider;
} else {
  return sendGridProvider;
}
```

### Q: How do you validate API requests?

**A:** Simple validation in route handlers:
```javascript
app.post('/api/notifications', async (req, res) => {
  const { userId, type, title, body } = req.body;
  
  // Validation
  if (!userId || !ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }
  if (!['transactional', 'marketing', 'alert', 'system'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body required' });
  }
  
  // Process...
});
```

For production, I'd use a library like **Joi** or **express-validator**.

### Q: How do you handle CORS?

**A:** Using the `cors` middleware:
```javascript
app.use(cors()); // Allow all origins in development

// Production: restrict to specific domains
app.use(cors({
  origin: [
    'https://notifications-expo-web.mahavirbha.in',
    'https://fullstack-notification-system-admin-panel.mahavirbha.in'
  ],
  credentials: true
}));
```

---

## Frontend/Mobile Development

### Q: Why React Native + Expo?

**A:** Expo provides:
- **Cross-platform**: One codebase → iOS, Android, Web
- **Fast development**: Hot reload, no native build setup needed
- **Easy push notifications**: `expo-notifications` library
- **OTA updates**: Update app without app store approval
- **Web support**: Can deploy as progressive web app

Trade-off: Can't use all native modules, but Expo covers 95% of use cases.

### Q: How does the mobile app connect to the backend?

**A:** Two connections:

1. **HTTP REST API** (axios):
   ```javascript
   // services/api.js
   const API_URL = 'https://fullstack-notification-system-production.up.railway.app';
   
   export const createNotification = (data) => {
     return axios.post(`${API_URL}/api/notifications`, data);
   };
   ```

2. **WebSocket** (Socket.IO):
   ```javascript
   // context/UserContext.js
   const socket = io(API_URL);
   
   socket.emit('subscribe', userId);
   socket.on('notification:created', (data) => {
     // Refresh notification list
   });
   ```

### Q: How do you manage global state in the mobile app?

**A:** Using **React Context API**:

```javascript
// context/UserContext.js
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // Connect WebSocket when user changes
  useEffect(() => {
    if (currentUser) {
      const newSocket = io(API_URL);
      newSocket.emit('subscribe', currentUser._id);
      setSocket(newSocket);
    }
  }, [currentUser]);
  
  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, socket }}>
      {children}
    </UserContext.Provider>
  );
};
```

Any component can access current user and socket via `useContext(UserContext)`.

### Q: How do you implement search with debouncing?

**A:**
```javascript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

// Debounce search input
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 400);
  
  return () => clearTimeout(timer);
}, [searchQuery]);

// Fetch notifications when debounced query changes
useEffect(() => {
  fetchNotifications(debouncedQuery);
}, [debouncedQuery]);
```

User types → wait 400ms → if no more typing → search.

### Q: How do you implement pagination?

**A:** Load more pattern with FlatList:

```javascript
const [notifications, setNotifications] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  if (!hasMore) return;
  
  const response = await api.getNotifications(currentUser._id, page);
  setNotifications([...notifications, ...response.data]);
  setPage(page + 1);
  setHasMore(response.hasMore);
};

return (
  <FlatList
    data={notifications}
    onEndReached={loadMore}
    onEndReachedThreshold={0.5}
  />
);
```

### Q: How do you handle push notifications in the mobile app?

**A:** Three-step process:

1. **Request permissions**:
   ```javascript
   const { status } = await Notifications.requestPermissionsAsync();
   ```

2. **Get device token**:
   ```javascript
   const token = await Notifications.getExpoPushTokenAsync();
   ```

3. **Register with backend**:
   ```javascript
   await api.registerDevice(userId, {
     deviceToken: token.data,
     deviceId: await getDeviceId(),
     platform: Platform.OS
   });
   ```

4. **Listen for notifications**:
   ```javascript
   Notifications.addNotificationReceivedListener((notification) => {
     // App is foreground: show alert
   });
   
   Notifications.addNotificationResponseReceivedListener((response) => {
     // User tapped notification: navigate to detail
   });
   ```

---

## Job Queue & Workers

### Q: Why Bull instead of other queue libraries?

**A:** Bull is the most popular choice because:
- **Redis-backed**: Fast, reliable, persists jobs
- **Built-in retries**: Automatic exponential backoff
- **Priority queuing**: High-priority notifications processed first
- **Rate limiting**: Prevent API abuse
- **UI dashboard**: BullMQ Arena for monitoring
- **Job events**: Track job lifecycle (completed, failed, progress)

Alternatives: BullMQ (newer), Agenda (MongoDB-backed), AWS SQS (cloud).

### Q: How do you configure the queues?

**A:**
```javascript
// queues/notificationQueue.js
const Queue = require('bull');

const pushQueue = new Queue('push', process.env.REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,                    // Retry 3 times
    backoff: {
      type: 'exponential',          // 5s, 30s, 5min
      delay: 5000
    },
    removeOnComplete: 100,          // Keep last 100 completed
    removeOnFail: 200               // Keep last 200 failed
  }
});

const emailQueue = new Queue('email', process.env.REDIS_URL, { /* same */ });
```

### Q: How does the worker process jobs?

**A:**
```javascript
// workers/start.js
const { pushQueue, emailQueue } = require('../queues/notificationQueue');
const pushProvider = require('../services/pushProvider');
const emailProvider = require('../services/emailProvider');

// Process push jobs
pushQueue.process(async (job) => {
  const { notificationId, userId, title, body } = job.data;
  
  console.log(`📱 Processing push job ${job.id}`);
  
  try {
    // Get user from DB to get device token
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });
    
    // Send push notification
    const result = await pushProvider.send({
      token: user.deviceToken,
      title,
      body
    });
    
    // Update notification status in DB
    await notificationsCollection.updateOne(
      { _id: ObjectId(notificationId) },
      { $set: { 'channels.push.status': 'delivered' } }
    );
    
    console.log(`✅ Push delivered for notification ${notificationId}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Push failed for notification ${notificationId}:`, error);
    
    // Update status to failed
    await notificationsCollection.updateOne(
      { _id: ObjectId(notificationId) },
      { $set: { 'channels.push.status': 'failed', 'channels.push.error': error.message } }
    );
    
    throw error; // Bull will retry
  }
});

// Process email jobs (similar logic)
emailQueue.process(async (job) => { /* ... */ });
```

### Q: What happens if a job fails all retries?

**A:** After 3 failed attempts:
1. Job moves to `failed` queue in Redis
2. Status in MongoDB updated to `failed` with error message
3. Job remains in failed queue for debugging (kept for 200 jobs per config)
4. Admin can view failed jobs via queue stats API
5. Admin can manually retry via queue management UI or API

To manually retry:
```javascript
const job = await pushQueue.getJob(jobId);
await job.retry();
```

### Q: How do you prioritize urgent notifications?

**A:** Using Bull's priority feature:

```javascript
// High-priority notification (e.g., security alert)
await pushQueue.add(jobData, { priority: 1 });

// Normal priority
await pushQueue.add(jobData, { priority: 5 });

// Low priority (e.g., marketing)
await pushQueue.add(jobData, { priority: 10 });
```

Lower number = higher priority. Workers process priority 1 jobs first.

---

## Real-Time Features

### Q: Why Socket.IO instead of native WebSockets?

**A:** Socket.IO adds several features on top of WebSocket:
- **Auto-reconnection**: Handles network drops gracefully
- **Fallback**: Falls back to long-polling if WebSocket blocked
- **Rooms**: Easy pub/sub pattern (user-specific rooms)
- **Broadcasting**: Send to all clients except sender
- **Acknowledgments**: Request-response pattern over WebSocket
- **Built-in heartbeat**: Detects dead connections

Native WebSocket requires implementing all this manually.

### Q: How do you implement room-based subscriptions?

**A:**

**Server side:**
```javascript
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Client subscribes to their user ID room
  socket.on('subscribe', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined room: user:${userId}`);
  });
  
  socket.on('unsubscribe', (userId) => {
    socket.leave(`user:${userId}`);
  });
});

// When notification created, emit to specific user
io.to(`user:${userId}`).emit('notification:created', notificationData);
```

**Client side:**
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  socket.emit('subscribe', currentUser._id);
});

socket.on('notification:created', (data) => {
  // Refresh notification list
  fetchNotifications();
});
```

### Q: How do you handle WebSocket reconnection?

**A:** Socket.IO handles it automatically:

```javascript
socket.on('connect', () => {
  console.log('Connected to server');
  // Re-subscribe to rooms after reconnect
  if (currentUser) {
    socket.emit('subscribe', currentUser._id);
  }
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Socket.IO will auto-reconnect
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Q: How do you scale WebSocket connections across multiple servers?

**A:** Use Redis as a message broker with Socket.IO adapter:

```javascript
const { Server } = require('socket.io');
const redisAdapter = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(redisAdapter(pubClient, subClient));
```

Now multiple server instances can share WebSocket state via Redis pub/sub.

---

## Scalability & Performance

### Q: How would you scale this system to 1 million users?

**A:** Horizontal scaling strategy:

1. **API Servers**: Deploy 5-10 instances behind load balancer (AWS ALB, Nginx)
   - Stateless design enables easy scaling
   - Socket.IO with Redis adapter for multi-server WebSocket

2. **Worker Processes**: Deploy 20-50 worker instances
   - Separate push workers and email workers
   - Scale based on queue depth (auto-scale when queue > 1000)

3. **Database**:
   - MongoDB sharding by `userId` (distribute users across shards)
   - Read replicas for analytics queries
   - Indexes are critical at this scale

4. **Queue**:
   - Redis Cluster for high availability
   - Or managed service (AWS ElastiCache, Redis Cloud)

5. **Caching**:
   - Cache user data in Redis (avoid DB hits for every push)
   - Cache notification counts (unread badges)

6. **CDN**: Serve mobile app assets via CDN

**Cost estimate**: ~$500-1000/month for 1M users with moderate activity.

### Q: What are the main performance bottlenecks?

**A:** Three main bottlenecks:

1. **Database queries**:
   - **Solution**: Indexes on `userId + createdAt`
   - **Solution**: Limit page size to 20 notifications
   - **Solution**: Cache frequent queries in Redis

2. **External API calls** (SendGrid, FCM):
   - **Solution**: Job queue decouples from API (already done)
   - **Solution**: Batch multiple notifications (FCM supports 500/request)
   - **Solution**: Use provider SDKs with connection pooling

3. **WebSocket connections**:
   - **Solution**: Redis adapter for multi-server
   - **Solution**: Client-side throttling (max 1 request/second)
   - **Solution**: Use Socket.IO rooms to avoid broadcasting to all

### Q: How do you handle rate limiting?

**A:** Two levels:

1. **API rate limiting** (express-rate-limit):
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100                  // 100 requests per IP
   });
   
   app.use('/api/notifications', limiter);
   ```

2. **Queue rate limiting** (Bull):
   ```javascript
   pushQueue.process({ max: 10 }, async (job) => { /* ... */ });
   // Process max 10 jobs concurrently
   ```

3. **Provider rate limits**:
   - SendGrid: 100 emails/second (free tier)
   - FCM: No official limit but throttles at ~100k/min
   - Solution: Use Bull's rate limiter to respect provider limits

### Q: How do you monitor performance in production?

**A:** Multiple tools:

1. **Application monitoring**: Sentry (errors + performance)
2. **Database monitoring**: MongoDB Atlas (query performance, index usage)
3. **Queue monitoring**: Bull Board UI (job throughput, failures)
4. **Server metrics**: PM2 (CPU, memory, uptime)
5. **Logging**: Winston + Papertrail (centralized logs)
6. **Alerting**: PagerDuty (critical failures)

**Key metrics to track**:
- API response time (p50, p95, p99)
- Queue processing rate (jobs/second)
- Queue depth (waiting jobs)
- Error rate (failed jobs %)
- Database query time
- WebSocket connection count

---

## Deployment & DevOps

### Q: How is the backend deployed?

**A:** Deployed on **Railway**:
- Connected GitHub repo (auto-deploy on push)
- Runs both API server and worker in single dyno (cost optimization)
- Environment variables configured in Railway dashboard
- MongoDB Atlas and Redis Cloud connected via connection strings

**Deployment steps:**
1. Push code to GitHub
2. Railway detects `package.json` in root
3. Runs `npm install` then `npm start`
4. `npm start` → runs backend server
5. Worker is started within server.js (combined for simplicity)

**Production improvements:**
- Separate worker into own Railway service
- Use Railway's auto-scaling for API service
- Add health check endpoint for monitoring

### Q: How is the mobile app deployed?

**A:** Two deployments:

1. **Web version** (Vercel):
   - Run `expo build:web` → generates static site
   - Deploy to Vercel (auto-deploy on push)
   - Custom domain: notifications-expo-web.mahavirbha.in

2. **Native apps**:
   - Android: `expo build:android` → APK/AAB
   - iOS: `expo build:ios` → IPA
   - Submit to Google Play / App Store
   - Or use Expo EAS Build for managed builds

### Q: How do you handle environment variables?

**A:** Different strategies per platform:

**Backend (.env):**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
```

**Mobile (environment-specific configs):**
```javascript
// config.js
const ENV = {
  development: {
    API_URL: 'http://localhost:3000'
  },
  production: {
    API_URL: 'https://fullstack-notification-system-production.up.railway.app'
  }
};

export default ENV[process.env.NODE_ENV || 'development'];
```

**Admin Panel (Vite env vars):**
```bash
# .env.production
VITE_API_URL=https://fullstack-notification-system-production.up.railway.app
```

### Q: How do you ensure zero-downtime deployment?

**A:** Blue-green deployment strategy:

1. **Deploy new version** to separate instance (green)
2. **Health check** green instance (GET /health)
3. **Switch traffic** from blue to green at load balancer
4. **Monitor** error rates for 5 minutes
5. **Rollback** if errors spike (switch back to blue)
6. **Terminate** blue instance after 24 hours

Railway handles this automatically with rolling deployments.

### Q: How do you handle database migrations?

**A:** MongoDB is schema-less, but for breaking changes:

1. **Additive changes** (safe):
   ```javascript
   // Add new field with default
   db.notifications.updateMany(
     { 'channels.push.deviceCount': { $exists: false } },
     { $set: { 'channels.push.deviceCount': 1 } }
   );
   ```

2. **Breaking changes** (migration script):
   ```javascript
   // migrations/001-add-device-array.js
   async function migrate() {
     const users = await db.users.find({ deviceToken: { $exists: true } });
     for (let user of users) {
       await db.users.updateOne(
         { _id: user._id },
         { $set: { devices: [{ deviceToken: user.deviceToken, deviceId: 'legacy' }] } }
       );
     }
   }
   ```

3. **Run migration** before deploying new code:
   ```bash
   node migrations/001-add-device-array.js
   ```

---

## Problem-Solving

### Q: A user reports not receiving push notifications. How do you debug?

**A:** Systematic debugging:

1. **Check device token**:
   ```bash
   db.users.findOne({ _id: userId })
   # Check if deviceToken exists and is valid
   ```

2. **Check notification record**:
   ```bash
   db.notifications.findOne({ _id: notificationId })
   # Check channels.push.status, error field
   ```

3. **Check queue**:
   ```bash
   curl http://localhost:3000/api/queue/stats
   # See if push jobs are stuck in queue
   ```

4. **Check worker logs**:
   ```bash
   # Look for errors like:
   # "Invalid device token"
   # "FCM API error: 401 Unauthorized"
   ```

5. **Test device token manually**:
   ```bash
   curl -X POST https://fcm.googleapis.com/fcm/send \
     -H "Authorization: key=$FCM_SERVER_KEY" \
     -H "Content-Type: application/json" \
     -d '{"to":"<token>","notification":{"title":"Test"}}'
   ```

**Common issues**:
- Device token expired (user reinstalled app)
- FCM server key incorrect
- App not in foreground + no notification permission
- Device offline when push sent

### Q: The API is slow. How do you identify the bottleneck?

**A:** Performance profiling:

1. **Add timing logs**:
   ```javascript
   console.time('DB query');
   const notifications = await notificationsCollection.find({ userId });
   console.timeEnd('DB query'); // DB query: 234ms
   ```

2. **Check MongoDB slow queries**:
   ```bash
   db.setProfilingLevel(2); # Log all queries
   db.system.profile.find().sort({ millis: -1 }).limit(5);
   # Find slowest queries
   ```

3. **Check missing indexes**:
   ```bash
   db.notifications.find({ userId: 'xxx' }).explain('executionStats');
   # Look for COLLSCAN (bad) vs IXSCAN (good)
   ```

4. **Check Redis latency**:
   ```bash
   redis-cli --latency
   # Should be < 5ms
   ```

5. **Use APM tool** (New Relic, Datadog):
   - Shows breakdown: 80% time in DB queries
   - Specific slow query: `notifications.find()`
   - Solution: Add index on `userId`

### Q: Redis is out of memory. How do you fix it?

**A:** Two approaches:

**Immediate fix** (free up memory):
```bash
# Remove old completed jobs
redis-cli DEL bull:push:completed
redis-cli DEL bull:email:completed

# Set expiration on completed jobs
redis-cli EXPIRE bull:push:completed 3600  # 1 hour
```

**Long-term solution**:
1. **Configure Bull to remove old jobs**:
   ```javascript
   const queue = new Queue('push', REDIS_URL, {
     defaultJobOptions: {
       removeOnComplete: 100,  # Keep only last 100
       removeOnFail: 200
     }
   });
   ```

2. **Increase Redis memory** (upgrade plan)

3. **Use Redis eviction policy**:
   ```bash
   CONFIG SET maxmemory-policy allkeys-lru
   # Auto-remove least recently used keys
   ```

### Q: Worker processes crash frequently. How do you fix it?

**A:** Add process manager (PM2):

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'worker',
    script: './workers/start.js',
    instances: 2,              # Run 2 worker processes
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M', # Restart if memory > 500MB
    env: {
      NODE_ENV: 'production'
    }
  }]
};

# Start workers
pm2 start ecosystem.config.js

# Auto-restart on crash
pm2 resurrect
```

**Debugging crashes**:
1. Check PM2 logs: `pm2 logs worker`
2. Look for uncaught exceptions
3. Add error handling:
   ```javascript
   process.on('uncaughtException', (error) => {
     console.error('Uncaught exception:', error);
     // Log to Sentry
     process.exit(1); // Let PM2 restart
   });
   ```

### Q: How do you handle a sudden traffic spike (Black Friday)?

**A:** Prepare for scale:

**Before spike**:
1. **Load test**: Simulate 10x traffic with Artillery or k6
2. **Scale up**: Pre-scale API servers and workers
3. **Increase Redis memory**: Upgrade to larger instance
4. **Database**: Add read replicas
5. **CDN**: Cache static assets
6. **Alerts**: Set up monitors for queue depth, error rate

**During spike**:
1. **Monitor dashboards**: Watch queue depth, response times
2. **Auto-scale workers**: If queue > 1000 jobs, add workers
3. **Rate limiting**: Tighten limits to protect backend
4. **Graceful degradation**: Disable non-critical features

**After spike**:
1. **Analyze**: What broke? What held up?
2. **Optimize**: Fix bottlenecks identified
3. **Document**: Update runbook for next time

---

## Behavioral Questions

### Q: What was the most challenging part of this project?

**A:** Implementing reliable job processing with proper error handling and retries. Initially, I just called the push/email APIs directly in the API handler, but this caused timeouts. Moving to a queue-based architecture required understanding:
- How Bull manages job state in Redis
- When to retry vs. mark as permanently failed
- How to update MongoDB status without race conditions
- How to emit WebSocket events from workers (not just API)

The learning curve was steep but resulted in a much more robust system.

### Q: If you had more time, what would you improve?

**A:**
1. **Batch sending**: Send 500 notifications in one FCM request (huge performance boost)
2. **Admin dashboard**: Web UI for queue monitoring (Bull Board)
3. **Notification templates**: Reusable templates with variables
4. **User preferences**: Let users opt out of channels
5. **Scheduling**: Send notifications at specific time (cron jobs)
6. **Analytics**: Track open rates, click rates
7. **A/B testing**: Test different notification copy
8. **Comprehensive tests**: Unit tests, integration tests, E2E tests

### Q: How did you test this system?

**A:** Multi-layer testing:

1. **Unit tests** (would add):
   - Test provider functions with mocks
   - Test notification creation logic

2. **Integration tests** (manual):
   - Created test users and notifications via API
   - Verified MongoDB records match expected schema
   - Checked Redis queue for job entries

3. **End-to-end tests** (manual):
   - Sent notification via mobile app
   - Verified delivery via worker logs
   - Checked WebSocket real-time updates

4. **Load tests** (would add):
   - Use Artillery to simulate 1000 concurrent users
   - Measure API response times under load

5. **Mock providers**:
   - Enabled testing without real SendGrid/FCM accounts
   - Simulated failures to test error handling

---

## Final Tips for Interview

### Key Points to Emphasize:

✅ **Scalability**: Designed with horizontal scaling in mind (stateless API, queue-based workers)

✅ **Reliability**: Job queues ensure no lost notifications, automatic retries

✅ **Real-time**: WebSocket provides instant updates without polling

✅ **Production-ready**: Proper error handling, logging, monitoring endpoints

✅ **Best practices**: Separation of concerns, environment configs, mock providers for testing

### Technical Terms to Use:

- **Decoupled architecture** (queue separates API from workers)
- **Asynchronous processing** (jobs processed in background)
- **Horizontal scaling** (add more servers for capacity)
- **Idempotent** (safe to retry operations)
- **Exponential backoff** (retry delays: 5s, 30s, 5min)
- **Eventual consistency** (status updates happen eventually, not instantly)

### Example Answers Structure:

1. **Direct answer** (1 sentence)
2. **Explain why** (1-2 sentences)
3. **Give example** (code snippet or scenario)
4. **Mention trade-offs** (what you'd do differently at scale)

### Questions to Ask Interviewer:

- What notification volumes do you handle currently?
- How do you monitor system health in production?
- What's your deployment process?
- How do you handle failed notifications?
- Do you use any APM tools (Datadog, New Relic)?

---

Good luck with your interview! 🚀
