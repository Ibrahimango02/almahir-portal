"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { differenceInMinutes, isPast, isValid, isBefore } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { StatusBadge } from "./status-badge"
import { ClassType, ClassSessionType } from "@/types"
import {
    formatDateTime,
    formatTime,
    utcToLocal,
    isTodayInTimezone
} from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { convertStatusToPrefixedFormat, calculateAge, formatDuration } from "@/lib/utils"
import { CalendarDays, Clock, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

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

// Function to get today's classes for a specific teacher
async function getTeacherClassesToday(teacherId: string): Promise<ClassType[]> {
    const supabase = createClient()

    // Get today's date range in ISO format
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    // Get class IDs for this teacher
    const { data: teacherClasses } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId)

    const classIds = teacherClasses?.map(tc => tc.class_id) || []
    if (classIds.length === 0) return []

    // Get class details
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds)

    if (!classes) return []

    // Get sessions for these classes that are today
    const { data: sessions } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)
        .gte('start_date', startOfDay.toISOString())
        .lte('start_date', endOfDay.toISOString())

    // Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds)

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]

    // Get teacher profiles
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // Get students for these classes
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds)

    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]

    // Get student profiles
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

    // Compose the result
    const result: ClassType[] = classes.map(classData => {
        // Teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classData.id)
            .map(ct => ct.teacher_id) || []

        const teachers = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                timezone: teacher.timezone,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null
            })) || []

        // Students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                gender: student.gender,
                country: student.country,
                language: student.language,
                email: student.email || null,
                phone: student.phone || null,
                timezone: student.timezone,
                status: student.status,
                role: student.role,
                avatar_url: student.avatar_url,
                age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date || ''),
                grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
                notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
                created_at: student.created_at,
                updated_at: student.updated_at || null
            })) || []

        // Sessions for this class
        const classSessions = sessions
            ?.filter(session => session.class_id === classData.id)
            .map(session => ({
                session_id: session.id,
                start_date: session.start_date,
                end_date: session.end_date,
                status: session.status,
                created_at: session.created_at,
                updated_at: session.updated_at || null
            })) || []

        // Parse days_repeated to an array if it's a string
        let daysRepeated = classData.days_repeated
        if (typeof daysRepeated === 'string') {
            daysRepeated = daysRepeated.split(',').map(day => day.trim())
        }

        return {
            class_id: classData.id,
            title: classData.title,
            description: classData.description || null,
            subject: classData.subject,
            start_date: classData.start_date,
            end_date: classData.end_date,
            status: classData.status,
            days_repeated: daysRepeated,
            sessions: classSessions,
            class_link: classData.class_link || null,
            teachers: teachers,
            enrolled_students: enrolledStudents,
            created_at: classData.created_at,
            updated_at: classData.updated_at || null
        }
    })

    return result
}

export function TeacherRecentClasses() {
    const router = useRouter()
    const [todayClasses, setTodayClasses] = useState<ClassType[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    const classes = await getTeacherClassesToday(user.id)
                    setTodayClasses(classes)
                }
            } catch (error) {
                console.error('Error fetching classes:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchClasses()
    }, [])

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

    const handleCardClick = (classId: string, sessionId: string) => {
        router.push(`/teacher/classes/${classId}/${sessionId}`)
    }

    if (isLoading) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>Loading recent classes...</p>
            </div>
        );
    }

    if (recentSessions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No recent classes today</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {recentSessions.map((session) => {
                if (!session) return null;

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
                                        {formatDateTime(session.startDateTime, 'h:mm a')} - {formatTime(session.endDateTime, 'h:mm a')}
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
                                <StatusBadge status={convertStatusToPrefixedFormat(session.status, 'session')} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
} 