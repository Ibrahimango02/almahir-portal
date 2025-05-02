import type React from "react"
import { ParentSidebar } from "@/components/parent-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="md:pl-60">
        <div className="hidden md:flex fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
