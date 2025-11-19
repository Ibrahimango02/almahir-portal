"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getAdmins } from "@/lib/get/get-profiles"
import { AdminsTable } from "@/components/admins-table"
import { useState, useEffect, useMemo } from "react"
import { AdminType } from "@/types"

export default function AdminsPage() {
    const [admins, setAdmins] = useState<AdminType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                setLoading(true)
                const data = await getAdmins()
                setAdmins(data)
            } catch (error) {
                console.error('Error fetching admins:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchAdmins()
    }, [])

    // Debounce search query to avoid filtering on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 300) // 300ms delay

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Memoize filtered admins to avoid recalculating on every render
    const filteredAdmins = useMemo(() => {
        if (!debouncedSearchQuery.trim()) return admins

        const searchLower = debouncedSearchQuery.toLowerCase()
        return admins.filter(admin => {
            const fullName = `${admin.first_name} ${admin.last_name}`.toLowerCase()
            return (
                fullName.includes(searchLower) ||
                admin.first_name.toLowerCase().includes(searchLower) ||
                admin.last_name.toLowerCase().includes(searchLower) ||
                admin.email.toLowerCase().includes(searchLower) ||
                (admin.phone?.toLowerCase().includes(searchLower) ?? false)
            )
        })
    }, [debouncedSearchQuery, admins])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Administrators</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search admins..."
                            className="w-full pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading admins...</p>
                        </div>
                    </div>
                ) : (
                    <AdminsTable admins={filteredAdmins} />
                )}
            </div>
        </div>
    )
}
