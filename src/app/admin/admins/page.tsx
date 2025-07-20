"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getAdmins } from "@/lib/get/get-profiles"
import { AdminsTable } from "@/components/admins-table"
import { useState, useEffect } from "react"
import { AdminType } from "@/types"

export default function AdminsPage() {
    const [admins, setAdmins] = useState<AdminType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredAdmins, setFilteredAdmins] = useState<AdminType[]>([])

    useEffect(() => {
        const fetchAdmins = async () => {
            const data = await getAdmins()
            setAdmins(data)
            setFilteredAdmins(data)
        }
        fetchAdmins()
    }, [])

    useEffect(() => {
        const filtered = admins.filter(admin => {
            const searchLower = searchQuery.toLowerCase()
            const fullName = `${admin.first_name} ${admin.last_name}`.toLowerCase()
            return (
                fullName.includes(searchLower) ||
                admin.first_name.toLowerCase().includes(searchLower) ||
                admin.last_name.toLowerCase().includes(searchLower) ||
                admin.email.toLowerCase().includes(searchLower) ||
                (admin.phone?.toLowerCase().includes(searchLower) ?? false)
            )
        })
        setFilteredAdmins(filtered)
    }, [searchQuery, admins])

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
                <AdminsTable admins={filteredAdmins} />
            </div>
        </div>
    )
}
