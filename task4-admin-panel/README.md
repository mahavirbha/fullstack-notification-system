# Notification Admin Panel

A React web-based admin panel for managing the notification system. View all sent notifications, monitor delivery status across channels, and create new notifications.

## Features

- **📋 Notification List**: View all notifications with delivery status per channel (Email ✉️, Push 📱)
- **➕ Create Notification**: Send new notifications to users with real-time preview
- **🔄 Resend Action**: Re-queue failed notifications (mocked)
- **📊 Queue Statistics**: Monitor job queue status (completed, waiting, failed)
- **🎨 Clean UI**: Modern, responsive design with intuitive navigation

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool (fast HMR)
- **React Router** - Client-side routing
- **Native CSS** - Styling (no dependencies)

## Prerequisites

- Node.js 16+ installed
- Backend server running on `http://localhost:3000`

## Installation

```bash
cd task4-admin-panel
npm install
```

## Running Locally

1. **Start the backend server first** (in another terminal):
   ```bash
   cd ../backend
   npm run dev
   ```

2. **Start the admin panel**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   ```
   http://localhost:3001
   ```

## Environment Variables

Create a `.env` file if you need to customize the API URL:

```env
VITE_API_URL=http://localhost:3000
```

## Usage

### View Notifications
1. Navigate to **"📋 All Notifications"**
2. View table with notification details, delivery status, and timestamps
3. Click **🔄 Resend** to re-queue any notification (mock action)
4. See stats cards showing queue metrics

### Create New Notification
1. Navigate to **"➕ Create New"**
2. Select a user from dropdown
3. Enter title and message
4. Choose notification type (Info, Success, Warning, Error)
5. Preview the notification
6. Click **📤 Send Notification**

## Project Structure

```
task4-admin-panel/
├── src/
│   ├── components/
│   │   ├── NotificationTable.jsx      # Table view with resend buttons
│   │   ├── NotificationTable.css
│   │   ├── CreateNotificationForm.jsx # Form to create notifications
│   │   └── CreateNotificationForm.css
│   ├── pages/
│   │   ├── NotificationList.jsx       # List page wrapper
│   │   └── CreateNotification.jsx     # Create page wrapper
│   ├── services/
│   │   └── api.js                     # API service layer
│   ├── App.jsx                        # Main app with routing
│   ├── App.css
│   ├── main.jsx                       # Entry point
│   └── index.css                      # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## API Endpoints Used

- `GET /api/notifications` - Fetch all notifications
- `POST /api/notifications` - Create new notification
- `GET /api/users` - Fetch all users
- `GET /api/queue/stats` - Get queue statistics
- `POST /api/notifications/:id/resend` - Resend notification (if backend implements it)

## Building for Production

```bash
npm run build
```

Output will be in `dist/` folder.

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI** (one-time):
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configure environment variables** in Vercel dashboard:
   - `VITE_API_URL` = your production API URL

### Deploy to Netlify

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Drag and drop** the `dist/` folder to [Netlify Drop](https://app.netlify.com/drop)

Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Technical Decisions

### Why Vite?
- **Fast HMR** - Instant updates during development
- **Lightweight** - No heavy build configuration
- **Modern** - ES modules, optimized production builds

### Why Native CSS?
- **No dependencies** - Keeps bundle size small
- **Full control** - Custom styling without framework overhead
- **Fast loading** - No CSS-in-JS runtime cost

### State Management
- **React Hooks** - useState/useEffect for local state
- **No Redux** - Not needed for this simple app
- **API service layer** - Centralized API calls in `services/api.js`

### Resend Action
- Currently **mocked** (shows alert)
- Can be connected to backend `POST /api/notifications/:id/resend` endpoint
- Demonstrates UI/UX without requiring backend changes

## Screenshots

### Notifications List
- Table view with type badges (Info, Success, Warning, Error)
- Channel status icons (✉️ Email, 📱 Push)
- Delivery status badges (Delivered, Pending, Failed)
- Resend buttons for each notification

### Create Notification
- User selection dropdown
- Title and message inputs
- Type selector with colored preview
- Live preview showing how notification will appear
- Tips section with best practices

## Future Enhancements

- [ ] Search and filter notifications
- [ ] Pagination for large datasets
- [ ] Notification detail modal
- [ ] User management page
- [ ] Real-time updates via WebSocket
- [ ] Export notifications to CSV
- [ ] Analytics dashboard

## Troubleshooting

### API Connection Failed
- Ensure backend is running on `http://localhost:3000`
- Check CORS is enabled in backend
- Verify API_URL in `src/services/api.js`

### Empty User Dropdown
- Create users via backend API or mobile app first
- Check `GET /api/users` returns data

### Build Errors
```bash
rm -rf node_modules
npm install
npm run build
```

## License

This is a technical assignment project.

## Contact

For questions about this admin panel, refer to the main project README.
