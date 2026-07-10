# Cerberus Dashboard - Project Guide

## Overview
Complete React dashboard frontend for a server monitoring tool called "Cerberus". The app includes user authentication and real-time metrics visualization using Chart.js.

## Tech Stack
- **React 19** with Vite bundler
- **React Router v6** for navigation
- **Chart.js + react-chartjs-2** for data visualization
- **Vanilla CSS** (no Tailwind) with dark theme
- **Backend**: Django API running locally at `http://localhost:8000/api`

## Project Structure
```
Dashboard/
├── src/
│   ├── App.jsx                 # Main router setup with AuthContext
│   ├── index.css               # Global dark-themed styles
│   ├── main.jsx                # React entry point
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state management
│   └── pages/
│       ├── Login.jsx           # Login page with error handling
│       └── Dashboard.jsx       # Main dashboard with metrics & charts
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies
```

## Features

### Authentication
- **Login Flow**: POST to `/auth/login/` with `{ username, password }`
- **Token Storage**: Stored in localStorage as `cerberus_token`
- **Protected Routes**: Dashboard requires valid token; redirects to login if missing
- **Logout**: Clears token and returns to login page

### Real-Time Metrics (Auto-refresh every 10 seconds)
- **CPU Usage**: Fetched from `/metrics/latest/?page_size=5`
- **Available RAM**: Memory usage in MB
- **Disk Free (C:)**: Free disk space in GB
- **Formatting**: CPU as %, RAM as MB, Disk as GB with proper decimals

### Historical Charts (24-hour data)
- **CPU History**: Line chart from `/metrics/history/?hours=24&type=CPU_Usage`
- **RAM History**: Line chart from `/metrics/history/?hours=24&type=Available_RAM`
- **Dark Theme**: Custom Chart.js styling with dark background and light text
- **Data Reversal**: API returns descending; reversed for chronological display

### Alerts Section
- **Display**: Fetched from `/alerts/` endpoint
- **Format**: Timestamp + message in a scrollable list
- **Empty State**: Shows "No alerts" when list is empty

### Error Handling
- **Connection Status**: Visual indicator (green "Connected" / red "Disconnected")
- **Failed Requests**: Graceful error messages instead of crashes
- **Fallback UI**: Shows "--" for metrics if backend is unreachable
- **User Feedback**: Error banner explains how to resolve issues

## Color Scheme (Dark Mode)
- **Background**: `#0f172a` (very dark blue)
- **Cards/Containers**: `#1e293b` (dark blue-gray)
- **Text**: `#e2e8f0` (light gray)
- **Accent**: `#38bdf8` (cyan blue) for highlights
- **Secondary Accent**: `#fbbf24` (amber) for RAM metrics
- **Error**: `#ef4444` (red)
- **Success**: `#22c55e` (green)

## API Endpoints

### Authentication
```
POST /auth/login/
Body: { username, password }
Response: { token, user_id, username }
```

### Metrics
```
GET /metrics/latest/?page_size=5
Headers: Authorization: Token {token}
Response: { results: [{ metric_type, value, timestamp }, ...] }

GET /metrics/history/?hours=24&type=CPU_Usage
GET /metrics/history/?hours=24&type=Available_RAM
Headers: Authorization: Token {token}
Response: { results: [{ value, timestamp }, ...] }
```

### Alerts
```
GET /alerts/
Headers: Authorization: Token {token}
Response: { results: [{ id, text_value, timestamp }, ...] }
```

## How to Run

### Prerequisites
- Node.js 18+
- Django backend running at `http://localhost:8000`

### Installation & Development
```bash
cd Dashboard
npm install
npm run dev
```
The app will start at `http://localhost:5174`

### Production Build
```bash
npm run build
npm run preview
```

## Error Handling

The application implements robust error handling:

1. **Network Failures**: If the Django server is unreachable, a "Disconnected" status appears and a warning banner explains the issue
2. **Failed Requests**: Errors are logged to console with `[v0]` prefix for debugging
3. **Graceful Degradation**: UI remains functional; metrics show "--" until data is available
4. **Login Errors**: Clear error messages tell users to check credentials or server connection

## Styling Notes

### CSS Architecture
- **Global styles** in `index.css` (no component scoping needed - small app)
- **Dark theme tokens** for consistency
- **Responsive grid** for cards and charts (flexes to single column on mobile)
- **Animations**: Pulse effect on connection status indicator
- **Hover states**: Cards brighten with cyan border on hover

### Key Classes
- `.login-container` / `.login-form` - Login page layout
- `.dashboard` - Main dashboard wrapper
- `.cards` - Metrics card grid
- `.chart-container` - Chart wrappers
- `.alerts` - Alerts section
- `.status-indicator` - Connection status badge

## Chart.js Configuration

Charts are configured with:
- **Dark mode colors**: Cyan borders, amber for RAM
- **Responsive**: Automatically resizes with container
- **Tooltips**: Dark background with light text
- **Grid**: Subtle gray lines on dark background
- **Points**: Visible point markers with dark border

## Security Notes

1. **Token in localStorage**: Suitable for SPAs; consider httpOnly cookies for production
2. **CORS**: Frontend expects CORS headers from Django backend
3. **Authorization**: All API calls include `Authorization: Token {token}` header
4. **Input Validation**: Login form requires username and password

## Performance

- **Metrics Refresh**: 10-second interval prevents excessive API calls
- **Chart Data**: Cached in component state; only refreshes on interval
- **Rendering**: React 19 with compiler optimization enabled
- **Bundle Size**: Minimal dependencies; Vite for fast builds

## Debugging

Enable debug logging by checking the browser console for `[v0]` prefixed messages:
- Login attempts
- API fetch errors
- Component state changes

## Future Enhancements

1. Add filtering/time range selection for charts
2. Implement alert actions (acknowledge, dismiss)
3. Add system health scoring
4. Real-time WebSocket updates instead of polling
5. Export metrics to CSV
6. Dark/light mode toggle
7. Multi-server monitoring view
