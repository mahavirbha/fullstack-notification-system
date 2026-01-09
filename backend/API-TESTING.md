# API Testing Guide

This file contains example API calls to populate the database from scratch using REST APIs.

## Prerequisites

Make sure the backend server is running:
```bash
npm start
```

## Step 1: Clear the database

```bash
node clear-db.js
```

## Step 2: Create Users via API

### Create User 1 (John Doe)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john.doe@example.com\",\"name\":\"John Doe\"}"
```

### Create User 2 (Jane Smith)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"jane.smith@example.com\",\"name\":\"Jane Smith\"}"
```

### Create User 3 (Bob Johnson)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"bob.johnson@example.com\",\"name\":\"Bob Johnson\"}"
```

**Save the user `_id` from the response - you'll need it for creating notifications!**

## Step 3: Create Notifications via API

Replace `USER_ID_HERE` with the actual `_id` from Step 2.

### Create Notification 1
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"transactional\",\"title\":\"Payment Successful\",\"body\":\"Your payment of $99.99 has been processed.\",\"userId\":\"USER_ID_HERE\",\"priority\":\"high\"}"
```

### Create Notification 2
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"alert\",\"title\":\"Security Alert\",\"body\":\"New login detected from Chrome on Windows.\",\"userId\":\"USER_ID_HERE\",\"priority\":\"high\"}"
```

### Create Notification 3
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"marketing\",\"title\":\"Special Offer\",\"body\":\"Get 20% off premium features this week!\",\"userId\":\"USER_ID_HERE\",\"priority\":\"low\"}"
```

### Create Notification 4
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"system\",\"title\":\"System Update\",\"body\":\"New features are now available.\",\"userId\":\"USER_ID_HERE\",\"priority\":\"medium\"}"
```

## Step 4: Bulk Seed Notifications (Optional)

Create 50 random notifications for a user:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"USER_ID_HERE\",\"count\":50}"
```

## Step 5: Query Notifications

### Get all notifications for a user
```bash
curl "http://localhost:3000/api/notifications?userId=USER_ID_HERE"
```

### Get notifications with pagination
```bash
curl "http://localhost:3000/api/notifications?userId=USER_ID_HERE&page=1&limit=10"
```

### Filter by status
```bash
curl "http://localhost:3000/api/notifications?userId=USER_ID_HERE&status=unread"
```

### Filter by type
```bash
curl "http://localhost:3000/api/notifications?userId=USER_ID_HERE&type=transactional"
```

### Search notifications
```bash
curl "http://localhost:3000/api/notifications?userId=USER_ID_HERE&search=payment"
```

## Step 6: Get User Statistics

```bash
curl "http://localhost:3000/api/stats?userId=USER_ID_HERE"
```

## Step 7: Mark Notification as Read

Replace `NOTIFICATION_ID` with an actual notification ID:

```bash
curl -X PATCH http://localhost:3000/api/notifications/NOTIFICATION_ID/read
```

---

## Using PowerShell on Windows

If you're on Windows and don't have curl, use these PowerShell commands:

### Create User
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Post -ContentType "application/json" -Body '{"email":"john.doe@example.com","name":"John Doe"}'
```

### Create Notification
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications" -Method Post -ContentType "application/json" -Body '{"type":"transactional","title":"Payment Successful","body":"Your payment has been processed.","userId":"USER_ID_HERE","priority":"high"}'
```

### Get Notifications
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications?userId=USER_ID_HERE"
```
