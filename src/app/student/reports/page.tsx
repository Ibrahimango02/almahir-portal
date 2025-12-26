"use client"

import { SessionReports } from "@/components/session-reports"
import { getStudentSessionHistoryForReports } from "@/lib/get/get-session-history"
import { createClient } from "@/utils/supabase/client"
import { getStudentId } from "@/lib/get/get-students"

export default function StudentReportsPage() {
    const getCurrentStudentId = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            // Map auth user (profile) ID to student ID in students table
            const studentId = await getStudentId(user.id)
            return studentId || null
        }
        return null
    }

    return (
        <SessionReports
            fetchSessions={async (userId) => {
                if (!userId) return []
                return await getStudentSessionHistoryForReports(userId)
            }}
            basePath="/student/classes"
            requiresUserId={true}
            getUserId={getCurrentStudentId}
        />
    )
}


