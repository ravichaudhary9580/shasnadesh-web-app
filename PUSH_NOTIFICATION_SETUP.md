# Push Notification Feature

## Overview
When an admin uploads a new blog (with status "published"), all users who have installed the PWA will receive a push notification.

## Setup Complete ✅

### Backend Changes:
1. **New Model**: `PushSubscription.js` - Stores user push subscriptions
2. **New Controller**: `pushController.js` - Handles subscriptions and sending notifications
3. **New Routes**: `/api/push` - Endpoints for subscription management
4. **Updated**: `blogController.js` - Sends notifications when new blog is created
5. **Package**: `web-push` installed
6. **VAPID Keys**: Added to `.env` file

### Frontend Changes:
1. **New Service**: `pushNotification.js` - Handles subscription logic
2. **Updated**: `PWAInstallPrompt.jsx` - Added notification enable button
3. **Updated**: `service-worker.js` - Added push event listeners

## How It Works:

### 1. User Installs PWA
- User sees install prompt
- After installation, they can enable notifications

### 2. User Subscribes
- User clicks "Enable Blog Notifications" button
- Browser requests notification permission
- If granted, subscription is sent to backend and stored in database

### 3. Admin Creates Blog
- Admin creates a new blog with status "published"
- Backend automatically sends push notification to all subscribed users
- Notification includes blog title and link

### 4. User Receives Notification
- Service worker receives push event
- Displays notification with blog details
- Clicking notification opens the blog page

## API Endpoints:

### Public Endpoints:
- `GET /api/push/vapid-public-key` - Get VAPID public key
- `POST /api/push/subscribe` - Subscribe to notifications
- `POST /api/push/unsubscribe` - Unsubscribe from notifications

## Testing:

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm start`
3. **Install PWA**: Open app in browser and install
4. **Enable Notifications**: Click "Enable Blog Notifications"
5. **Create Blog**: Login as admin and create a published blog
6. **Check Notification**: You should receive a notification

## Browser Support:
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile - iOS 16.4+)
- ✅ Opera
- ❌ iOS Safari (< 16.4)

## Notes:
- Notifications only work over HTTPS (or localhost)
- Users must grant notification permission
- Invalid subscriptions are automatically cleaned up
- Notifications are sent asynchronously (won't block blog creation)
