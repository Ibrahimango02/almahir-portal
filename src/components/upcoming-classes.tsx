"use client"

import { differenceInMinutes, isValid, isBefore } from "date-fns"
import { ClassSessionType } from "@/types"
import {
    utcToLocal,
    convertUtcDateTimeToLocal,
} from "@/lib/utils/timezone"
import { formatDuration } from "@/lib/utils"
import { CalendarDays, Clock, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTimezone } from "@/contexts/TimezoneContext"
import { useEffect, useState } from "react"

// Helper function to safely parse ISO dates
const safeParseISO = (dateStr: string): Date | null => {
    try {
        return utcToLocal(dateStr);
    } catch (error) {
        console.error("Error parsing date:", dateStr, error);
        return null;
    }
}

interface UpcomingClassesProps {
    sessions: ClassSessionType[]
    isLoading: boolean
    userType: 'admin' | 'teacher' | 'student' | 'parent'
}

export function UpcomingClasses({ sessions, isLoading, userType }: UpcomingClassesProps) {
    const router = useRouter()
    const { timezone: userTimezone } = useTimezone()
    const [isClient, setIsClient] = useState(false)

    // Ensure we're on the client side before doing timezone conversions
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Process sessions for display
    const todaySessions = sessions.map(session => {
        if (!session) return null;

        try {
            // Convert UTC times to local timezone for display
            let startDateTime = utcToLocal(session.start_date);
            let endDateTime = utcToLocal(session.end_date);

            // If direct parsing fails, try parsing as time strings
            if (!startDateTime || !endDateTime) {
                try {
                    const parseTimeString = (timeStr: string) => {
                        if (!timeStr) return { hours: 0, minutes: 0, seconds: 0 };

                        const parts = timeStr.split(':').map(Number);
                        return {
                            hours: parts[0] || 0,
                            minutes: parts[1] || 0,
                            seconds: parts[2] || 0
                        };
                    };

                    const sessionDate = safeParseISO(session.start_date) || new Date();

                    const startTime = parseTimeString(session.start_date);
                    startDateTime = new Date(sessionDate);
                    startDateTime.setHours(startTime.hours, startTime.minutes, startTime.seconds);

                    const endTime = parseTimeString(session.end_date);
                    endDateTime = new Date(sessionDate);
                    endDateTime.setHours(endTime.hours, endTime.minutes, endTime.seconds);

                    // Check if end time is earlier than start time (indicating it's past midnight)
                    if (endTime.hours < startTime.hours ||
                        (endTime.hours === startTime.hours && endTime.minutes < startTime.minutes)) {
                        // Add a day to the end date
                        endDateTime.setDate(endDateTime.getDate() + 1);
                    }

                    // Verify we have valid dates
                    if (!isValid(startDateTime) || !isValid(endDateTime)) {
                        throw new Error("Failed to create valid dates");
                    }
                } catch (e) {
                    console.error("Error parsing time strings:", e);
                    // Use current time as fallback
                    const now = new Date();
                    startDateTime = now;
                    endDateTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
                }
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

    // Filter for upcoming sessions (sessions that haven't started yet)
    const upcomingSessions = todaySessions.filter(session => {
        if (!session) return false;
        return isBefore(new Date(), session.startDateTime);
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
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {displayStartTime} - {displayEndTime}
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground">{session.duration}</span>
                                    {session.teachers.length > 0 && (
                                        <>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Users className="h-3 w-3" />
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
    );
} 