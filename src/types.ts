export type ScheduleListViewProps = {
    filter?: "morning" | "afternoon" | "evening" | "recent" | "upcoming"
    currentWeekStart?: Date
}

export type StudentType = {
    id: string
    first_name: string
    last_name: string
}

export type TeacherType = {
    id: string
    first_name: string
    last_name: string
}

export type SessionStatusType = {
    id: string
    class_id: string
    date: string
    status: string
    start_time: string
    end_time: string
}

export type ClassType = {
    id: string
    title: string
    description: string
    subject: string
    start_date: string
    end_date: string
    days_repeated?: string[]
    sessions: SessionStatusType[]
    class_link?: string
    teachers: TeacherType[]
    enrolled_students: StudentType[]
}

// For displaying in the list - a class session with all needed data
export type ClassSessionType = {
    id: string
    sessionId: string
    title: string
    description: string
    subject: string
    date: string
    start_time: string
    end_time: string
    status: string
    class_link?: string
    teachers: TeacherType[]
    enrolled_students: StudentType[]
}