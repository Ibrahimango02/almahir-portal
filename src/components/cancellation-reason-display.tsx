"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, User, Calendar } from "lucide-react"

type CancellationReasonDisplayProps = {
    cancellationReason: string | null
    cancelledByName?: string | null
    rescheduleDate?: string | null
    className?: string
}

export function CancellationReasonDisplay({
    cancellationReason,
    cancelledByName,
    rescheduleDate,
    className
}: CancellationReasonDisplayProps) {
    if (!cancellationReason) {
        return null
    }

    return (
        <Card className={`border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    Session Cancelled
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Reason for Cancellation:</p>
                    <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                        {cancellationReason}
                    </p>
                </div>

                {cancelledByName && (
                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                        <User className="h-3 w-3" />
                        <span>Cancelled by: <span className="font-medium">{cancelledByName}</span></span>
                    </div>
                )}

                {rescheduleDate && (
                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                        <Calendar className="h-3 w-3" />
                        <span>Rescheduled to: <span className="font-medium">{new Date(rescheduleDate).toLocaleDateString()}</span></span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 