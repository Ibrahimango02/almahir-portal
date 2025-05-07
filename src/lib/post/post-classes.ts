import { createClient } from "@/utils/supabase/client"
import { ClassType, ClassSessionType, TeacherType, StudentType, SessionType } from '@/types'
import { calculateAge } from '@/lib/utils'
import { addDays, format, parse, isWithinInterval } from 'date-fns'

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
    teacher_id: string
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
        const { error: teacherError } = await supabase
            .from('class_teachers')
            .insert({
                class_id: classRecord.id,
                teacher_id: classData.teacher_id
            })

        if (teacherError) {
            // If teacher assignment fails, delete the class to maintain consistency
            await supabase
                .from('classes')
                .delete()
                .eq('id', classRecord.id)
            throw new Error(`Failed to assign teacher: ${teacherError.message}`)
        }

        // Generate class sessions for each day between start and end date
        const startDate = new Date(classData.start_date)
        const endDate = new Date(classData.end_date)
        const sessions = []

        // Helper function to get day name
        const getDayName = (date: Date) => {
            return format(date, 'EEEE').toLowerCase()
        }

        // Generate sessions for each day in the date range
        let currentDate = startDate
        while (currentDate <= endDate) {
            const dayName = getDayName(currentDate)

            // Check if this day is in the days_repeated array
            if (classData.days_repeated.includes(dayName)) {
                const timeSlot = classData.times[dayName]
                if (timeSlot) {
                    sessions.push({
                        class_id: classRecord.id,
                        date: format(currentDate, 'yyyy-MM-dd'),
                        start_time: timeSlot.start,
                        end_time: timeSlot.end,
                        status: 'scheduled'
                    })
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