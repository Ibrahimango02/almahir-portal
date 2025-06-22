"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { ParentsTable } from "@/components/parents-table"
import Link from "next/link"
import { useState, useEffect } from "react"
import { ParentType } from "@/types"
import { getTeacherStudentParents } from "@/lib/get/get-parents"
import { createClient } from "@/utils/supabase/client"

export default function ParentsPage() {
    const [parents, setParents] = useState<ParentType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredParents, setFilteredParents] = useState<ParentType[]>([])
    const [isLoading, setIsLoading] = useState(true)
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

    useEffect(() => {
        const fetchParents = async () => {
            if (!currentUserId) return

            try {
                const data = await getTeacherStudentParents(currentUserId)
                setParents(data)
                setFilteredParents(data)
            } catch (error) {
                console.error("Error fetching parents:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchParents()
    }, [currentUserId])

    useEffect(() => {
        const filtered = parents.filter(parent => {
            const searchLower = searchQuery.toLowerCase()
            const fullName = `${parent.first_name} ${parent.last_name}`.toLowerCase()
            return (
                fullName.includes(searchLower) ||
                parent.first_name.toLowerCase().includes(searchLower) ||
                parent.last_name.toLowerCase().includes(searchLower) ||
                parent.email.toLowerCase().includes(searchLower) ||
                (parent.phone?.toLowerCase().includes(searchLower) ?? false) ||
                parent.country.toLowerCase().includes(searchLower) ||
                parent.language.toLowerCase().includes(searchLower) ||
                parent.status.toLowerCase().includes(searchLower) ||
                parent.gender.toLowerCase().includes(searchLower)
            )
        })
        setFilteredParents(filtered)
    }, [searchQuery, parents])

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">Parents</h1>
                </div>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Loading...</CardTitle>
                        <CardDescription>Fetching parent information...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-8">
                            <div className="text-muted-foreground">Loading parents...</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Parents</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search parents..."
                            className="w-full pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>My Students' Parents</CardTitle>
                    <CardDescription>View parents of students in your classes</CardDescription>
                </CardHeader>
                <CardContent>
                    <ParentsTable parents={filteredParents} userRole="teacher" />
                </CardContent>
            </Card>
        </div>
    )
}
