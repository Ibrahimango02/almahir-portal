import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { NotificationType } from '@/types'
import { getUnreadNotifications } from '@/lib/get/get-notifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useNotifications(userId: string) {
    const [notifications, setNotifications] = useState<NotificationType[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [connectionError, setConnectionError] = useState<string | null>(null)
    const supabaseRef = useRef(createClient())
    const channelRef = useRef<RealtimeChannel | null>(null)
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const retryCountRef = useRef(0)
    const maxRetries = 5

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

    // Function to establish real-time connection
    const establishConnection = useCallback(() => {
        if (!userId) return

        // Clear any existing retry timeout
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
        }

        // Clean up existing channel
        if (channelRef.current) {
            const currentChannel = channelRef.current
            supabaseRef.current.removeChannel(currentChannel)
            channelRef.current = null
        }

        try {
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
                    setConnectionError(null)

                    if (status === 'SUBSCRIBED') {
                        console.log('Real-time notifications connected for user:', userId)
                        retryCountRef.current = 0 // Reset retry count on successful connection
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('Real-time notifications connection error for user:', userId)
                        setConnectionError('Connection error occurred')
                        handleConnectionError()
                    } else if (status === 'CLOSED') {
                        console.log('Real-time notifications connection closed for user:', userId)
                        setIsConnected(false)
                    } else if (status === 'TIMED_OUT') {
                        console.warn('Real-time notifications connection timed out for user:', userId)
                        setConnectionError('Connection timed out')
                        handleConnectionError()
                    }
                })

            channelRef.current = channel
        } catch (error) {
            console.error('Error establishing real-time connection:', error)
            setConnectionError('Failed to establish connection')
            handleConnectionError()
        }
    }, [userId])

    // Handle connection errors with retry logic
    const handleConnectionError = useCallback(() => {
        if (retryCountRef.current < maxRetries) {
            retryCountRef.current++
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000) // Exponential backoff, max 30s

            console.log(`Retrying connection in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`)

            retryTimeoutRef.current = setTimeout(() => {
                establishConnection()
            }, delay)
        } else {
            console.error('Max retry attempts reached for real-time notifications')
            setConnectionError('Failed to establish connection after multiple attempts')
        }
    }, [establishConnection, maxRetries])

    // Manual reconnection function
    const reconnect = useCallback(() => {
        retryCountRef.current = 0
        setConnectionError(null)
        establishConnection()
    }, [establishConnection])

    useEffect(() => {
        if (!userId) return

        // Load initial notifications
        loadInitialNotifications()

        // Establish real-time connection
        establishConnection()

        // Set up visibility change listener for better connection management
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !isConnected) {
                console.log('Tab became visible, attempting to reconnect...')
                reconnect()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Set up online/offline listeners
        const handleOnline = () => {
            console.log('Network came back online, attempting to reconnect...')
            reconnect()
        }

        const handleOffline = () => {
            console.log('Network went offline')
            setIsConnected(false)
            setConnectionError('Network offline')
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            // Clean up event listeners
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)

            // Clean up retry timeout
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current)
            }

            // Clean up channel
            if (channelRef.current) {
                console.log('Cleaning up real-time notifications for user:', userId)
                const currentChannel = channelRef.current
                const supabase = supabaseRef.current
                supabase.removeChannel(currentChannel)
                channelRef.current = null
            }
        }
    }, [userId, loadInitialNotifications, establishConnection, reconnect])

    // Function to manually refresh notifications
    const refreshNotifications = useCallback(async () => {
        await loadInitialNotifications()
    }, [loadInitialNotifications])

    return {
        notifications,
        isConnected,
        isLoading,
        connectionError,
        reconnect,
        refreshNotifications
    }
} 