import { createClient } from "@/utils/supabase/client"
import {
    AdminClassSessionsToolData,
    AdminClassSessionsToolFilters,
    AdminClassSessionsToolOption,
    AdminClassSessionsToolRow,
} from "@/types"

const BATCH_SIZE = 100

async function batchQuery<T>(
    ids: string[],
    batchSize: number,
    queryFn: (batch: string[]) => Promise<T[]>
): Promise<T[]> {
    if (ids.length === 0) return []

    const results: T[] = []
    for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize)
        const batchResults = await queryFn(batch)
        results.push(...batchResults)
    }
    return results
}

function dedupeAndSortOptions(options: AdminClassSessionsToolOption[]): AdminClassSessionsToolOption[] {
    const map = new Map<string, string>()
    options.forEach((option) => {
        if (!map.has(option.id)) {
            map.set(option.id, option.label)
        }
    })

    return Array.from(map.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label))
}

function formatPersonName(firstName?: string | null, lastName?: string | null): string {
    const fullName = `${firstName || ""} ${lastName || ""}`.trim()
    return fullName || "Unknown"
}

function buildOptionListFromIds(
    ids: Set<string>,
    labelById: Map<string, string>,
    fallbackLabel: string
): AdminClassSessionsToolOption[] {
    return Array.from(ids)
        .map((id) => ({
            id,
            label: labelById.get(id) || fallbackLabel,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
}

function intersectSets(a: Set<string> | null, b: Set<string>): Set<string> {
    if (!a) return new Set(b)
    return new Set([...a].filter((value) => b.has(value)))
}

function formatIntendedDuration(startDateIso: string, endDateIso: string): string | null {
    const start = new Date(startDateIso)
    const end = new Date(endDateIso)

    const diffMs = end.getTime() - start.getTime()
    if (Number.isNaN(diffMs) || diffMs <= 0) {
        return null
    }

    const totalMinutes = Math.round(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`
    }
    if (hours > 0) {
        return `${hours}h`
    }
    return `${minutes}m`
}

export async function getClassSessionsToolData(
    filters: AdminClassSessionsToolFilters = {},
    options: { includeRows?: boolean; page?: number; pageSize?: number } = {}
): Promise<AdminClassSessionsToolData> {
    const supabase = createClient()

    try {
        const { data: classesData, error: classesError } = await supabase
            .from("classes")
            .select("id, title")
            .order("title", { ascending: true })

        if (classesError) throw classesError

        const { data: allClassTeachers, error: allClassTeachersError } = await supabase
            .from("class_teachers")
            .select("class_id, teacher_id")
        if (allClassTeachersError) throw allClassTeachersError

        const { data: allClassStudents, error: allClassStudentsError } = await supabase
            .from("class_students")
            .select("class_id, student_id")
        if (allClassStudentsError) throw allClassStudentsError

        // Build filter options from full teacher/student datasets so unassigned users still appear.
        const { data: allTeachersData, error: allTeachersError } = await supabase
            .from("teachers")
            .select("profile_id")
        if (allTeachersError) throw allTeachersError

        const { data: allStudentsData, error: allStudentsError } = await supabase
            .from("students")
            .select("id, profile_id, student_type")
        if (allStudentsError) throw allStudentsError

        const allTeacherIds = [
            ...new Set(
                (allTeachersData || [])
                    .map((teacher) => teacher.profile_id)
                    .filter((id): id is string => Boolean(id))
            ),
        ]

        const allStudentIds = [...new Set((allStudentsData || []).map((student) => student.id))]

        const teacherProfiles = allTeacherIds.length
            ? await batchQuery(allTeacherIds, BATCH_SIZE, async (batch) => {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id, first_name, last_name")
                    .in("id", batch)
                if (error) throw error
                return data || []
            })
            : []

        const studentsData = allStudentsData || []

        const independentProfileIds = studentsData
            .filter((student) => student.student_type === "independent" && student.profile_id)
            .map((student) => student.profile_id as string)

        const studentProfiles = independentProfileIds.length
            ? await batchQuery(independentProfileIds, BATCH_SIZE, async (batch) => {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id, first_name, last_name")
                    .in("id", batch)
                if (error) throw error
                return data || []
            })
            : []

        const dependentStudentIds = studentsData
            .filter((student) => student.student_type === "dependent")
            .map((student) => student.id)

        const childProfiles = dependentStudentIds.length
            ? await batchQuery(dependentStudentIds, BATCH_SIZE, async (batch) => {
                const { data, error } = await supabase
                    .from("child_profiles")
                    .select("student_id, first_name, last_name")
                    .in("student_id", batch)
                if (error) throw error
                return data || []
            })
            : []

        const classOptions = dedupeAndSortOptions(
            (classesData || []).map((classItem) => ({
                id: classItem.id,
                label: classItem.title || "Untitled Class",
            }))
        )
        const classLabelMap = new Map(classOptions.map((option) => [option.id, option.label]))

        const teacherOptions = dedupeAndSortOptions(
            teacherProfiles.map((teacher) => ({
                id: teacher.id,
                label: formatPersonName(teacher.first_name, teacher.last_name),
            }))
        )
        const teacherLabelMap = new Map(teacherOptions.map((option) => [option.id, option.label]))

        const studentNameMap = new Map<string, string>()
        studentsData.forEach((student) => {
            if (student.student_type === "independent" && student.profile_id) {
                const profile = studentProfiles.find((p) => p.id === student.profile_id)
                if (profile) {
                    studentNameMap.set(student.id, formatPersonName(profile.first_name, profile.last_name))
                }
            }
        })
        childProfiles.forEach((childProfile) => {
            studentNameMap.set(
                childProfile.student_id,
                formatPersonName(childProfile.first_name, childProfile.last_name)
            )
        })

        const studentOptions = dedupeAndSortOptions(
            allStudentIds.map((id) => ({
                id,
                label: studentNameMap.get(id) || "Unknown Student",
            }))
        )
        const studentLabelMap = new Map(studentOptions.map((option) => [option.id, option.label]))

        let filteredClassIds: Set<string> | null = null

        if (filters.classId) {
            filteredClassIds = intersectSets(filteredClassIds, new Set([filters.classId]))
        }

        if (filters.teacherId) {
            const teacherClassIds = new Set(
                (allClassTeachers || [])
                    .filter((row) => row.teacher_id === filters.teacherId)
                    .map((row) => row.class_id)
            )
            filteredClassIds = intersectSets(filteredClassIds, teacherClassIds)
        }

        if (filters.studentId) {
            const studentClassIds = new Set(
                (allClassStudents || [])
                    .filter((row) => row.student_id === filters.studentId)
                    .map((row) => row.class_id)
            )
            filteredClassIds = intersectSets(filteredClassIds, studentClassIds)
        }

        if (filters.startDate || filters.endDate || (filters.statuses && filters.statuses.length > 0) || filters.status) {
            let classIdsBySessionFiltersQuery = supabase
                .from("class_sessions")
                .select("class_id")
                .lt("start_date", new Date().toISOString())

            if (filters.startDate) {
                classIdsBySessionFiltersQuery = classIdsBySessionFiltersQuery.gte("start_date", `${filters.startDate}T00:00:00`)
            }
            if (filters.endDate) {
                classIdsBySessionFiltersQuery = classIdsBySessionFiltersQuery.lte("start_date", `${filters.endDate}T23:59:59.999`)
            }
            if (filters.statuses && filters.statuses.length > 0) {
                classIdsBySessionFiltersQuery = classIdsBySessionFiltersQuery.in("status", filters.statuses)
            } else if (filters.status) {
                classIdsBySessionFiltersQuery = classIdsBySessionFiltersQuery.eq("status", filters.status)
            }

            const { data: classIdsBySessionFilters, error: classIdsBySessionFiltersError } = await classIdsBySessionFiltersQuery
            if (classIdsBySessionFiltersError) throw classIdsBySessionFiltersError

            const sessionFilteredClassIds = new Set(
                (classIdsBySessionFilters || [])
                    .map((session) => session.class_id)
                    .filter((id): id is string => Boolean(id))
            )
            filteredClassIds = intersectSets(filteredClassIds, sessionFilteredClassIds)
        }

        const constrainedClassIds = filteredClassIds
            ? new Set(filteredClassIds)
            : new Set((classesData || []).map((classItem) => classItem.id))
        const hasConstrainedClasses = filteredClassIds !== null

        const constrainedTeacherIds = hasConstrainedClasses
            ? new Set(
                (allClassTeachers || [])
                    .filter((row) => constrainedClassIds.has(row.class_id))
                    .map((row) => row.teacher_id)
            )
            : new Set(allTeacherIds)

        const constrainedStudentIds = hasConstrainedClasses
            ? new Set(
                (allClassStudents || [])
                    .filter((row) => constrainedClassIds.has(row.class_id))
                    .map((row) => row.student_id)
            )
            : new Set(allStudentIds)

        const constrainedClassOptions = buildOptionListFromIds(
            constrainedClassIds,
            classLabelMap,
            "Untitled Class"
        )
        const constrainedTeacherOptions = buildOptionListFromIds(
            constrainedTeacherIds,
            teacherLabelMap,
            "Unknown Teacher"
        )
        const constrainedStudentOptions = buildOptionListFromIds(
            constrainedStudentIds,
            studentLabelMap,
            "Unknown Student"
        )

        if (options.includeRows === false) {
            return {
                rows: [],
                totalItems: 0,
                classOptions: constrainedClassOptions,
                teacherOptions: constrainedTeacherOptions,
                studentOptions: constrainedStudentOptions,
            }
        }

        const page = options.page && options.page > 0 ? options.page : 1
        const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 50

        if (filteredClassIds && filteredClassIds.size === 0) {
            return {
                rows: [],
                totalItems: 0,
                classOptions: constrainedClassOptions,
                teacherOptions: constrainedTeacherOptions,
                studentOptions: constrainedStudentOptions,
            }
        }

        let sessionsQuery = supabase
            .from("class_sessions")
            .select("id, class_id, start_date, end_date, status", { count: "exact" })
            .order("start_date", { ascending: false })
            .lt("start_date", new Date().toISOString())

        if (filteredClassIds && filteredClassIds.size > 0) {
            sessionsQuery = sessionsQuery.in("class_id", [...filteredClassIds])
        }

        if (filters.startDate) {
            sessionsQuery = sessionsQuery.gte("start_date", `${filters.startDate}T00:00:00`)
        }
        if (filters.endDate) {
            sessionsQuery = sessionsQuery.lte("start_date", `${filters.endDate}T23:59:59.999`)
        }
        if (filters.statuses && filters.statuses.length > 0) {
            sessionsQuery = sessionsQuery.in("status", filters.statuses)
        } else if (filters.status) {
            sessionsQuery = sessionsQuery.eq("status", filters.status)
        }

        const rangeFrom = (page - 1) * pageSize
        const rangeTo = rangeFrom + pageSize - 1
        sessionsQuery = sessionsQuery.range(rangeFrom, rangeTo)

        const { data: sessions, error: sessionsError, count: sessionsCount } = await sessionsQuery
        if (sessionsError) throw sessionsError

        if (!sessions || sessions.length === 0) {
            return {
                rows: [],
                totalItems: sessionsCount || 0,
                classOptions: constrainedClassOptions,
                teacherOptions: constrainedTeacherOptions,
                studentOptions: constrainedStudentOptions,
            }
        }

        const sessionIds = sessions.map((session) => session.id)
        const classIds = [...new Set(sessions.map((session) => session.class_id))]

        const classTeachers = (allClassTeachers || []).filter((row) => classIds.includes(row.class_id))
        const classStudents = (allClassStudents || []).filter((row) => classIds.includes(row.class_id))

        const teacherIdsForRows = [...new Set(classTeachers.map((row) => row.teacher_id))]
        const teacherData = teacherIdsForRows.length
            ? await batchQuery(teacherIdsForRows, BATCH_SIZE, async (batch) => {
                const { data, error } = await supabase
                    .from("teachers")
                    .select("profile_id, hourly_rate, currency")
                    .in("profile_id", batch)
                if (error) throw error
                return data || []
            })
            : []

        const sessionHistory = await batchQuery(sessionIds, BATCH_SIZE, async (batch) => {
            const { data, error } = await supabase
                .from("session_history")
                .select("session_id, actual_start_time, actual_end_time, duration, created_at")
                .in("session_id", batch)
                .order("created_at", { ascending: false })
            if (error) throw error
            return data || []
        })

        const payments = await batchQuery(sessionIds, BATCH_SIZE, async (batch) => {
            const { data, error } = await supabase
                .from("teacher_payments")
                .select("session_id, amount")
                .in("session_id", batch)
            if (error) throw error
            return data || []
        })

        const sessionRemarks = await batchQuery(sessionIds, BATCH_SIZE, async (batch) => {
            const { data, error } = await supabase
                .from("session_remarks")
                .select("session_id, session_summary, created_at")
                .in("session_id", batch)
                .order("created_at", { ascending: false })
            if (error) throw error
            return data || []
        })

        const classMap = new Map((classesData || []).map((classItem) => [classItem.id, classItem.title]))
        const teacherProfileMap = new Map(
            teacherProfiles.map((teacher) => [
                teacher.id,
                formatPersonName(teacher.first_name, teacher.last_name),
            ])
        )
        const teacherRateMap = new Map(teacherData.map((teacher) => [teacher.profile_id, teacher.hourly_rate]))
        const teacherCurrencyMap = new Map(teacherData.map((teacher) => [teacher.profile_id, teacher.currency || null]))

        const latestSessionHistoryMap = new Map<string, (typeof sessionHistory)[number]>()
        sessionHistory.forEach((historyItem) => {
            if (!latestSessionHistoryMap.has(historyItem.session_id)) {
                latestSessionHistoryMap.set(historyItem.session_id, historyItem)
            }
        })

        const paymentTotalsMap = new Map<string, number>()
        payments.forEach((payment) => {
            const current = paymentTotalsMap.get(payment.session_id) || 0
            paymentTotalsMap.set(payment.session_id, current + Number(payment.amount || 0))
        })

        const latestSessionSummaryMap = new Map<string, string | null>()
        sessionRemarks.forEach((remark) => {
            if (!latestSessionSummaryMap.has(remark.session_id)) {
                latestSessionSummaryMap.set(remark.session_id, remark.session_summary || null)
            }
        })

        const rows: AdminClassSessionsToolRow[] = sessions.map((session) => {
            const teachersForClass = classTeachers
                .filter((row) => row.class_id === session.class_id)
                .map((row) => row.teacher_id)
            const studentsForClass = classStudents
                .filter((row) => row.class_id === session.class_id)
                .map((row) => row.student_id)

            const history = latestSessionHistoryMap.get(session.id)
            const teacherRateEntries = teachersForClass
                .map((id) => ({
                    rate: teacherRateMap.get(id),
                    currency: teacherCurrencyMap.get(id) || null,
                }))
                .filter((entry): entry is { rate: number; currency: string | null } => typeof entry.rate === "number")

            return {
                session_id: session.id,
                class_id: session.class_id,
                class_name: classMap.get(session.class_id) || "Unknown Class",
                teacher_ids: teachersForClass,
                teacher_names: teachersForClass.map((id) => teacherProfileMap.get(id) || "Unknown Teacher"),
                student_ids: studentsForClass,
                student_names: studentsForClass.map((id) => studentNameMap.get(id) || "Unknown Student"),
                teacher_hourly_rates: teacherRateEntries.map((entry) => entry.rate),
                teacher_hourly_rate_currencies: teacherRateEntries.map((entry) => entry.currency),
                session_date: session.start_date,
                duration: formatIntendedDuration(session.start_date, session.end_date),
                status: session.status || "",
                amount: paymentTotalsMap.has(session.id) ? paymentTotalsMap.get(session.id)! : null,
                actual_start_time: history?.actual_start_time || null,
                actual_end_time: history?.actual_end_time || null,
                session_summary: latestSessionSummaryMap.get(session.id) || null,
            }
        })

        return {
            rows,
            totalItems: sessionsCount || 0,
            classOptions: constrainedClassOptions,
            teacherOptions: constrainedTeacherOptions,
            studentOptions: constrainedStudentOptions,
        }
    } catch (error) {
        console.error("Error fetching class sessions tool data:", error)
        return {
            rows: [],
            totalItems: 0,
            classOptions: [],
            teacherOptions: [],
            studentOptions: [],
        }
    }
}
