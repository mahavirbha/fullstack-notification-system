# Notification System Backend API

A RESTful API for managing notifications with support for pagination, filtering, and status management.

## Features

- ✅ Complete CRUD operations for notifications
- ✅ Pagination and filtering support
- ✅ Mark notifications as read/unread
- ✅ Bulk operations (delete, mark as read/unread)
- ✅ In-memory data store
- ✅ Production-ready error handling
- ✅ Request logging
- ✅ Environment-based configuration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### Health Check
- **GET** `/health` - Check server status

### Notifications CRUD

#### List Notifications
- **GET** `/api/notifications`
- Query parameters:
  - `page` (number, default: 1) - Page number
  - `limit` (number, default: 10, max: 100) - Items per page
  - `userId` (string, optional) - Filter by user ID
  - `status` (string: 'read' | 'unread', optional) - Filter by status
- Response: Paginated list of notifications

#### Get Single Notification
- **GET** `/api/notifications/:id`
- Response: Single notification object

#### Create Notification
- **POST** `/api/notifications`
- Body:
```json
{
  "title": "Notification Title",
  "body": "Notification body content",
  "userId": "user123",
  "channels": {
    "inApp": { "status": "unread" }
  }
}
```
- Response: Created notification (201)

#### Update Notification
- **PUT** `/api/notifications/:id`
- Body:
```json
{
  "title": "Updated Title",
  "body": "Updated body"
}
```
- Response: Updated notification

#### Delete Notifications
- **DELETE** `/api/notifications`
- Body:
```json
{
  "notificationIds": ["id1", "id2"]
}
```
- Response: Success message with deleted count

### Notification Status Management

#### Mark as Read
- **PATCH** `/api/notifications/mark-read`
- Body:
```json
{
  "notificationIds": ["id1", "id2"]
}
```

#### Mark as Unread
- **PATCH** `/api/notifications/mark-unread`
- Body:
```json
{
  "notificationIds": ["id1", "id2"]
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

### Pagination Response
```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [ ... ]
}
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Development

Mock data is automatically generated in development mode with 20 sample notifications.

## Testing

You can test the API using curl, Postman, or any HTTP client:

```bash
# Health check
curl http://localhost:3000/health

# List notifications
curl http://localhost:3000/api/notifications

# Get single notification
curl http://localhost:3000/api/notifications/:id

# Create notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Test body","userId":"user1"}'

# Mark as read
curl -X PATCH http://localhost:3000/api/notifications/mark-read \
  -H "Content-Type: application/json" \
  -d '{"notificationIds":["id1"]}'
```

## License

MIT
