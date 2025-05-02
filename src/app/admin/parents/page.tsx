import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { ParentsTable } from "@/components/parents-table"
import Link from "next/link"


export default function ParentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Parents</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search parents..." className="w-full pl-8" />
          </div>
          <Link href="/admin/parents/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Parent
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Parents</CardTitle>
          <CardDescription>Manage parent information and student relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <ParentsTable />
        </CardContent>
      </Card>
    </div>
  )
}
