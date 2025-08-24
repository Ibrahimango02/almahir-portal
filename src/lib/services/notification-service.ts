import { createNotification, createBulkNotifications } from '@/lib/post/post-notifications'
import { CreateNotificationType } from '@/types'

export class NotificationService {
    // Reschedule request notifications
    static async notifyRescheduleRequest(
        adminIds: string[],
        requesterName: string,
        sessionDate: string,
        requestedDate: string
    ) {
        // Format dates to be user-friendly
        const formatDate = (dateString: string) => {
            if (!dateString) return 'Unknown date';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'Invalid date';
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch {
                return 'Invalid date';
            }
        };

        const formattedOldDate = formatDate(sessionDate);
        const formattedNewDate = formatDate(requestedDate);

        const notifications: CreateNotificationType[] = adminIds.map(adminId => ({
            user_id: adminId,
            title: 'New Reschedule Request',
            message: `${requesterName} has requested a reschedule from ${formattedOldDate} to ${formattedNewDate}`,
            type: 'warning',
            action_url: '/admin/reschedule-requests',
            metadata: {
                requester_name: requesterName,
                session_date: sessionDate,
                requested_date: requestedDate
            }
        }))

        return await createBulkNotifications(notifications)
    }

    // Session reschedule notifications
    static async notifySessionReschedule(
        userIds: string[],
        className: string,
        oldDate: string,
        newDate: string
    ) {
        const notifications: CreateNotificationType[] = userIds.map(userId => ({
            user_id: userId,
            title: 'Session Rescheduled',
            message: `${className} has been rescheduled from ${oldDate} to ${newDate}`,
            type: 'info',
            action_url: '/classes',
            metadata: {
                class_name: className,
                old_date: oldDate,
                new_date: newDate
            }
        }))

        return await createBulkNotifications(notifications)
    }

    // Payment deadline notifications
    static async notifyPaymentDeadline(
        parentId: string,
        studentName: string,
        dueDate: string,
        amount: number
    ) {
        return await createNotification({
            user_id: parentId,
            title: 'Payment Due Soon',
            message: `Payment of $${amount} for ${studentName} is due on ${dueDate}`,
            type: 'warning',
            action_url: '/parent/invoices',
            metadata: {
                student_name: studentName,
                due_date: dueDate,
                amount
            }
        })
    }

    // Invoice overdue notifications
    static async notifyInvoiceOverdue(
        parentId: string,
        studentName: string,
        amount: number,
        daysOverdue: number
    ) {
        return await createNotification({
            user_id: parentId,
            title: 'Invoice Overdue',
            message: `Invoice of $${amount} for ${studentName} is ${daysOverdue} days overdue`,
            type: 'error',
            action_url: '/parent/invoices',
            metadata: {
                student_name: studentName,
                amount,
                days_overdue: daysOverdue
            }
        })
    }

    // Session reminder notifications
    static async notifySessionReminder(
        userIds: string[],
        className: string,
        sessionDate: string,
        sessionTime: string
    ) {
        const notifications: CreateNotificationType[] = userIds.map(userId => ({
            user_id: userId,
            title: 'Session Reminder',
            message: `Reminder: ${className} tomorrow at ${sessionTime}`,
            type: 'info',
            action_url: '/classes',
            metadata: {
                class_name: className,
                session_date: sessionDate,
                session_time: sessionTime
            }
        }))

        return await createBulkNotifications(notifications)
    }

    // Teacher payment notifications
    static async notifyTeacherPayment(
        teacherId: string,
        amount: number,
        sessionTitle: string,
        status: 'pending' | 'paid'
    ) {
        const title = status === 'paid' ? 'Payment Received' : 'Payment Pending'
        const message = status === 'paid'
            ? `Payment of $${amount} for ${sessionTitle} has been processed`
            : `Payment of $${amount} for ${sessionTitle} is pending`

        return await createNotification({
            user_id: teacherId,
            title,
            message,
            type: status === 'paid' ? 'success' : 'info',
            action_url: '/teacher/payments',
            metadata: {
                amount,
                session_title: sessionTitle,
                status
            }
        })
    }

    // System notifications
    static async notifySystem(
        userIds: string[],
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info'
    ) {
        const notifications: CreateNotificationType[] = userIds.map(userId => ({
            user_id: userId,
            title,
            message,
            type
        }))

        return await createBulkNotifications(notifications)
    }

    // Class cancellation notifications
    static async notifyClassCancellation(
        userIds: string[],
        className: string,
        sessionDate: string,
        reason?: string
    ) {
        const notifications: CreateNotificationType[] = userIds.map(userId => ({
            user_id: userId,
            title: 'Class Cancelled',
            message: `${className} on ${sessionDate} has been cancelled${reason ? `: ${reason}` : ''}`,
            type: 'warning',
            action_url: '/classes',
            metadata: {
                class_name: className,
                session_date: sessionDate,
                ...(reason && { reason })
            }
        }))

        return await createBulkNotifications(notifications)
    }

    // New resource notifications
    static async notifyNewResource(
        userIds: string[],
        resourceTitle: string,
        uploadedBy: string
    ) {
        const notifications: CreateNotificationType[] = userIds.map(userId => ({
            user_id: userId,
            title: 'New Resource Available',
            message: `${uploadedBy} has uploaded a new resource: ${resourceTitle}`,
            type: 'info',
            action_url: '/resources',
            metadata: {
                resource_title: resourceTitle,
                uploaded_by: uploadedBy
            }
        }))

        return await createBulkNotifications(notifications)
    }
} 