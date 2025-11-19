"use client"

import { useEffect, useState, useMemo } from "react"
import { ModeratorsTable } from "@/components/moderators-table"
import { getModerators } from "@/lib/get/get-profiles"
import { ProfileType } from "@/types"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function ModeratorsPage() {
    const [moderators, setModerators] = useState<ProfileType[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

    useEffect(() => {
        const fetchModerators = async () => {
            try {
                const data = await getModerators()
                setModerators(data)
            } catch (error) {
                console.error("Failed to fetch moderators:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchModerators()
    }, [])

    // Debounce search query to avoid filtering on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 300) // 300ms delay

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Memoize filtered moderators to avoid recalculating on every render
    const filteredModerators = useMemo(() => {
        if (!debouncedSearchQuery.trim()) return moderators

        const searchLower = debouncedSearchQuery.toLowerCase()
        return moderators.filter(moderator => {
            const fullName = `${moderator.first_name} ${moderator.last_name}`.toLowerCase()
            return (
                fullName.includes(searchLower) ||
                moderator.first_name.toLowerCase().includes(searchLower) ||
                moderator.last_name.toLowerCase().includes(searchLower) ||
                (moderator.email?.toLowerCase().includes(searchLower) ?? false) ||
                (moderator.phone?.toLowerCase().includes(searchLower) ?? false) ||
                moderator.status.toLowerCase().includes(searchLower)
            )
        })
    }, [debouncedSearchQuery, moderators])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Moderators</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search moderators..."
                            className="w-full pl-8 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="p-6">
                <ModeratorsTable moderators={filteredModerators} loading={loading} />
            </div>
        </div>
    )
} 