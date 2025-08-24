"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationType, NotificationCounts } from '@/types'
import { getUnreadNotifications, getNotificationCounts } from '@/lib/get/get-notifications'
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/post/post-notifications'
import { useToast } from '@/hooks/use-toast'
import { useNotifications } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface NotificationBellProps {
    userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<NotificationType[]>([])
    const [counts, setCounts] = useState<NotificationCounts>({ total: 0, unread: 0, by_type: {} })
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const { toast } = useToast()
    const previousCount = useRef(0)
    const router = useRouter()

    // Use real-time notifications hook
    const { notifications: realTimeNotifications, isLoading: realTimeLoading } = useNotifications(userId)

    const showToastNotification = useCallback((notification: NotificationType) => {
        toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default'
        })
    }, [toast])

    const loadNotifications = useCallback(async () => {
        const data = await getUnreadNotifications(userId)
        setNotifications(data)
        previousCount.current = data.length
    }, [userId])

    const loadCounts = useCallback(async () => {
        const data = await getNotificationCounts(userId)
        setCounts(data)
    }, [userId])

    const updateCounts = useCallback((notifications: NotificationType[]) => {
        const unread = notifications.length
        const by_type: Record<string, number> = {}

        notifications.forEach(notification => {
            if (!by_type[notification.type]) {
                by_type[notification.type] = 0
            }
            by_type[notification.type]++
        })

        setCounts({
            total: counts.total,
            unread,
            by_type
        })
    }, [counts.total])

    useEffect(() => {
        if (userId) {
            loadNotifications()
            loadCounts()
        }
    }, [userId, loadNotifications, loadCounts])

    // Update local state when real-time notifications change
    useEffect(() => {
        if (realTimeNotifications.length > 0) {
            // Filter to only show unread notifications
            const unreadNotifications = realTimeNotifications.filter(n => !n.is_read)
            setNotifications(unreadNotifications)

            // Update counts
            updateCounts(unreadNotifications)

            // Animate and play sound if count increased (new notification)
            if (unreadNotifications.length > previousCount.current && previousCount.current > 0) {
                triggerAnimation()
                playNotificationSound()
                showToastNotification(unreadNotifications[0])
            }
            previousCount.current = unreadNotifications.length
        }
    }, [realTimeNotifications, showToastNotification, updateCounts])

    const triggerAnimation = () => {
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 1000)
    }

    const playNotificationSound = () => {
        // Simple beep sound using Web Audio API (only in browser)
        if (typeof window !== 'undefined' && window.AudioContext) {
            try {
                const audioContext = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()

                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)

                oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
                oscillator.type = 'sine'

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + 0.5)
            } catch (error) {
                console.log('Could not play notification sound:', error)
            }
        }
    }

    const handleMarkAsRead = async (notificationId: string) => {
        const result = await markNotificationAsRead(notificationId)
        if (result.success) {
            setNotifications(prev => prev.filter(n => n.id !== notificationId))
            updateCounts(notifications.filter(n => n.id !== notificationId))
        } else {
            toast({
                title: "Error",
                description: "Failed to mark notification as read",
                variant: "destructive"
            })
        }
    }

    const handleMarkAllAsRead = async () => {
        setIsLoading(true)
        const result = await markAllNotificationsAsRead(userId)
        if (result.success) {
            setNotifications([])
            setCounts(prev => ({ ...prev, unread: 0, by_type: {} }))
            toast({
                title: "Success",
                description: "All notifications marked as read"
            })
        } else {
            toast({
                title: "Error",
                description: "Failed to mark all notifications as read",
                variant: "destructive"
            })
        }
        setIsLoading(false)
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />
            case 'error':
                return <X className="h-4 w-4 text-red-600" />
            default:
                return <Info className="h-4 w-4 text-blue-600" />
        }
    }

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'border-green-200 bg-green-50'
            case 'warning':
                return 'border-yellow-200 bg-yellow-50'
            case 'error':
                return 'border-red-200 bg-red-50'
            default:
                return 'border-blue-200 bg-blue-50'
        }
    }

    const handleNotificationClick = (notification: NotificationType, e?: React.MouseEvent) => {
        // Prevent any default behavior
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        // Mark as read when clicked
        handleMarkAsRead(notification.id)

        // Navigate to action URL if provided using Next.js router
        if (notification.action_url) {
            router.push(notification.action_url)
        }

        setIsOpen(false)
    }

    return (
        <Popover
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open)
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className={`relative transition-all duration-300 text-green-800 hover:text-green-900 hover:bg-green-100 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-950/30 w-12 h-12 p-0 ${isAnimating ? 'scale-110 ring-2 ring-green-600' : ''
                        }`}
                >
                    <Bell className={`h-10 w-10 transition-all duration-300 ${isAnimating ? 'text-green-900 dark:text-green-300' : ''
                        }`} />
                    {counts.unread > 0 && (
                        <Badge
                            variant="default"
                            className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center transition-all duration-300 bg-green-600 text-white hover:bg-green-700 ${isAnimating ? 'scale-125 bg-green-700' : ''
                                }`}
                        >
                            {counts.unread > 99 ? '99+' : counts.unread}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Notifications</h3>
                    </div>
                    {counts.unread > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/20"
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            {realTimeLoading ? 'Loading notifications...' : 'No unread notifications'}
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 border-b last:border-b-0 ${getNotificationColor(notification.type)} cursor-pointer hover:bg-opacity-80 transition-all duration-200 hover:scale-[1.02]`}
                                onClick={(e) => handleNotificationClick(notification, e)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getNotificationIcon(notification.type)}
                                            <h4 className="font-medium text-sm">
                                                {notification.title}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleMarkAsRead(notification.id)
                                                }}
                                                className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-950/20 transition-colors"
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
} 