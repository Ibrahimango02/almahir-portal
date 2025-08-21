import { CheckCircle, HelpCircle, CircleX } from "lucide-react"

interface AttendanceStatusBadgeProps {
    status: string
    size?: "sm" | "md"
}

export function AttendanceStatusBadge({ status, size = "sm" }: AttendanceStatusBadgeProps) {
    // Don't display anything if status is "scheduled"
    if (status === 'scheduled') {
        return null
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'present':
                return {
                    icon: CheckCircle,
                    className: "text-green-600"
                }
            case 'absent':
                return {
                    icon: CircleX,
                    className: "text-red-600"
                }
            default:
                return {
                    icon: HelpCircle,
                    className: "text-gray-600"
                }
        }
    }

    const config = getStatusConfig(status)
    const Icon = config.icon

    return (
        <div className={`${config.className} ${size === "sm" ? "h-4 w-4" : "h-5 w-5"}`}>
            <Icon className="h-full w-full" />
        </div>
    )
} 