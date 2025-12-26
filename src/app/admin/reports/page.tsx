"use client"

import { SessionReports } from "@/components/session-reports"
import { getAllSessionHistoryForReports } from "@/lib/get/get-session-history"

export default function ReportsPage() {
    return (
        <SessionReports
            fetchSessions={async () => await getAllSessionHistoryForReports()}
            basePath="/admin/classes"
        />
    )
}
