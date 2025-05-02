import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/back-button"

// This would normally come from a database
const getParentById = (id: string) => {
  const parents = [
    {
      id: "P001",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main St, Anytown, CA 12345",
      students: [
        { id: "S001", name: "Emma Smith" },
        { id: "S002", name: "Noah Smith" },
      ],
      joinDate: "2021-08-15",
    },
    {
      id: "P002",
      name: "Maria Garcia",
      email: "maria.garcia@example.com",
      phone: "+1 (555) 234-5678",
      address: "456 Oak Ave, Somewhere, CA 12345",
      students: [{ id: "S003", name: "Sophia Garcia" }],
      joinDate: "2022-01-10",
    },
  ]

  return parents.find((parent) => parent.id === id)
}

export default function ParentDetailPage({ params }: { params: { id: string } }) {
  const parent = getParentById(params.id)

  if (!parent) {
    // This would be handled by not-found.tsx in production
    return <div>Parent not found</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-4">
          <BackButton href="/admin/parents" label="Back to Parents" />
          <h1 className="text-3xl font-bold tracking-tight">{parent.name}</h1>
        </div>
        <Link href={`/admin/parents/${params.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Parent
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{parent.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{parent.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Associated Students</CardTitle>
            <CardDescription>Students linked to this parent</CardDescription>
          </CardHeader>
          <CardContent>
            {parent.students.length > 0 ? (
              <div className="space-y-4">
                {parent.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {student.id}</p>
                    </div>
                    <Link href={`/admin/students/${student.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No students associated with this parent</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Details about the parent's account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Join Date</p>
              <p className="text-sm text-muted-foreground">{new Date(parent.joinDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge variant="outline" className="mt-1">
                Active
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Number of Students</p>
              <p className="text-sm text-muted-foreground">{parent.students.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
