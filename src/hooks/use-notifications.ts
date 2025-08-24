import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { NotificationType } from '@/types'
import { getUnreadNotifications } from '@/lib/get/get-notifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useNotifications(userId: string) {
    const [notifications, setNotifications] = useState<NotificationType[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const supabaseRef = useRef(createClient())
    const channelRef = useRef<RealtimeChannel | null>(null)

    // Load initial unread notifications
    const loadInitialNotifications = useCallback(async () => {
        if (!userId) return

        try {
            setIsLoading(true)
            const initialNotifications = await getUnreadNotifications(userId)
            setNotifications(initialNotifications)
        } catch (error) {
            console.error('Error loading initial notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        if (!userId) return

        // Load initial notifications
        loadInitialNotifications()

        // Capture the supabase instance for cleanup
        const supabase = supabaseRef.current

        // Subscribe to real-time notifications
        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const newNotification = payload.new as NotificationType
                    // Only add if it's unread
                    if (!newNotification.is_read) {
                        setNotifications(prev => [newNotification, ...prev])
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const updatedNotification = payload.new as NotificationType
                    setNotifications(prev => {
                        // If notification was marked as read, remove it
                        if (updatedNotification.is_read) {
                            return prev.filter(n => n.id !== updatedNotification.id)
                        }
                        // Otherwise, update the existing notification
                        return prev.map(n =>
                            n.id === updatedNotification.id ? updatedNotification : n
                        )
                    })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED')
                if (status === 'SUBSCRIBED') {
                    console.log('Real-time notifications connected for user:', userId)
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Real-time notifications connection error for user:', userId)
                }
            })

        channelRef.current = channel

        return () => {
            if (channelRef.current) {
                console.log('Cleaning up real-time notifications for user:', userId)
                const currentChannel = channelRef.current
                supabase.removeChannel(currentChannel)
                channelRef.current = null
            }
        }
    }, [userId, loadInitialNotifications])

    // Function to manually refresh notifications
    const refreshNotifications = useCallback(async () => {
        await loadInitialNotifications()
    }, [loadInitialNotifications])

    return {
        notifications,
        isConnected,
        isLoading,
        refreshNotifications
    }
} 