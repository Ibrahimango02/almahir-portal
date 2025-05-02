import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { TeacherStudentsTable } from "@/components/teacher-students-table"

export default function TeacherStudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Your Students</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search students..." className="w-full pl-8" />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Students</CardTitle>
          <CardDescription>Manage your students and view their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherStudentsTable />
        </CardContent>
      </Card>
    </div>
  )
}
