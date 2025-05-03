export type ScheduleListViewProps = {
    filter?: "morning" | "afternoon" | "evening" | "recent" | "upcoming"
    currentWeekStart?: Date
}

export type WeeklyScheduleProps = {
    filter?: "morning" | "afternoon" | "evening"
    currentWeekStart: Date
    timeRangeStart?: number
    timeRangeEnd?: number
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

// all sessions for a class
export type ClassType = {
    classId: string
    title: string
    description?: string
    subject: string
    start_date: string
    end_date: string
    days_repeated: string[]
    sessions: SessionType[]
    class_link: string
    teachers: TeacherType[]
    enrolled_students: StudentType[]
}

export type SessionType = {
    sessionId: string
    classId: string
    date: string
    status: string
    start_time: string
    end_time: string
}


// one session for a class
export type ClassSessionType = {
    sessionId: string
    title: string
    description?: string
    subject: string
    date: string
    start_time: string
    end_time: string
    status: string
    class_link: string
    teachers: TeacherType[]
    enrolled_students: StudentType[]
}