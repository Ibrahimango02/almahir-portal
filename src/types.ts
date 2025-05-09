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

export type AdminType = {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    status: string
    created_at: string
}

export type ParentType = {
    parent_id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    status: string
    created_at: string
}

export type StudentType = {
    student_id: string
    first_name: string
    last_name: string
    email: string | null
    age: number
    grade_level: string | null
    status: string,
    notes: string | null
    created_at: string
}

export type TeacherType = {
    teacher_id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    status: string
    specialization: string
    hourly_rate: number
    notes: string | null
    created_at: string
}

// all sessions for a class
export type ClassType = {
    class_id: string
    title: string
    description: string | null
    subject: string
    start_date: string
    end_date: string
    status: string
    days_repeated: string[]
    sessions: SessionType[]
    class_link: string | null
    teachers: TeacherType[]
    enrolled_students: StudentType[]
    created_at: string
}

export type SessionType = {
    session_id: string
    date: string
    status: string
    start_time: string
    end_time: string
}

export type ClassSessionType = {
    class_id: string
    session_id: string
    title: string
    description: string | null
    subject: string
    date: string
    start_time: string
    end_time: string
    status: string
    class_link: string
    teachers: TeacherType[]
    enrolled_students: StudentType[]
}