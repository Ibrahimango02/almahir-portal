import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  CheckCircle,
  Clock,
  Archive,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Calendar,
  Play,
  CalendarClock,
  BookX,
  UserX,
} from "lucide-react"

type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "suspended"
  | "archived"
  | "paid"
  | "overdue"
  | "scheduled"
  | "running"
  | "complete"
  | "rescheduled"
  | "cancelled"
  | "absence"
  | string

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Normalize status - replace "finished" with "completed"
  const normalizedStatus = status.toLowerCase() === "finished" ? "completed" : status.toLowerCase()

  // Define status-specific styles
  const statusStyles: Record<string, string> = {
    // User statuses
    active:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
    inactive:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800/60",
    pending:
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800/60",
    suspended:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800/60",
    archived: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800/60",

    // Invoice statuses
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
    overdue: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60",

    // Class statuses
    scheduled:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/60",
    running:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
    complete:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800/60",
    rescheduled:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60",
    cancelled:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60",
    absence:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800/60",

    // Fallback for any other status
    default: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-800/60",
  }

  // Get the appropriate style based on status
  const statusStyle = statusStyles[normalizedStatus] || statusStyles.default

  // Define status icons
  const StatusIcon = () => {
    switch (normalizedStatus) {
      // User status icons
      case "active":
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />
      case "inactive":
        return <XCircle className="h-3.5 w-3.5 mr-1" />
      case "pending":
        return <Clock className="h-3.5 w-3.5 mr-1" />
      case "suspended":
        return <AlertTriangle className="h-3.5 w-3.5 mr-1" />
      case "archived":
        return <Archive className="h-3.5 w-3.5 mr-1" />

      // Invoice status icons
      case "paid":
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />
      case "overdue":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />

      // Class status icons
      case "scheduled":
        return <Calendar className="h-3.5 w-3.5 mr-1" />
      case "running":
        return <Play className="h-3.5 w-3.5 mr-1" />
      case "complete":
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />
      case "rescheduled":
        return <CalendarClock className="h-3.5 w-3.5 mr-1" />
      case "cancelled":
        return <BookX className="h-3.5 w-3.5 mr-1" />
      case "absence":
        return <UserX className="h-3.5 w-3.5 mr-1" />
      default:
        return null
    }
  }

  // Display the original status text (not the normalized one)
  const displayStatus = status === "finished" ? "completed" : status

  return (
    <Badge
      className={cn(
        "font-medium border px-2.5 py-1 capitalize flex items-center justify-center",
        statusStyle,
        className,
      )}
      variant="outline"
    >
      <StatusIcon />
      {displayStatus}
    </Badge>
  )
}
