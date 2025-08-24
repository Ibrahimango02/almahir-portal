import { createClient } from '@/utils/supabase/client'
import { CreateNotificationType, NotificationType } from '@/types'

export async function createNotification(notification: CreateNotificationType): Promise<{ success: boolean; data?: NotificationType; error?: { message: string } }> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true, data }
    } catch (error) {
        console.error('Error creating notification:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}

export async function createBulkNotifications(notifications: CreateNotificationType[]): Promise<{ success: boolean; data?: NotificationType[]; error?: { message: string } }> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notifications)
            .select()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true, data: data || [] }
    } catch (error) {
        console.error('Error creating bulk notifications:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: { message: string } }> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: { message: string } }> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false)

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Error marking all notifications as read:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
} 