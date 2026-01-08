const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

let inMemoryNotifications = [];

function generateMockNotifications(userId, count = 20) {
  return Array.from({ length: count }).map(() => ({
    id: Math.random().toString(36).slice(2),
    title: "Sample notification",
    body: "This is a mock notification",
    userId,
    createdAt: new Date(),
    channels: {
      inApp: { status: "unread" },
    },
  }));
}
inMemoryNotifications = generateMockNotifications("user1");

app.get("/notifications/:userId", (req, res) => {
  const { userId } = req.params;
  const userNotifications = inMemoryNotifications.filter(
    (n) => n.userId === userId
  );
  res.json(userNotifications);
});

app.get("/api/notifications", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  await new Promise((resolve) => setTimeout(resolve, 300));

  const paginatedNotifications = inMemoryNotifications.slice(
    startIndex,
    endIndex
  );
  res.json({
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: inMemoryNotifications.length,
    },
    data: paginatedNotifications,
  });
});
