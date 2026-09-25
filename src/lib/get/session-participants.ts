import { createClient } from '@/utils/supabase/client'

// Who took part in a session.
//
// Teachers and students are recorded per session in teacher_attendance / student_attendance
// when the session is created. Reassigning a class only rewrites the rows of its future
// sessions, so these rows keep the people a past session actually had. class_teachers /
// class_students only hold a class's *current* assignment: they are right for class pages,
// but using them for a session shows today's teacher on sessions someone else taught.

type SupabaseClient = ReturnType<typeof createClient>

type PagedQuery<T> = {
    range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
}

// PostgREST caps the length of .in() lists and returns at most 1000 rows per request
const BATCH_SIZE = 100
const PAGE_SIZE = 1000
const CONCURRENT_BATCHES = 5

// Fetches every row of a query page by page, so results are not cut off at PAGE_SIZE.
// The query must be ordered so pages don't overlap.
export async function fetchAllPages<T>(buildQuery: () => PagedQuery<T>): Promise<T[]> {
    const rows: T[] = []
    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1)
        if (error) throw error
        rows.push(...(data || []))
        if (!data || data.length < PAGE_SIZE) return rows
    }
}

// Runs an .in() query over any number of ids, a few batches at a time
export async function fetchByIds<T>(ids: string[], buildQuery: (batch: string[]) => PagedQuery<T>): Promise<T[]> {
    const batches: string[][] = []
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        batches.push(ids.slice(i, i + BATCH_SIZE))
    }

    const rows: T[] = []
    for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
        const results = await Promise.all(
            batches.slice(i, i + CONCURRENT_BATCHES).map(batch => fetchAllPages(() => buildQuery(batch)))
        )
        results.forEach(result => rows.push(...result))
    }
    return rows
}

function groupIds<T>(rows: T[], key: (row: T) => string, value: (row: T) => string): Map<string, string[]> {
    const map = new Map<string, string[]>()
    for (const row of rows) {
        const ids = map.get(key(row))
        if (!ids) {
            map.set(key(row), [value(row)])
        } else if (!ids.includes(value(row))) {
            ids.push(value(row))
        }
    }
    return map
}

type SessionRef = { id: string; class_id: string }

async function getSessionParticipantIds(
    supabase: SupabaseClient,
    sessions: SessionRef[],
    attendanceTable: 'teacher_attendance' | 'student_attendance',
    assignmentTable: 'class_teachers' | 'class_students',
    idColumn: 'teacher_id' | 'student_id'
): Promise<Map<string, string[]>> {
    const sessionIds = [...new Set(sessions.map(s => s.id))]
    const attendanceRows = await fetchByIds<Record<string, string>>(sessionIds, batch =>
        supabase.from(attendanceTable).select(`session_id, ${idColumn}`).in('session_id', batch).order('id')
    )
    const idsBySession = groupIds(attendanceRows, row => row.session_id, row => row[idColumn])

    // Sessions with no recorded rows fall back to the class's current assignment
    const unrecordedClassIds = [...new Set(sessions.filter(s => !idsBySession.has(s.id)).map(s => s.class_id))]
    const assignmentRows = await fetchByIds<Record<string, string>>(unrecordedClassIds, batch =>
        supabase.from(assignmentTable).select(`class_id, ${idColumn}`).in('class_id', batch).order('id')
    )
    const idsByClass = groupIds(assignmentRows, row => row.class_id, row => row[idColumn])

    for (const session of sessions) {
        if (!idsBySession.has(session.id)) {
            idsBySession.set(session.id, [...(idsByClass.get(session.class_id) || [])])
        }
    }
    return idsBySession
}

// session_id -> ids of the teachers of that session
export function getSessionTeacherIds(supabase: SupabaseClient, sessions: SessionRef[]) {
    return getSessionParticipantIds(supabase, sessions, 'teacher_attendance', 'class_teachers', 'teacher_id')
}

// session_id -> ids of the students of that session
export function getSessionStudentIds(supabase: SupabaseClient, sessions: SessionRef[]) {
    return getSessionParticipantIds(supabase, sessions, 'student_attendance', 'class_students', 'student_id')
}

// Ids of the sessions a teacher taught or is scheduled to teach
export async function getSessionIdsForTeacher(supabase: SupabaseClient, teacherId: string): Promise<string[]> {
    const rows = await fetchAllPages<{ session_id: string }>(() =>
        supabase.from('teacher_attendance').select('session_id').eq('teacher_id', teacherId).order('id')
    )
    return [...new Set(rows.map(row => row.session_id))]
}

// Ids of the sessions any of these students attended or are scheduled to attend
export async function getSessionIdsForStudents(supabase: SupabaseClient, studentIds: string[]): Promise<string[]> {
    const rows = await fetchByIds<{ session_id: string }>(studentIds, batch =>
        supabase.from('student_attendance').select('session_id').in('student_id', batch).order('id')
    )
    return [...new Set(rows.map(row => row.session_id))]
}
