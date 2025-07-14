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
    days_repeated: DaysRepeated
    sessions: SessionType[]
    class_link: string | null
    teachers: TeacherType[]
    enrolled_students: StudentType[]
    times?: Record<string, { start: string; end: string }>
    created_at: string
    updated_at: string | null
}

export type SessionType = {
    session_id: string
    start_date: string // ISO datetime in UTC (timestamptz)
    end_date: string // ISO datetime in UTC (timestamptz)
    status: string
    cancellation_reason?: string
    cancelled_by?: string | null
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
    cancellation_reason?: string
    cancelled_by?: string | null
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

export type DaysRepeated = {
    monday?: TimeSlot
    tuesday?: TimeSlot
    wednesday?: TimeSlot
    thursday?: TimeSlot
    friday?: TimeSlot
    saturday?: TimeSlot
    sunday?: TimeSlot
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

export type StudentAttendanceType = {
    session_id: string
    student_id: string
    attendance_status: string
    created_at: string
    updated_at: string | null
}

export type TeacherAttendanceType = {
    session_id: string
    teacher_id: string
    attendance_status: string
    created_at: string
    updated_at: string | null
}

// New types for subscription system
export type SubscriptionType = {
    id: string
    name: string
    hours_per_month: number
    rate: number
    hourly_rate: number
    max_free_absences: number
    total_amount: number | null
    created_at: string
    updated_at: string | null
}

export type StudentSubscriptionType = {
    id: string
    student_id: string
    subscription_id: string
    start_date: string
    end_date: string
    status: string
    free_absences_remaining: number | null
    created_at: string
    updated_at: string | null
    // Joined data
    subscription?: SubscriptionType
    student?: StudentType
}

// Billing calculation types
export type BillingCalculationType = {
    student_id: string
    subscription_id: string
    billing_period_start: string
    billing_period_end: string
    total_hours_scheduled: number
    total_hours_attended: number
    free_absences_used: number
    max_free_absences: number
    hourly_rate: number
    total_amount: number
    sessions_attended: number
    sessions_scheduled: number
}

export type StudentSessionNotesType = {
    id: string
    session_id: string
    student_id: string
    notes: string | null
    performance_rating: number | null
    participation_level: number | null
    created_at: string
    updated_at: string
}

export type SessionRemarksType = {
    id: string
    session_id: string
    session_summary: string
    created_at: string
    updated_at: string
}

export type SessionRemarksWithTeacherType = SessionRemarksType & {
    teacher: {
        first_name: string
        last_name: string
        avatar_url?: string | null
    }
}

export type StudentSessionNotesWithStudentType = StudentSessionNotesType & {
    student: {
        first_name: string
        last_name: string
        avatar_url?: string | null
    }
}

export type SessionHistoryType = {
    id: string
    session_id: string
    actual_start_time: string | null
    actual_end_time: string | null
    duration: string | null // PostgreSQL interval as string
    notes: string | null
    created_at: string
    updated_at: string | null
}