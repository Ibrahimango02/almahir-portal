"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { BookOpen, CalendarDays, LogOut, Menu, MoreVertical, Settings, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { logout } from "@/lib/auth-actions"

const routes = [
  {
    label: "Classes",
    icon: BookOpen,
    href: "/student/classes",
    color: "text-sky-600",
  },
  {
    label: "Schedule",
    icon: CalendarDays,
    href: "/student/schedule",
    color: "text-violet-600",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/student/settings",
    color: "text-gray-600",
  },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

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
          "fixed inset-y-0 left-0 z-40 flex-col bg-white border-r border-gray-200 shadow-sm w-60 transition-transform duration-300 md:translate-x-0",
          "dark:bg-[#16161a] dark:border-gray-800/60 dark:shadow-gray-950/50",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col items-center justify-center p-4 border-b border-gray-200 dark:border-gray-800/60">
          <Link href="/student/classes" className="flex flex-col items-center justify-center w-full">
            <div className="relative w-12 h-12 overflow-hidden rounded-full bg-white dark:bg-gray-900">
              <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={48} height={48} className="object-cover" />
            </div>
            <h1 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-50">Al-Mahir</h1>
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
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeToggle />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between rounded-lg px-3 py-2 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Emma Smith</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Student</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLogout(!showLogout)}
                  className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              {showLogout && (
                <div className="absolute right-0 mt-1 w-36 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
