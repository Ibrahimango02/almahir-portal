"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { ModeratorSidebar } from "@/components/moderator-sidebar"
import { useEffect, useState } from "react"
import { getProfile } from "@/lib/get/get-profiles"
import { ProfileType } from "@/types"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile()
        setProfile(data)
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-overlay">
        <div className="md:pl-60">
          <main className="p-4 md:p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app-overlay">
      {profile?.role === 'moderator' ? <ModeratorSidebar /> : <AdminSidebar />}
      <div className="md:pl-60">
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
