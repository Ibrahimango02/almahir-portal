# Notification System Documentation

## Overview

The notification system provides real-time notifications for users across the Almahir portal application. It supports different notification types, categories, and integrates with existing functionality like reschedule requests, payments, and system announcements.

## Features

- **Real-time notifications** using Supabase subscriptions
- **Multiple notification types**: info, success, warning, error
- **Rich metadata** support for additional context
- **Action URLs** for navigation when notifications are clicked
- **Read/unread status** tracking
- **Bulk notification** support
- **Automatic notifications** for system events

## Database Schema

The system uses a `notifications` table with the following structure:

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Components

### 1. NotificationBell

The main notification component that displays in all user sidebars.

**Features:**
- Shows unread notification count
- Displays notification list in a popover
- Allows marking individual or all notifications as read
- Click navigation to action URLs
- Real-time updates

**Usage:**
```tsx
<NotificationBell userId={user.id} />
```

### 2. NotificationService

Service class for creating different types of notifications.

**Available Methods:**

#### Reschedule Request Notifications
```typescript
await NotificationService.notifyRescheduleRequest(
    adminIds,
    requesterName,
    className,
    requestedDate
)
```

#### Session Reschedule Notifications
```typescript
await NotificationService.notifySessionReschedule(
    userIds,
    className,
    oldDate,
    newDate
)
```

#### Payment Deadline Notifications
```typescript
await NotificationService.notifyPaymentDeadline(
    parentId,
    studentName,
    dueDate,
    amount
)
```

#### Invoice Overdue Notifications
```typescript
await NotificationService.notifyInvoiceOverdue(
    parentId,
    studentName,
    amount,
    daysOverdue
)
```

#### Session Reminder Notifications
```typescript
await NotificationService.notifySessionReminder(
    userIds,
    className,
    sessionDate,
    sessionTime
)
```

#### Teacher Payment Notifications
```typescript
await NotificationService.notifyTeacherPayment(
    teacherId,
    amount,
    sessionTitle,
    status
)
```

#### System Notifications
```typescript
await NotificationService.notifySystem(
    userIds,
    title,
    message,
    type
)
```

#### Class Cancellation Notifications
```typescript
await NotificationService.notifyClassCancellation(
    userIds,
    className,
    sessionDate,
    reason
)
```

#### New Resource Notifications
```typescript
await NotificationService.notifyNewResource(
    userIds,
    resourceTitle,
    uploadedBy
)
```

## Database Operations

### Creating Notifications

```typescript
import { createNotification } from '@/lib/post/post-notifications'

const result = await createNotification({
    user_id: 'user-uuid',
    title: 'Notification Title',
    message: 'Notification message',
    type: 'info',
    action_url: '/some-page',
    metadata: { key: 'value' }
})
```

### Bulk Notifications

```typescript
import { createBulkNotifications } from '@/lib/post/post-notifications'

const notifications = [
    { user_id: 'user1', title: 'Title 1', message: 'Message 1', type: 'info' },
    { user_id: 'user2', title: 'Title 2', message: 'Message 2', type: 'warning' }
]

const result = await createBulkNotifications(notifications)
```

### Marking as Read

```typescript
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/post/post-notifications'

// Mark single notification as read
await markNotificationAsRead('notification-id')

// Mark all user notifications as read
await markAllNotificationsAsRead('user-id')
```

### Retrieving Notifications

```typescript
import { getUserNotifications, getUnreadNotifications, getNotificationCounts } from '@/lib/get/get-notifications'

// Get all user notifications
const notifications = await getUserNotifications('user-id', 50)

// Get unread notifications only
const unread = await getUnreadNotifications('user-id')

// Get notification counts
const counts = await getNotificationCounts('user-id')
```

## Real-time Updates

The system uses Supabase real-time subscriptions for instant notification delivery.

```typescript
import { useNotifications } from '@/hooks/use-notifications'

function MyComponent() {
    const { notifications, isConnected } = useNotifications(userId)
    
    // notifications will update automatically when new ones arrive
    // isConnected shows subscription status
}
```

## Integration Examples

### 1. Reschedule Requests

Notifications are automatically sent when:
- A new reschedule request is created (notifies admins)
- A reschedule request is processed (notifies requester)

### 2. Payment Deadlines

```typescript
// Check for upcoming payments and send notifications
const upcomingPayments = await getUpcomingPayments()
for (const payment of upcomingPayments) {
    if (daysUntilDue <= 3) {
        await NotificationService.notifyPaymentDeadline(
            payment.parent_id,
            payment.student_name,
            payment.due_date,
            payment.amount
        )
    }
}
```

### 3. Session Reminders

```typescript
// Send reminders for tomorrow's sessions
const tomorrowSessions = await getTomorrowSessions()
for (const session of tomorrowSessions) {
    const participants = [...session.students, ...session.teachers]
    await NotificationService.notifySessionReminder(
        participants.map(p => p.id),
        session.class_title,
        session.date,
        session.time
    )
}
```

## Testing

The notification system can be tested by:

1. **Manual Testing**: Create notifications through the application's normal workflow
2. **API Testing**: Use the notification endpoints directly
3. **Database Testing**: Insert test notifications directly into the database
4. **Real-time Testing**: Monitor the notification bell for live updates

## Styling

Notifications use Tailwind CSS classes with different colors based on type:

- **Info**: Blue theme (`border-blue-200 bg-blue-50`)
- **Success**: Green theme (`border-green-200 bg-green-50`)
- **Warning**: Yellow theme (`border-yellow-200 bg-yellow-50`)
- **Error**: Red theme (`border-red-200 bg-red-50`)

## Security

- Row Level Security (RLS) ensures users can only see their own notifications
- Notifications are tied to authenticated user IDs
- No sensitive data is stored in notification metadata

## Performance Considerations

- Notifications are paginated (default limit: 50)
- Real-time subscriptions are automatically cleaned up
- Database indexes optimize notification queries
- Bulk operations reduce database round trips

## Future Enhancements

- Email notifications
- Push notifications
- Notification preferences
- Notification templates
- Scheduled notifications
- Notification analytics

## Troubleshooting

### Notifications not appearing
1. Check if the user ID is correct
2. Verify the notification was created successfully
3. Check browser console for errors
4. Ensure Supabase real-time is enabled

### Real-time not working
1. Check Supabase subscription status
2. Verify channel subscription
3. Check network connectivity
4. Ensure proper cleanup in useEffect

### Database errors
1. Check RLS policies
2. Verify table structure
3. Check user permissions
4. Review Supabase logs 