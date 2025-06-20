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
  BookX,
  UserX,
} from "lucide-react"

type StatusType =
  | "user-active"
  | "user-inactive"
  | "user-pending"
  | "user-suspended"
  | "user-archived"
  | "class-active"
  | "class-archived"
  | "session-scheduled"
  | "session-running"
  | "session-pending"
  | "session-complete"
  | "session-cancelled"
  | "session-absence"
  | "invoice-paid"
  | "invoice-pending"
  | "invoice-overdue"
  | "invoice-cancelled"
  | string

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {

  // Define status-specific styles matching StatusType
  const statusStyles: Record<StatusType, string> = {
    // User statuses
    "user-active":
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
    "user-inactive":
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800/60",
    "user-pending":
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800/60",
    "user-suspended":
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800/60",
    "user-archived":
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800/60",

    // Class statuses
    "class-active":
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/60",
    "class-archived":
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800/60",

    // Session statuses
    "session-scheduled":
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/60",
    "session-running":
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
    "session-pending":
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800/60",
    "session-complete":
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800/60",
    "session-cancelled":
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60",
    "session-absence":
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800/60",

    // Invoice statuses
    "invoice-paid":
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60",
    "invoice-pending":
      "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800/60",
    "invoice-overdue":
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800/60",
    "invoice-cancelled":
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800/60",

    // Fallback for any other status
    default: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-800/60",
  }

  // Get the appropriate style based on status
  const statusStyle = statusStyles[status] || statusStyles.default

  // Define status icons
  const StatusIcon = () => {
    switch (status) {
      // User status icons
      case "user-active":
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />
      case "user-inactive":
        return <XCircle className="h-3.5 w-3.5 mr-1" />
      case "user-pending":
        return <Clock className="h-3.5 w-3.5 mr-1" />
      case "user-suspended":
        return <AlertTriangle className="h-3.5 w-3.5 mr-1" />
      case "user-archived":
        return <Archive className="h-3.5 w-3.5 mr-1" />

      // Class status icons
      case "class-active":
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />
      case "class-archived":
        return <Archive className="h-3.5 w-3.5 mr-1" />

      // Session status icons
      case "session-scheduled":
        return <Calendar className="h-3.5 w-3.5 mr-1" />
      case "session-running":
        return <Play className="h-3.5 w-3.5 mr-1" />
      case "session-pending":
        return <Clock className="h-3.5 w-3.5 mr-1" />
      case "session-complete":
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />
      case "session-cancelled":
        return <BookX className="h-3.5 w-3.5 mr-1" />
      case "session-absence":
        return <UserX className="h-3.5 w-3.5 mr-1" />

      // Invoice status icons
      case "invoice-paid":
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />
      case "invoice-pending":
        return <Clock className="h-3.5 w-3.5 mr-1" />
      case "invoice-overdue":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />
      case "invoice-cancelled":
        return <Archive className="h-3.5 w-3.5 mr-1" />
      default:
        return null
    }
  }

  // Get display text by removing the prefix
  const getDisplayText = (status: string) => {
    const parts = status.split('-')
    if (parts.length > 1) {
      return parts.slice(1).join('-')
    }
    return status
  }

  return (
    <Badge
      className={cn(
        "font-medium border px-1.5 py-1 capitalize flex items-center justify-center",
        statusStyle,
        className,
      )}
      variant="outline"
    >
      <StatusIcon />
      {getDisplayText(status)}
    </Badge>
  )
}
