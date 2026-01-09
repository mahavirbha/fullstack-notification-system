// server.js - Production-Ready Backend API
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "notification_system";
const NODE_ENV = process.env.NODE_ENV || "development";
const DEFAULT_PAGE_SIZE = 20;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection
let db;
let notificationsCollection;
let usersCollection;
let mongoClient;

// Connect to MongoDB
async function connectDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    notificationsCollection = db.collection("notifications");
    usersCollection = db.collection("users");

    await createIndexes();

    console.log("✅ Connected to MongoDB");
    console.log(`📊 Database: ${DB_NAME}`);
    console.log("✅ Indexes created");

    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("⚠️  Server will run without database (limited functionality)");
    return false;
  }
}

// Create indexes
async function createIndexes() {
  if (!notificationsCollection) return;

  try {
    // Index 1: User Query Index
    await notificationsCollection.createIndex({ userId: 1, createdAt: -1 });

    // Index 2: Status Tracking Index
    await notificationsCollection.createIndex({
      "channels.push.status": 1,
      "channels.email.status": 1,
      createdAt: -1,
    });

    // Index 3: Text Search Index
    await notificationsCollection.createIndex({
      title: "text",
      body: "text",
    });

    console.log("📊 Database indexes created");
  } catch (error) {
    console.error("Error creating indexes:", error.message);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing MongoDB connection");
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\nSIGINT signal received: closing MongoDB connection");
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get("/health", async (req, res) => {
  const dbStatus = notificationsCollection ? "connected" : "disconnected";
  const dbCount = notificationsCollection
    ? await notificationsCollection.estimatedDocumentCount()
    : 0;

  res.json({
    status: "ok",
    environment: NODE_ENV,
    database: {
      status: dbStatus,
      name: DB_NAME,
      notificationCount: dbCount,
    },
    timestamp: new Date().toISOString(),
  });
});

// Get notifications with pagination and search
app.get("/api/notifications", async (req, res) => {
  try {
    if (!notificationsCollection) {
      return res.status(503).json({
        error: "Database not available",
        message: "Please ensure MongoDB is connected",
      });
    }

    const {
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      search = "",
      userId,
      type,
      status,
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: "Missing userId",
        message: "userId query parameter is required",
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { userId: new ObjectId(userId) };

    // Add text search
    if (search) {
      query.$text = { $search: search };
    }

    // Add type filter
    if (type) {
      query.type = type;
    }

    // Add status filter
    if (status) {
      query["channels.inApp.status"] = status;
    }

    // Execute query with projection (exclude unnecessary fields)
    const notifications = await notificationsCollection
      .find(query)
      .project({
        type: 1,
        title: 1,
        body: 1,
        createdAt: 1,
        "channels.inApp.status": 1,
        "channels.push.status": 1,
        "channels.email.status": 1,
        priority: 1,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await notificationsCollection.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get single notification
app.get("/api/notifications/:id", async (req, res) => {
  try {
    if (!notificationsCollection) {
      return res.status(503).json({ error: "Database not available" });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await notificationsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Mark notification as read
app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    if (!notificationsCollection) {
      return res.status(503).json({ error: "Database not available" });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          "channels.inApp.status": "read",
          "channels.inApp.readAt": new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Create new notification
app.post("/api/notifications", async (req, res) => {
  try {
    if (!notificationsCollection) {
      return res.status(503).json({ error: "Database not available" });
    }

    const { type, title, body, userId, priority = "medium" } = req.body;

    // Validation
    if (!type || !title || !body || !userId) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["type", "title", "body", "userId"],
      });
    }

    const validTypes = ["transactional", "marketing", "alert", "system"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: "Invalid type",
        validTypes,
      });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const notification = {
      type,
      title,
      body,
      userId: new ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
      channels: {
        push: {
          status: "pending",
          provider: "fcm",
          attempts: 0,
        },
        email: {
          status: "pending",
          provider: "sendgrid",
          attempts: 0,
        },
        inApp: {
          status: "unread",
        },
      },
      priority,
      metadata: {},
    };

    const result = await notificationsCollection.insertOne(notification);

    // In production, this would trigger queue jobs for push/email
    console.log(`📨 Notification created: ${result.insertedId}`);

    res.status(201).json({
      success: true,
      notification: {
        ...notification,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get notification statistics
app.get("/api/stats", async (req, res) => {
  try {
    if (!notificationsCollection) {
      return res.status(503).json({ error: "Database not available" });
    }

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const total = await notificationsCollection.countDocuments({
      userId: new ObjectId(userId),
    });

    const unread = await notificationsCollection.countDocuments({
      userId: new ObjectId(userId),
      "channels.inApp.status": "unread",
    });

    // Get stats by type
    const byType = await notificationsCollection
      .aggregate([
        { $match: { userId: new ObjectId(userId) } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ])
      .toArray();

    res.json({
      total,
      unread,
      read: total - unread,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Create or get user (for demo purposes)
app.post("/api/users", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: "Database not available" });
    }

    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    let user = await usersCollection.findOne({ email });

    if (!user) {
      // Create new user
      const result = await usersCollection.insertOne({
        email,
        name: name || email.split("@")[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      user = await usersCollection.findOne({ _id: result.insertedId });
      console.log(`👤 New user created: ${email}`);
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error creating/fetching user:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// List users (simple pagination + optional search)
app.get("/api/users", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: "Database not available" });
    }

    const { page = 1, limit = DEFAULT_PAGE_SIZE, search = "" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await usersCollection
      .find(query)
      .project({ email: 1, name: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await usersCollection.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + users.length < total,
      },
    });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Seed data endpoint (for development/testing)
app.post("/api/seed", async (req, res) => {
  try {
    if (NODE_ENV === "production") {
      return res.status(403).json({
        error: "Seeding disabled in production",
        message: "Use this endpoint only in development",
      });
    }

    if (!notificationsCollection || !usersCollection) {
      return res.status(503).json({ error: "Database not available" });
    }

    const { userId, count = 50 } = req.body;

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Valid userId required" });
    }

    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found. Create user first." });
    }

    // Generate notifications
    const types = ["transactional", "marketing", "alert", "system"];
    const priorities = ["low", "medium", "high"];
    const titles = [
      "Payment Successful",
      "New Message",
      "Security Alert",
      "Order Shipped",
      "Weekly Summary",
      "Account Updated",
      "Special Offer",
      "System Update",
      "Password Changed",
      "Invoice Ready",
      "New Feature",
      "Reminder",
    ];
    const bodies = [
      "Your payment has been processed successfully.",
      "You have received a new message from support.",
      "Unusual activity detected on your account.",
      "Your order is on the way!",
      "Here is your weekly activity summary.",
      "Your account settings have been updated.",
      "Limited time offer - don't miss out!",
      "System maintenance completed successfully.",
      "Your password was changed recently.",
      "Your latest invoice is ready to view.",
      "Check out our new features!",
      "You have pending tasks to complete.",
    ];

    const notifications = [];
    for (let i = 0; i < count; i++) {
      const isRead = Math.random() > 0.6;
      const type = types[Math.floor(Math.random() * types.length)];

      notifications.push({
        type,
        title: titles[Math.floor(Math.random() * titles.length)],
        body: bodies[Math.floor(Math.random() * bodies.length)],
        userId: new ObjectId(userId),
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Last 30 days
        updatedAt: new Date(),
        channels: {
          push: {
            status: Math.random() > 0.1 ? "delivered" : "failed",
            sentAt: new Date(Date.now() - Math.random() * 1000 * 60),
            deliveredAt:
              Math.random() > 0.1
                ? new Date(Date.now() - Math.random() * 1000 * 30)
                : null,
            provider: "fcm",
            attempts: 1,
          },
          email: {
            status: Math.random() > 0.15 ? "delivered" : "pending",
            sentAt: new Date(Date.now() - Math.random() * 1000 * 60),
            deliveredAt:
              Math.random() > 0.15
                ? new Date(Date.now() - Math.random() * 1000 * 30)
                : null,
            provider: "sendgrid",
            attempts: 1,
          },
          inApp: {
            status: isRead ? "read" : "unread",
            readAt: isRead
              ? new Date(Date.now() - Math.random() * 1000 * 60)
              : null,
          },
        },
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        metadata: {
          source: "seed",
        },
      });
    }

    const result = await notificationsCollection.insertMany(notifications);

    res.json({
      success: true,
      message: `${count} notifications created`,
      insertedCount: result.insertedCount,
      userId,
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// Start server
async function startServer() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log("🚀 Notification System Backend");
    console.log("=================================");
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log("=================================");
  });
}

startServer();

module.exports = app;
