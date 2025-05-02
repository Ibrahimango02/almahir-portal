import type React from "react"
import { Sidebar } from "@/components/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-60">
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
