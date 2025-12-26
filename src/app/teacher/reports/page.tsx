"use client"

import { SessionReports } from "@/components/session-reports"
import { getTeacherSessionHistoryForReports } from "@/lib/get/get-session-history"
import { createClient } from "@/utils/supabase/client"

export default function TeacherReportsPage() {
    const getCurrentTeacherId = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        return user?.id || null
    }

    return (
        <SessionReports
            fetchSessions={async (userId) => {
                if (!userId) return []
                return await getTeacherSessionHistoryForReports(userId)
            }}
            basePath="/teacher/classes"
            requiresUserId={true}
            getUserId={getCurrentTeacherId}
        />
    )
}

