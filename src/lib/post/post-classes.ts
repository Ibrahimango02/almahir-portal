import { createClient } from "@/utils/supabase/client"
import { addDays, format } from 'date-fns'

type ClassData = {
    title: string
    description: string | null
    subject: string
    start_date: string
    end_date: string
    days_repeated: string[]
    status: string
    class_link: string | null
    times: Record<string, { start: string; end: string }>
    teacher_id: string[]
}

export async function createClass(classData: ClassData) {
    const supabase = createClient()

    try {
        // First, create the class record
        const { data: classRecord, error: classError } = await supabase
            .from('classes')
            .insert({
                title: classData.title,
                description: classData.description,
                subject: classData.subject,
                start_date: classData.start_date,
                end_date: classData.end_date,
                days_repeated: classData.days_repeated,
                status: 'active',
                class_link: classData.class_link
            })
            .select()
            .single()

        if (classError) {
            throw new Error(`Failed to create class: ${classError.message}`)
        }

        // Assign teacher to class
        for (const teacherId of classData.teacher_id) {
            const { error: teacherError } = await supabase
                .from('class_teachers')
                .insert({
                    class_id: classRecord.id,
                    teacher_id: teacherId
                })

            if (teacherError) {
                throw new Error(`Failed to assign teacher: ${teacherError.message}`)
            }
        }

        // Generate class sessions for each day between start and end date
        const startDate = new Date(classData.start_date)
        const endDate = new Date(classData.end_date)
        const sessions = []

        // Helper function to get day name with capital first letter
        const getDayName = (date: Date) => {
            const dayName = format(date, 'EEEE').toLowerCase()
            // Convert to capital first letter (e.g., "monday" -> "Monday")
            return dayName.charAt(0).toUpperCase() + dayName.slice(1)
        }

        // Generate sessions for each day in the date range
        let currentDate = startDate
        while (currentDate <= endDate) {
            const dayName = getDayName(currentDate)

            // Check if this day is in the days_repeated array
            if (classData.days_repeated.includes(dayName)) {
                const timeSlot = classData.times[dayName]
                if (timeSlot) {
                    try {
                        // The times are already in ISO format, so we can use them directly
                        const startDateTime = new Date(timeSlot.start)
                        const endDateTime = new Date(timeSlot.end)

                        // Validate the dates
                        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                            throw new Error(`Invalid datetime format for ${dayName}: ${timeSlot.start} - ${timeSlot.end}`)
                        }

                        // Update the date part to match the current iteration date
                        const sessionStartDate = new Date(currentDate)
                        const sessionEndDate = new Date(currentDate)

                        // Extract time components from the ISO strings
                        const startTime = startDateTime.toTimeString().split(' ')[0]
                        const endTime = endDateTime.toTimeString().split(' ')[0]

                        const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number)
                        const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number)

                        sessionStartDate.setHours(startHours, startMinutes, startSeconds, 0)
                        sessionEndDate.setHours(endHours, endMinutes, endSeconds, 0)

                        sessions.push({
                            class_id: classRecord.id,
                            start_date: sessionStartDate.toISOString(),
                            end_date: sessionEndDate.toISOString(),
                            status: 'scheduled'
                        })
                    } catch (error) {
                        console.error(`Error creating session for ${dayName}:`, error)
                        throw new Error(`Failed to create session for ${dayName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
                    }
                }
            }

            // Move to next day
            currentDate = addDays(currentDate, 1)
        }

        // Insert all sessions
        if (sessions.length > 0) {
            const { error: sessionsError } = await supabase
                .from('class_sessions')
                .insert(sessions)

            if (sessionsError) {
                // If session creation fails, attempt to delete the class and teacher assignment
                await supabase
                    .from('class_teachers')
                    .delete()
                    .eq('class_id', classRecord.id)
                await supabase
                    .from('classes')
                    .delete()
                    .eq('id', classRecord.id)

                throw new Error(`Failed to create class sessions: ${sessionsError.message}`)
            }
        }

        return classRecord
    } catch (error) {
        console.error('Error in createClass:', error)
        throw error
    }
}