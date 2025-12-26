"use client"

import { SessionReports } from "@/components/session-reports"
import { getParentSessionHistoryForReports } from "@/lib/get/get-session-history"
import { createClient } from "@/utils/supabase/client"

export default function ParentReportsPage() {
    const getCurrentParentId = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        return user?.id || null
    }

    return (
        <SessionReports
            fetchSessions={async (userId) => {
                if (!userId) return []
                return await getParentSessionHistoryForReports(userId)
            }}
            basePath="/parent/classes"
            requiresUserId={true}
            getUserId={getCurrentParentId}
        />
    )
}


