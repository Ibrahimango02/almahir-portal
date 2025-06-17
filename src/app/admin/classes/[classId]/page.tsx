import { ClassDetails } from "@/components/class-details"
import { notFound } from "next/navigation"
import { BackButton } from "@/components/back-button"
import { getClassById } from "@/lib/get/get-classes"

export default async function ClassPage({ params }: { params: { classId: string } }) {
    // Fetch the class data using the class ID
    const { classId } = params

    console.log(classId)
    const classData = await getClassById(classId)

    // If class not found, show 404 page
    if (!classData) {
        notFound()
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <BackButton href="/admin/classes" label="Back to Classes" />
            </div>

            <ClassDetails classData={classData} />
        </div>
    )
}
