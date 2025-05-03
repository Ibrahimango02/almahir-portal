import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format, parseISO, differenceInMinutes, isPast, isValid, isBefore } from "date-fns"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { StatusBadge } from "./status-badge"
import { getClassesToday } from "@/lib/get-classes"
import { ClassType, ClassSessionType } from "@/types"
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
    return format(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
}

// Helper function to safely parse ISO dates
const safeParseISO = (dateStr: string): Date | null => {
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : null;
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
        // Times now come directly from the session
        // Parse with error handling
        let startDateTime = safeParseISO(session.start_time);
        let endDateTime = safeParseISO(session.end_time);

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

            const sessionDate = safeParseISO(session.date) || new Date();

            const startTime = parseTimeString(session.start_time);
            startDateTime = new Date(sessionDate);
            startDateTime.setHours(startTime.hours, startTime.minutes, startTime.seconds);

            const endTime = parseTimeString(session.end_time);
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

        return {
          classId: cls.classId,
          sessionId: session.sessionId,
          title: cls.title,
          description: cls.description || "",
          subject: cls.subject,
          date: session.date,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: session.status,
          class_link: cls.class_link || "",
          teachers: cls.teachers || [],
          enrolled_students: cls.enrolled_students || []
        } as ClassSessionType;
      } catch (error) {
        console.error("Error processing session:", error);
        return null;
      }
    }).filter(Boolean); // Filter out null values
  });

  // Filter to get only past sessions or those with completed/cancelled status
  const recentSessions = todaySessions
    .filter(session => {
      if (!session || !session.end_time || !session.status) return false;

      try {
        const now = new Date();
        const endTime = new Date(session.end_time);

        // Classes with date AND time less than current date AND time
        return isBefore(endTime, now);
      } catch (error) {
        return false;
      }
    });

  // Sort by most recent first
  const sortedSessions = recentSessions
    .sort((a, b) => {
      try {
        if (!a || !b || !a.end_time || !b.end_time) return 0;
        return new Date(b.end_time).getTime() - new Date(a.end_time).getTime();
      } catch (error) {
        return 0;
      }
    });

  return (
    <div className="space-y-4">
      {sortedSessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No recent classes for today</div>
      ) : (
        sortedSessions
          .filter(cls => cls !== null)
          .map((cls) => {
            if (!cls) return null;

            try {
              const startTime = safeParseISO(cls.start_time);
              const endTime = safeParseISO(cls.end_time);

              // Skip if we couldn't parse the dates
              if (!startTime || !endTime) {
                console.error("Invalid dates in class session:", cls.sessionId);
                return null;
              }

              const durationMinutes = differenceInMinutes(endTime, startTime);
              const durationText = formatDuration(durationMinutes);

              // Extract the original class ID from the session ID (format: classId-sessionId)
              //const sessionId = cls.id.split('-')[1];

              return (
                <Link href={`/admin/schedule/${cls.sessionId}`} key={cls.sessionId}>
                  <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {cls.teachers?.[0]?.first_name?.[0] || '?'}
                              {cls.teachers?.[0]?.last_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none">{cls.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {cls.teachers?.[0]?.first_name || 'No'} {cls.teachers?.[0]?.last_name || 'Teacher'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {safeFormat(startTime, "MMM d, yyyy")} • {safeFormat(startTime, "h:mm a")} - {safeFormat(endTime, "h:mm a")} ({durationText})
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={cls.status} />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            } catch (error) {
              console.error("Error rendering class card:", error);
              return null;
            }
          }).filter(Boolean) // Filter out any null elements
      )}
    </div>
  );
}
