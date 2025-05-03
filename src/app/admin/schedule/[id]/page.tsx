import { ClassDetails } from "@/components/class-details"
import { notFound } from "next/navigation"
import { BackButton } from "@/components/back-button"
import { getClassSessionById } from "@/lib/get-classes"

export default async function ClassPage({ params }: { params: { id: string } }) {
  // Fetch the class data using the session ID
  const { id } = await params
  const classSessionData = await getClassSessionById(id)

  // If class not found, show 404 page
  if (!classSessionData) {
    notFound()
  }

  // Transform the data to match the expected structure for ClassDetails
  const classData = {
    sessionId: classSessionData.sessionId,
    title: classSessionData.title,
    description: classSessionData.description || "",
    subject: classSessionData.subject,
    start_time: classSessionData.start_time,
    end_time: classSessionData.end_time,
    status: classSessionData.status,
    class_link: classSessionData.class_link,
    teacher_id: classSessionData.teachers[0]?.id,
    teacher: classSessionData.teachers[0],
    enrolled_students: classSessionData.enrolled_students || []
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href="/admin/schedule" label="Back to Schedule" />
      </div>

      <ClassDetails classData={classData} />
    </div>
  )
}
