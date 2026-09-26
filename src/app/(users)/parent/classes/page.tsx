"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { ClassesContent } from "@/components/classes-content"

export default function ParentClassesPage() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        const getCurrentUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
            }
        }

        getCurrentUser()
    }, [])

    if (!currentUserId) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p>Loading...</p>
            </div>
        )
    }

    return <ClassesContent currentUserId={currentUserId} />
}
