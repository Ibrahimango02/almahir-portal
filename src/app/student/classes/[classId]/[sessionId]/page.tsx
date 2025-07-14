import { ClassSessionDetails } from "@/components/class-session-details"
import { notFound } from "next/navigation"
import { BackButton } from "@/components/back-button"
import { getSessionById } from "@/lib/get/get-classes"
import { createClient } from "@/utils/supabase/server"

export default async function ClassSessionPage({ params }: { params: Promise<{ classId: string, sessionId: string }> }) {
    // Fetch the class data using the session ID
    const { classId, sessionId } = await params
    const classSessionData = await getSessionById(sessionId)

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If class not found, show 404 page
    if (!classSessionData) {
        notFound()
    }

    // Transform the data to match the expected structure for ClassSessionDetails
    const classData = {
        class_id: classId,
        session_id: classSessionData.session_id,
        title: classSessionData.title,
        description: classSessionData.description || "",
        subject: classSessionData.subject,
        start_date: classSessionData.start_date,
        end_date: classSessionData.end_date,
        status: classSessionData.status,
        cancellation_reason: classSessionData.cancellation_reason || null,
        cancelled_by: classSessionData.cancelled_by || null,
        class_link: classSessionData.class_link,
        teachers: classSessionData.teachers || [],
        enrolled_students: classSessionData.enrolled_students || []
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <BackButton href={`/student/classes/${classId}`} label="Back to Class" />
            </div>

            <ClassSessionDetails classData={classData} userRole="student" userId={user?.id} />
        </div>
    )
}
