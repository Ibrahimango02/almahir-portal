"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { ParentsTable } from "@/components/parents-table"
import Link from "next/link"
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
          <Button
            asChild
            style={{ backgroundColor: "#3d8f5b", color: "white" }}
          >
            <Link href="/admin/parents/add" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Parent
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Parents</CardTitle>
          <CardDescription>Manage parent information and student relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <ParentsTable parents={filteredParents} />
        </CardContent>
      </Card>
    </div>
  )
}
