import { createClient } from '@/utils/supabase/client'
import { NotificationType, NotificationCounts } from '@/types'

export async function getUserNotifications(userId: string, limit: number = 50): Promise<NotificationType[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Supabase error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error fetching user notifications:', error)
        return []
    }
}

export async function getUnreadNotifications(userId: string): Promise<NotificationType[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error fetching unread notifications:', error)
        return []
    }
}

export async function getNotificationCounts(userId: string): Promise<NotificationCounts> {
    const supabase = createClient()

    try {
        // Get total count
        const { count: total } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        // Get unread count
        const { count: unread } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)

        // Get counts by type
        const { data: typeData } = await supabase
            .from('notifications')
            .select('type, is_read')
            .eq('user_id', userId)

        const by_type: Record<string, number> = {}
        if (typeData) {
            typeData.forEach(notification => {
                if (!by_type[notification.type]) {
                    by_type[notification.type] = 0
                }
                if (!notification.is_read) {
                    by_type[notification.type]++
                }
            })
        }

        return {
            total: total || 0,
            unread: unread || 0,
            by_type
        }
    } catch (error) {
        console.error('Error fetching notification counts:', error)
        return {
            total: 0,
            unread: 0,
            by_type: {}
        }
    }
} 