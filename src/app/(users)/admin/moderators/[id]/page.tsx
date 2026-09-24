import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, Calendar, Contact, UserPen, Edit } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { BackButton } from "@/components/back-button"
import { getModeratorById, checkIfAdmin } from "@/lib/get/get-profiles"
import { getTeachersByModeratorId } from "@/lib/get/get-teachers"
import AvatarIcon from "@/components/avatar"
import { createClient } from "@/utils/supabase/server"

export default async function ModeratorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Get current user ID
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    // Check if admin
    const isAdmin = userId ? await checkIfAdmin(userId) : false;

    const { id } = await params
    const moderator = await getModeratorById(id)
    const assignedTeachers = await getTeachersByModeratorId(id) ?? []

    if (!moderator) {
        notFound()
        return (
            <div>
                <h2>Moderator not found</h2>
                <Link href="/admin/moderators">Return to Moderators List</Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <BackButton href="/admin/moderators" label="Back to Moderators" />
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Moderator Information Card - Now spans full width */}
                <Card className="md:col-span-12 overflow-hidden">
                    {/* Card Header with Background */}
                    <CardHeader className="relative pb-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background z-0"></div>
                        <div className="relative z-10 flex flex-col items-center pt-4">
                            <div className="relative">
                                {moderator.avatar_url ? (
                                    <div className="mb-4">
                                        <AvatarIcon url={moderator.avatar_url} size="large" />
                                    </div>
                                ) : (
                                    <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-md">
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                            {moderator.first_name[0]}
                                            {moderator.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <Badge
                                    className={`absolute bottom-4 right-0 capitalize px-2 py-1 ${moderator.status === "active" ? "bg-green-600"
                                        : moderator.status === "inactive" ? "bg-amber-500"
                                            : moderator.status === "pending" ? "bg-blue-500"
                                                : moderator.status === "suspended" ? "bg-red-600"
                                                    : moderator.status === "archived" ? "bg-gray-500"
                                                        : "bg-gray-500"
                                        }`}
                                >
                                    {moderator.status}
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl font-bold text-center mt-2">
                                {moderator.first_name} {moderator.last_name}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2 justify-center mt-2 mb-4">
                                <Badge variant="secondary" className="font-medium">
                                    Moderator
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <div className="space-y-6">

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-base font-semibold flex items-center mb-3">
                                    <Contact className="h-4 w-4 mr-2 text-primary" />
                                    Contact Information
                                </h3>
                                <div className="space-y-3 pl-6">
                                    <div className="flex items-start">
                                        <Mail className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm break-all">{moderator.email}</span>
                                    </div>
                                    <div className="flex items-start">
                                        <Phone className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{moderator.phone || 'Not provided'}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Assigned Teachers Section */}
                            <div>
                                <h3 className="text-base font-semibold flex items-center mb-3">
                                    <UserPen className="h-4 w-4 mr-2 text-primary" />
                                    Assigned Teachers
                                </h3>
                                <div className="pl-6">
                                    {assignedTeachers.length > 0 ? (
                                        <div className="space-y-2">
                                            {assignedTeachers.map((teacher) => (
                                                <Link
                                                    key={teacher.teacher_id}
                                                    href={`/admin/teachers/${teacher.teacher_id}`}
                                                    className="block"
                                                >
                                                    <div className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                                                        <Avatar className="h-8 w-8">
                                                            {teacher.avatar_url && <AvatarImage src={teacher.avatar_url} alt={teacher.first_name} />}
                                                            <AvatarFallback className="text-sm">
                                                                {teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-primary truncate">
                                                                {teacher.first_name} {teacher.last_name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {teacher.specialization || 'No specialization'}
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            className={`capitalize ${teacher.status.toLowerCase() === "active"
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                : teacher.status.toLowerCase() === "archived"
                                                                    ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                                                                    : teacher.status.toLowerCase() === "inactive"
                                                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                                                                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                                                                }`}
                                                        >
                                                            {teacher.status}
                                                        </Badge>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No teachers assigned to this moderator</p>
                                    )}
                                </div>
                            </div>



                            {/* Account Information */}
                            <div>
                                <h3 className="text-base font-semibold flex items-center mb-3">
                                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                                    Account Information
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                                    {format(parseISO(moderator.created_at), "MMMM d, yyyy")}
                                </p>
                            </div>
                        </div>

                        {/* Edit Button - Only for admin */}
                        {isAdmin && (
                            <Button
                                asChild
                                className="mt-6 shadow-sm transition-all hover:shadow-md"
                                style={{ backgroundColor: "#3d8f5b", color: "white" }}
                            >
                                <Link href={`/admin/moderators/edit/${moderator.id}`} className="flex items-center justify-center gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit Moderator Information
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 