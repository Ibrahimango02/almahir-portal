import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, User, Calendar } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { getParentById, getParentStudentsForTeacher } from "@/lib/get/get-parents"
import AvatarIcon from "@/components/avatar"
import { createClient } from "@/utils/supabase/server"

export default async function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        notFound()
    }

    const parent = await getParentById(id)
    const parentStudents = await getParentStudentsForTeacher(id, user.id) ?? []

    if (!parent) {
        notFound()
        return (
            <div>
                <h2>Parent not found</h2>
                <Link href="/teacher/parents">Return to Parents List</Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <BackButton href="/teacher/parents" label="Back to Parents" />
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
                                    <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-md">
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                            {parent.first_name[0]}
                                            {parent.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <Badge
                                    className={`absolute bottom-4 right-0 capitalize px-2 py-1 ${parent.status === "active" ? "bg-green-600"
                                        : parent.status === "inactive" ? "bg-amber-500"
                                            : parent.status === "pending" ? "bg-blue-500"
                                                : parent.status === "suspended" ? "bg-red-600"
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
                                    My Students
                                </h3>
                                <div className="pl-6">
                                    {parentStudents.length > 0 ? (
                                        <div className="space-y-3">
                                            {parentStudents.map((student) => (
                                                <Link
                                                    key={student.student_id}
                                                    href={`/teacher/students/${student.student_id}`}
                                                    className="block"
                                                >
                                                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                                                        <Avatar className="h-10 w-10">
                                                            {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.first_name} />}
                                                            <AvatarFallback className="text-sm">
                                                                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-primary truncate">
                                                                {student.first_name} {student.last_name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">Student</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No students in your classes associated with this parent</p>
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
