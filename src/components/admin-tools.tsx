"use client"

import { useState } from "react"
import { CalendarDays, ClipboardList } from "lucide-react"
import { AdminClassSessionsTool } from "@/components/admin-class-sessions-tool"
import { AdminRegistrationsTool } from "@/components/admin-registrations-tool"
import { cn } from "@/lib/utils"

const tools = [
    { id: "class_sessions", label: "Class Sessions", icon: CalendarDays, Component: AdminClassSessionsTool },
    { id: "registrations", label: "Registrations", icon: ClipboardList, Component: AdminRegistrationsTool },
]

export function AdminTools() {
    const [activeToolId, setActiveToolId] = useState(tools[0].id)
    const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0]

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Tools</h1>
                <p className="text-sm text-muted-foreground mt-1">Tool: {activeTool.id}</p>
            </div>

            <div role="tablist" aria-label="Admin tools" className="flex flex-wrap gap-2">
                {tools.map((tool) => {
                    const Icon = tool.icon
                    const isActive = tool.id === activeTool.id
                    return (
                        <button
                            key={tool.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveToolId(tool.id)}
                            className={cn(
                                "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "border-[#3d8f5b] bg-[#3d8f5b] text-white"
                                    : "bg-white hover:bg-[#3d8f5b]/10"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tool.label}
                        </button>
                    )
                })}
            </div>

            <activeTool.Component key={activeTool.id} />
        </div>
    )
}
