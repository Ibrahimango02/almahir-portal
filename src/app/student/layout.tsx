import type React from "react"
import { StudentSidebar } from "@/components/student-sidebar"

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <StudentSidebar />
            <div className="md:pl-60">
                <main className="p-4 md:p-6">{children}</main>
            </div>
        </div>
    )
}
