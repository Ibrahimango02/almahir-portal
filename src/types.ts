export type ScheduleListViewProps = {
    filter?: "morning" | "afternoon" | "evening" | "recent" | "upcoming"
    currentWeekStart?: Date
    searchQuery?: string
}

export type WeeklyScheduleProps = {
    filter?: "morning" | "afternoon" | "evening"
    currentWeekStart: Date
    timeRangeStart?: number
    timeRangeEnd?: number
    searchQuery?: string
}

export type ProfileType = {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    gender: string
    country: string
    language: string
    status: string
    role: string
    avatar_url: string | null
    created_at: string
    updated_at: string | null
}

export type AdminType = {
    admin_id: string
    first_name: string
    last_name: string
    gender: string
    country: string
    language: string
    email: string
    phone: string | null
    status: string
    role: string
    avatar_url: string | null
    created_at: string
    updated_at: string | null
}

export type ParentType = {
    parent_id: string
    first_name: string
    last_name: string
    gender: string
    country: string
    language: string
    email: string
    phone: string | null
    status: string
    role: string
    avatar_url: string | null
    created_at: string
    updated_at: string | null
}

export type StudentType = {
    student_id: string
    first_name: string
    last_name: string
    gender: string
    country: string
    language: string
    email: string | null
    phone: string | null
    status: string
    role: string
    avatar_url: string | null
    age: number
    grade_level: string | null
    notes: string | null
    created_at: string
    updated_at: string | null
}

export type TeacherType = {
    teacher_id: string
    first_name: string
    last_name: string
    gender: string
    country: string
    language: string
    email: string
    phone: string | null
    status: string
    role: string
    avatar_url: string | null
    specialization: string | null
    hourly_rate: number | null
    notes: string | null
    created_at: string
    updated_at: string | null
}

// all sessions for a class
export type ClassType = {
    class_id: string
    title: string
    description: string | null
    subject: string
    start_date: string // ISO datetime in UTC (timestamptz)
    end_date: string // ISO datetime in UTC (timestamptz)
    status: string
    days_repeated: string[]
    sessions: SessionType[]
    class_link: string | null
    teachers: TeacherType[]
    enrolled_students: StudentType[]
    created_at: string
    updated_at: string | null
}

export type SessionType = {
    session_id: string
    start_date: string // ISO datetime in UTC (timestamptz)
    end_date: string // ISO datetime in UTC (timestamptz)
    status: string
    created_at: string
    updated_at: string | null
}

export type ClassSessionType = {
    class_id: string
    session_id: string
    title: string
    description: string | null
    subject: string
    start_date: string // ISO datetime in UTC (timestamptz)
    end_date: string // ISO datetime in UTC (timestamptz)
    status: string
    class_link: string | null
    teachers: TeacherType[]
    enrolled_students: StudentType[]
}

export type InvoiceType = {
    invoice_id: string
    student: {
        student_id: string
        first_name: string
        last_name: string
    }
    parent: {
        parent_id: string
        first_name: string
        last_name: string
    }
    invoice_type: string
    amount: number
    currency: string
    description: string
    due_date: string
    status: string
    paid_at: string | null
    created_at: string
    updated_at: string | null
}

export type TimeSlot = {
    start: string // HH:MM format
    end: string // HH:MM format
}

export type WeeklySchedule = {
    monday: TimeSlot[]
    tuesday: TimeSlot[]
    wednesday: TimeSlot[]
    thursday: TimeSlot[]
    friday: TimeSlot[]
    saturday: TimeSlot[]
    sunday: TimeSlot[]
}

export type TeacherAvailabilityType = {
    id: string
    teacher_id: string
    weekly_schedule: WeeklySchedule
    created_at: string
    updated_at: string
}

export type ResourceType = {
    resource_id: string
    title: string
    description: string | null
    file_name: string
    file_url: string
    file_size: number | null
    file_type: string
    uploaded_by: string | null
    is_public: boolean
    created_at: string
    updated_at: string | null
}

export type ClassSessionAttendanceType = {
    session_id: string
    student_id: string
    attendance_status: string
    created_at: string
    updated_at: string | null
}