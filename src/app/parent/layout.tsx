import type React from "react"
import { ParentSidebar } from "@/components/parent-sidebar"
import { StudentSwitcherProvider } from "@/contexts/StudentSwitcherContext"

export default function ParentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <StudentSwitcherProvider>
            <div className="min-h-screen bg-app-overlay">
                <ParentSidebar />
                <div className="md:pl-60">
                    <main className="p-4 md:p-6">{children}</main>
                </div>
            </div>
        </StudentSwitcherProvider>
    )
}
