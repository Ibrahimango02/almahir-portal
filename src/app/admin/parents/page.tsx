"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ParentsTable } from "@/components/parents-table"
import { useState, useEffect } from "react"
import { ParentType } from "@/types"
import { getParents } from "@/lib/get/get-parents"

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredParents, setFilteredParents] = useState<ParentType[]>([])

  useEffect(() => {
    const fetchParents = async () => {
      const data = await getParents()
      setParents(data)
      setFilteredParents(data)
    }
    fetchParents()
  }, [])

  useEffect(() => {
    const filtered = parents.filter(parent => {
      const searchLower = searchQuery.toLowerCase()
      const fullName = `${parent.first_name ?? ''} ${parent.last_name ?? ''}`.toLowerCase()
      return (
        fullName.includes(searchLower) ||
        (parent.first_name?.toLowerCase().includes(searchLower) ?? false) ||
        (parent.last_name?.toLowerCase().includes(searchLower) ?? false) ||
        (parent.email?.toLowerCase().includes(searchLower) ?? false) ||
        (parent.phone?.toLowerCase().includes(searchLower) ?? false) ||
        (parent.country?.toLowerCase().includes(searchLower) ?? false) ||
        (parent.language?.toLowerCase().includes(searchLower) ?? false) ||
        (parent.status?.toLowerCase().includes(searchLower) ?? false) ||
        (parent.gender?.toLowerCase().includes(searchLower) ?? false)
      )
    })
    setFilteredParents(filtered)
  }, [searchQuery, parents])

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

      <div className="p-6">
        <ParentsTable parents={filteredParents} />
      </div>
    </div>
  )
}
