import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { differenceInMinutes, isPast, isValid, isBefore } from "date-fns"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { StatusBadge } from "./status-badge"
import { getClassesToday } from "@/lib/get/get-classes"
import { ClassType, ClassSessionType } from "@/types"
import {
  formatDateTime,
  formatTime,
  utcToLocal,
  isTodayInTimezone
} from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"

// Helper function to format duration
const formatDuration = (minutes: number) => {
  if (minutes < 0) {
    console.warn("Negative duration detected:", minutes);
    minutes = Math.abs(minutes); // Prevent negative durations
  }
  if (minutes < 60) {
    return `${minutes} mins`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} mins` : `${hours} hr`
}

// Helper function to safely format date
const safeFormat = (date: Date | null, formatStr: string, fallback: string = "–") => {
  if (!date || !isValid(date)) return fallback;
  try {
    return formatDateTime(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
}

// Helper function to safely parse ISO dates
const safeParseISO = (dateStr: string): Date | null => {
  try {
    return utcToLocal(dateStr);
  } catch (error) {
    console.error("Error parsing date:", dateStr, error);
    return null;
  }
}

export async function RecentClasses() {
  const todayClasses: ClassType[] = await getClassesToday();

  // Create session objects for display - times are now in each session
  const todaySessions = todayClasses.flatMap(cls => {
    // If no sessions, return empty array
    if (!cls || !cls.sessions || cls.sessions.length === 0) {
      return [];
    }

    // Create entry for each session
    return cls.sessions.map(session => {
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
          durationMinutes = Math.max(differenceInMinutes(endDateTime, startDateTime), 0);
        }

        return {
          session_id: session.session_id,
          class_id: cls.class_id,
          title: cls.title,
          description: cls.description,
          subject: cls.subject,
          start_date: session.start_date,
          end_date: session.end_date,
          status: session.status,
          class_link: cls.class_link,
          teachers: cls.teachers,
          enrolled_students: cls.enrolled_students,
          startDateTime,
          endDateTime,
          duration: formatDuration(durationMinutes)
        };
      } catch (error) {
        console.error("Error processing session:", error);
        return null;
      }
    }).filter(Boolean);
  });

  // Filter for recent classes (classes that have ended)
  const recentSessions = todaySessions.filter(session => {
    if (!session) return false;
    return isPast(session.endDateTime);
  });

  // Sort by end time (most recent first)
  recentSessions.sort((a, b) => {
    if (!a || !b) return 0;
    return b.endDateTime.getTime() - a.endDateTime.getTime();
  });

  if (recentSessions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p>No recent classes today</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recentSessions.map((session) => {
        if (!session) return null;

        return (
          <Card key={session.session_id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{session.title}</h3>
                  <StatusBadge status={session.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-2">{session.subject}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {formatDateTime(session.startDateTime, 'h:mm a')} - {formatTime(session.endDateTime, 'h:mm a')}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{session.duration}</span>
                </div>
                {session.teachers.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Teacher:</span>
                    <span className="text-sm font-medium">
                      {session.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/classes/${session.class_id}/${session.session_id}`}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                >
                  View
                </Link>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
