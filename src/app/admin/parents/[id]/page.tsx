import { notFound } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, User, Calendar, Edit } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { getParentById, getParentStudents } from "@/lib/get/get-parents"
import AvatarIcon from "@/components/avatar"

export default async function ParentDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const parent = await getParentById(id)
  const parentStudents = await getParentStudents(id) ?? []

  if (!parent) {
    notFound()
    return (
      <div>
        <h2>Parent not found</h2>
        <Link href="/admin/parents">Return to Parents List</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <BackButton href="/admin/parents" label="Back to Parents" />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Parent Information Card */}
        <Card className="md:col-span-12 overflow-hidden">
          {/* Card Header with Background */}
          <CardHeader className="relative pb-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background z-0"></div>
            <div className="relative z-10 flex flex-col items-center pt-4">
              <div className="relative">
                {parent.avatar_url ? (
                  <div className="mb-4">
                    <AvatarIcon url={parent.avatar_url} size="large" />
                  </div>
                ) : (
                  <Avatar className="h-28 w-28 mb-4 border-4 border-background shadow-md">
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {parent.first_name[0]}
                      {parent.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Badge
                  className={`absolute bottom-4 right-0 capitalize px-2 py-1 ${parent.status === "active" ? "bg-green-500"
                    : parent.status === "inactive" ? "bg-amber-500"
                      : parent.status === "pending" ? "bg-blue-500"
                        : parent.status === "suspended" ? "bg-red-500"
                          : parent.status === "archived" ? "bg-gray-500"
                            : "bg-gray-500"
                    }`}
                >
                  {parent.status}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-center mt-2">
                {parent.first_name} {parent.last_name}
              </CardTitle>
              <div className="flex flex-wrap gap-2 justify-center mt-2 mb-4">
                <Badge variant="secondary" className="font-medium">
                  Parent
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  Contact Information
                </h3>
                <div className="space-y-3 pl-6">
                  <div className="flex items-start">
                    <Mail className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-all">{parent.email}</span>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{parent.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Associated Students */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  Associated Students
                </h3>
                <div className="pl-6">
                  {parentStudents.length > 0 ? (
                    <div className="space-y-4">
                      {parentStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{student.first_name} {student.last_name}</p>
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
                </div>
              </div>

              <Separator />

              {/* Account Information */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Account Information
                </h3>
                <div className="pl-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium w-32">Member Since:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(parent.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium w-32">Account Status:</span>
                      <Badge
                        className={`capitalize ${parent.status === "active" ? "bg-green-500"
                          : parent.status === "inactive" ? "bg-amber-500"
                            : parent.status === "pending" ? "bg-blue-500"
                              : parent.status === "suspended" ? "bg-red-500"
                                : parent.status === "archived" ? "bg-gray-500"
                                  : "bg-gray-500"
                          }`}
                      >
                        {parent.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
