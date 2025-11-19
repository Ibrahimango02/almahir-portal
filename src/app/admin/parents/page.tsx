"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ParentsTable } from "@/components/parents-table"
import { useState, useEffect, useMemo } from "react"
import { ParentType } from "@/types"
import { getParents } from "@/lib/get/get-parents"

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoading(true)
        const data = await getParents()
        setParents(data)
      } catch (error) {
        console.error('Error fetching parents:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchParents()
  }, [])

  // Debounce search query to avoid filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Memoize filtered parents to avoid recalculating on every render
  const filteredParents = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return parents

    const searchLower = debouncedSearchQuery.toLowerCase()
    return parents.filter(parent => {
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
  }, [debouncedSearchQuery, parents])

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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading parents...</p>
            </div>
          </div>
        ) : (
          <ParentsTable parents={filteredParents} />
        )}
      </div>
    </div>
  )
}
