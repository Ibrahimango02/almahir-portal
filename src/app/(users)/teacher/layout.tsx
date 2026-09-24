import type React from "react"
import { TeacherSidebar } from "@/components/teacher-sidebar"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-app-overlay">
      <TeacherSidebar />
      <div className="md:pl-60">
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
