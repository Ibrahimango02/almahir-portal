"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  CalendarDays,
  Receipt,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  MoreVertical,
  Settings,
  User,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { logout } from "@/lib/auth/auth-actions"
import { getProfile } from "@/lib/get/get-profiles"
import { ProfileType } from "@/types"

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/student/dashboard",
    color: "text-green-600",
  },
  {
    label: "Schedule",
    icon: CalendarDays,
    href: "/student/schedule",
    color: "text-green-600",
  },
  {
    label: "Classes",
    icon: BookOpen,
    href: "/student/classes",
    color: "text-green-600",
  },
  {
    label: "Resources",
    icon: FolderOpen,
    href: "/student/resources",
    color: "text-green-600",
  },
  {
    label: "Invoices",
    icon: Receipt,
    href: "/student/invoices",
    color: "text-green-600",
  },
  // Removed Settings from sidebar
]

export function StudentSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
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

  // Only show the sidebar on student pages
  const isStudentPage = pathname.startsWith("/student")

  if (!isStudentPage) {
    return null
  }

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="rounded-full dark:bg-[#16161a]/80 dark:border-gray-700 dark:hover:bg-[#16161a]"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex-col bg-white border-r border-gray-200 shadow-sm w-60 transition-transform duration-300 md:translate-x-0 overflow-y-auto max-h-screen",
          "dark:bg-[#16161a] dark:border-gray-800/60 dark:shadow-gray-950/50",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col items-center justify-center p-4 border-b border-gray-200 dark:border-gray-800/60">
          <Link href="/student/dashboard" className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center justify-center w-full py-2">
              <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={100} height={100} className="object-contain" />
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute right-4 top-4 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col gap-1 p-4">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                pathname === route.href
                  ? "bg-gray-100 text-gray-900 font-medium dark:bg-gray-800 dark:text-gray-50"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/70 dark:hover:text-gray-200",
              )}
            >
              <route.icon className={cn("h-5 w-5", route.color)} />
              {route.label}
            </Link>
          ))}
        </div>
        <div className="mt-auto">
          <div className="p-4 border-t border-gray-200 dark:border-gray-800/60">
            <div className="relative">
              <div className="flex items-center justify-between rounded-lg px-3 py-2 dark:bg-gray-800/50">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {profile?.avatar_url ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={profile.avatar_url}
                        alt={`${profile.first_name} ${profile.last_name}`}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {isLoading ? (
                      <>
                        <div className="h-3.5 w-18 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-22 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                          {profile ? `${profile.first_name} ${profile.last_name}` : 'Loading...'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {profile?.email || 'Loading...'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLogout(!showLogout)}
                  className="h-7 w-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0 ml-1"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              {showLogout && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-34 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      href="/student/settings"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowLogout(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
