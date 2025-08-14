"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, FileText, Check, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { updateSession } from "@/lib/put/put-classes"
import { updateRescheduleRequest } from "@/lib/post/post-reschedule-requests"
import { getPendingRescheduleRequests } from "@/lib/get/get-reschedule-requests"
import { RescheduleRequestWithDetailsType } from "@/types"
import { getProfile } from "@/lib/get/get-profiles"
import { utcToLocal, getUserTimezone, formatDateTime } from "@/lib/utils/timezone"
import { useRouter } from "next/navigation"

export function RescheduleRequestsTable() {
    const [requests, setRequests] = useState<RescheduleRequestWithDetailsType[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const { toast } = useToast()
    const router = useRouter()

    const fetchRescheduleRequests = useCallback(async () => {
        try {
            const data = await getPendingRescheduleRequests()
            setRequests(data)
        } catch (error) {
            console.error('Error fetching reschedule requests:', error)
            toast({
                title: "Error",
                description: "Failed to fetch reschedule requests",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchRescheduleRequests()
    }, [fetchRescheduleRequests])

    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const profile = await getProfile()
                setCurrentUserId(profile.id)
            } catch (error) {
                console.error('Error fetching current user:', error)
            }
        }

        getCurrentUser()
    }, [])

    const handleApproveReschedule = async (requestId: string, newDate: string) => {
        if (!currentUserId) {
            toast({
                title: "Error",
                description: "User ID not available. Please refresh the page and try again.",
                variant: "destructive"
            })
            return
        }

        setProcessing(requestId)
        try {
            // Parse the requested date (which is in UTC) and create a new session
            const requestedDate = new Date(newDate) // newDate is already in UTC from the database
            const originalRequest = requests.find(r => r.id === requestId)

            if (!originalRequest) throw new Error('Request not found')

            // Validate that the requested date is in the future
            const now = new Date()
            if (requestedDate <= now) {
                throw new Error('Requested date must be in the future')
            }

            // Calculate duration from original session (both dates are in UTC)
            const originalStart = new Date(originalRequest.session.start_date)
            const originalEnd = new Date(originalRequest.session.end_date)
            const durationMs = originalEnd.getTime() - originalStart.getTime()

            // Create new end date based on duration (keeping it in UTC)
            const newEndDate = new Date(requestedDate.getTime() + durationMs)

            // First, reschedule the session
            console.log('Rescheduling session:', {
                sessionId: originalRequest.session_id,
                newStartDate: requestedDate.toISOString(),
                newEndDate: newEndDate.toISOString(),
                originalStart: originalRequest.session.start_date,
                originalEnd: originalRequest.session.end_date
            })

            const result = await updateSession({
                sessionId: originalRequest.session_id,
                action: 'reschedule',
                newStartDate: requestedDate.toISOString(),
                newEndDate: newEndDate.toISOString(),
            })

            if (result.success) {
                // Then update the reschedule request status
                const updateResult = await updateRescheduleRequest({
                    id: requestId,
                    status: 'approved',
                    processedBy: currentUserId
                })

                if (updateResult.success) {
                    toast({
                        title: "Reschedule Approved",
                        description: `The session has been rescheduled successfully to ${formatDateTime(utcToLocal(requestedDate, getUserTimezone()), "MMMM d, yyyy 'at' h:mm a", getUserTimezone())}`,
                    })

                    // Refresh the list to show updated status
                    await fetchRescheduleRequests()

                    // Optionally, you could trigger a page refresh or navigation here
                    // to show the updated session in the schedule view
                } else {
                    throw new Error("Failed to update request status")
                }
            } else {
                throw new Error(result.error?.message || "Failed to approve reschedule")
            }
        } catch (error) {
            console.error('Error in handleApproveReschedule:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to approve reschedule",
                variant: "destructive"
            })
        } finally {
            setProcessing(null)
        }
    }

    const handleRejectReschedule = async (requestId: string) => {
        if (!currentUserId) {
            toast({
                title: "Error",
                description: "User ID not available. Please refresh the page and try again.",
                variant: "destructive"
            })
            return
        }

        setProcessing(requestId)
        try {
            const result = await updateRescheduleRequest({
                id: requestId,
                status: 'rejected',
                processedBy: currentUserId
            })

            if (result.success) {
                toast({
                    title: "Reschedule Rejected",
                    description: "The reschedule request has been rejected",
                })
                await fetchRescheduleRequests() // Refresh the list
            } else {
                throw new Error("Failed to reject reschedule request")
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to reject reschedule request",
                variant: "destructive"
            })
        } finally {
            setProcessing(null)
        }
    }

    const handleCardClick = (classId: string, sessionId: string) => {
        router.push(`/admin/classes/${classId}/${sessionId}`)
    }

    if (loading) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Reschedule Requests</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center justify-center py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span className="text-sm">Loading reschedule requests...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (requests.length === 0) {
        return (
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Reschedule Requests</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-center text-muted-foreground py-4">
                        <Calendar className="h-6 w-6 mx-auto mb-1 opacity-50" />
                        <p className="text-sm">No pending reschedule requests</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-none">
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {requests.map((request) => (
                        <div
                            key={request.id}
                            className="border rounded-md p-2 hover:shadow-sm transition-shadow cursor-pointer hover:bg-gray-50"
                            onClick={() => handleCardClick(request.session.class_id, request.session_id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-sm truncate">{request.session.class.title}</h3>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span className="truncate">{`${request.requester.first_name} ${request.requester.last_name}`}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDateTime(request.created_at, "MMM d, yyyy", getUserTimezone())}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-start gap-1.5">
                                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <span className="font-medium text-muted-foreground">Reason:</span>
                                                <p className="text-muted-foreground mt-0.5 leading-tight">{request.reason}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <Calendar className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <span className="font-medium text-muted-foreground">New Date:</span>
                                                <p className="text-muted-foreground mt-1 leading-relaxed">
                                                    {formatDateTime(utcToLocal(request.requested_date, getUserTimezone()), "MMM d, yyyy 'at' h:mm a", getUserTimezone())}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        size="sm"
                                        onClick={() => handleApproveReschedule(request.id, request.requested_date)}
                                        disabled={processing === request.id}
                                        className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                                        title="Approve Reschedule"
                                    >
                                        {processing === request.id ? (
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        ) : (
                                            <Check className="h-3 w-3" />
                                        )}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRejectReschedule(request.id)}
                                        disabled={processing === request.id}
                                        className="h-7 w-7 p-0 border-red-500 text-red-600 hover:bg-red-50"
                                        title="Reject Reschedule"
                                    >
                                        {processing === request.id ? (
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        ) : (
                                            <X className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
} 