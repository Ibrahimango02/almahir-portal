"use client"

import { differenceInMinutes, isValid, isPast, parseISO } from "date-fns"
import { ClassSessionType } from "@/types"
import {
    convertUtcDateTimeToLocal,
} from "@/lib/utils/timezone"
import { formatDuration } from "@/lib/utils"
import { CalendarDays, Clock, UserPen } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTimezone } from "@/contexts/TimezoneContext"
import { useEffect, useState } from "react"


interface UpcomingClassesProps {
    sessions: ClassSessionType[]
    isLoading: boolean
    userType: 'admin' | 'teacher' | 'student' | 'parent'
}

export function UpcomingClasses({ sessions, isLoading, userType }: UpcomingClassesProps) {
    const router = useRouter()
    const { timezone: userTimezone } = useTimezone()
    const [isClient, setIsClient] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Ensure we're on the client side before doing timezone conversions
    useEffect(() => {
        setIsClient(true)
        setMounted(true)
    }, [])

    // Process sessions for display
    const todaySessions = sessions.map(session => {
        if (!session) return null;

        try {
            // Parse UTC dates directly - dates from database are in UTC
            const startDateTime = parseISO(session.start_date);
            const endDateTime = parseISO(session.end_date);

            // Verify we have valid dates
            if (!isValid(startDateTime) || !isValid(endDateTime)) {
                console.error("Invalid dates for session:", session.session_id);
                return null;
            }

            // Calculate duration
            let durationMinutes = 60; // default to 1 hour
            if (isValid(startDateTime) && isValid(endDateTime)) {
                // Handle sessions that cross midnight
                let calculatedDuration = differenceInMinutes(endDateTime, startDateTime);

                // If the duration is negative, it means the session crosses midnight
                // In this case, we need to add 24 hours (1440 minutes) to get the correct duration
                if (calculatedDuration < 0) {
                    calculatedDuration += 24 * 60; // Add 24 hours in minutes
                }

                durationMinutes = Math.max(calculatedDuration, 0);
            }

            return {
                ...session,
                startDateTime,
                endDateTime,
                duration: formatDuration(durationMinutes)
            };
        } catch (error) {
            console.error("Error processing session:", error);
            return null;
        }
    }).filter(Boolean);

    // Filter for upcoming sessions (exclude sessions that have ended or have specific statuses)
    // Only filter by isPast after mounting to avoid hydration mismatches
    const upcomingSessions = todaySessions.filter(session => {
        if (!session) return false;

        // Only check isPast after component has mounted to avoid hydration mismatch
        if (mounted) {
            // Exclude sessions with end time in the past (compare UTC dates directly)
            if (isPast(session.endDateTime)) {
                return false;
            }
        }

        // Exclude sessions with status: complete, absence, or cancelled
        const excludedStatuses = ['complete', 'absence', 'cancelled'];
        if (excludedStatuses.includes(session.status)) {
            return false;
        }

        return true;
    });

    // Sort by start time
    upcomingSessions.sort((a, b) => {
        if (!a || !b) return 0;
        return a.startDateTime.getTime() - b.startDateTime.getTime();
    });

    const handleCardClick = (classId: string, sessionId: string) => {
        router.push(`/${userType}/classes/${classId}/${sessionId}`)
    }

    if (isLoading) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>Loading upcoming classes...</p>
            </div>
        );
    }

    if (upcomingSessions.length === 0) {
        return (
            <div className="text-center py-8">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No upcoming classes</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    You don&apos;t have any upcoming classes today.
                </p>
            </div>
        );
    }

    return (
        <div className="max-h-[650px] overflow-y-auto pr-2">
            <div className="grid gap-3">
                {upcomingSessions.map((session) => {
                    if (!session) return null;

                    // Convert times to user's timezone for display
                    const displayStartTime = isClient
                        ? convertUtcDateTimeToLocal(session.start_date, userTimezone)
                        : session.start_date
                    const displayEndTime = isClient
                        ? convertUtcDateTimeToLocal(session.end_date, userTimezone)
                        : session.end_date

                    return (
                        <div
                            key={session.session_id}
                            className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-accent/50"
                            onClick={() => handleCardClick(session.class_id, session.session_id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-base">{session.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{session.subject}</p>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="flex items-center gap-1 text-muted-foreground" suppressHydrationWarning>
                                            <Clock className="h-3 w-3" />
                                            {displayStartTime} - {displayEndTime}
                                        </span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-muted-foreground">{session.duration}</span>
                                        {session.teachers.length > 0 && (
                                            <>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <UserPen className="h-3 w-3" />
                                                    {session.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 ml-3">
                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${session.status === "running" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" :
                                        session.status === "complete" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                                            session.status === "pending" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" :
                                                session.status === "scheduled" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                                    session.status === "rescheduled" ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
                                                        session.status === "cancelled" ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" :
                                                            session.status === "absence" ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                                                                "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                        }`}>
                                        {session.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 