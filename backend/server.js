const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

let inMemoryNotifications = [];

function generateMockNotifications(userId, count = 20) {
  return Array.from({ length: count }).map(() => ({
    id: Math.random().toString(36).slice(2),
    title: 'Sample notification',
    body: 'This is a mock notification',
    userId,
    createdAt: new Date(),
    channels: {
      inApp: { status: 'unread' }
    }
  }));
}
 inMemoryNotifications = generateMockNotifications('user1');

app.get('/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const userNotifications = inMemoryNotifications.filter(n => n.userId === userId);
  res.json(userNotifications);
});
