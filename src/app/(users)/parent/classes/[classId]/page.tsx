import { ClassDetails } from "@/components/class-details"
import { notFound } from "next/navigation"
import { BackButton } from "@/components/back-button"
import { getClassById } from "@/lib/get/get-classes"
import { getParentStudents } from "@/lib/get/get-parents"
import { createClient } from "@/utils/supabase/server"

export default async function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
    // Fetch the class data using the class ID
    const { classId } = await params

    const classData = await getClassById(classId)

    // If class not found, show 404 page
    if (!classData) {
        notFound()
    }

    // Fetch the parent's associated students
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let userParentStudents: string[] = []
    if (user) {
        const parentStudents = await getParentStudents(user.id)
        if (parentStudents) {
            userParentStudents = parentStudents.map(student => student.student_id)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <BackButton href="/parent/classes" label="Back to Classes" />
            </div>

            <ClassDetails classData={classData} userRole="parent" userParentStudents={userParentStudents} />
        </div>
    )
}
