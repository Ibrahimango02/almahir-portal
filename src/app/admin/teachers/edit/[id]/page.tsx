"use client"

import { notFound, useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/back-button"
import { getTeacherById } from "@/lib/get/get-teachers"
import { updateTeacher } from "@/lib/put/put-teachers"
import { getAdminsAndModerators } from "@/lib/get/get-profiles"
import { TeacherType, AdminType } from "@/types"

export default function EditTeacherPage() {
    const params = useParams()
    const { id } = params as { id: string }
    const { toast } = useToast()
    const router = useRouter()

    // All hooks at the top
    const [teacher, setTeacher] = useState<TeacherType | null>(null)
    const [moderators, setModerators] = useState<AdminType[]>([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        specialization: "",
        hourly_rate: "",
        notes: "",
        moderator_id: "",
        class_link: "",
        status: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        async function fetchData() {
            try {
                const [teacherData, moderatorsData] = await Promise.all([
                    getTeacherById(id),
                    getAdminsAndModerators()
                ])

                setTeacher(teacherData)
                setModerators(moderatorsData)

                if (teacherData) {
                    setFormData({
                        specialization: teacherData.specialization || "",
                        hourly_rate: teacherData.hourly_rate?.toString() || "",
                        notes: teacherData.notes || "",
                        moderator_id: teacherData.moderator_id || "none",
                        class_link: teacherData.class_link || "",
                        status: teacherData.status,
                    })
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p>Loading teacher information...</p>
            </div>
        )
    }

    if (!teacher) {
        notFound()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Convert "none" moderator_id back to empty string for the API
            const submitData = {
                ...formData,
                moderator_id: formData.moderator_id === "none" ? "" : formData.moderator_id
            }

            await updateTeacher(teacher.teacher_id, submitData)

            toast({
                title: "Teacher information updated",
                description: "The teacher information has been successfully updated.",
            })

            // Redirect back to teacher details page
            router.push(`/admin/teachers/${teacher.teacher_id}`)

        } catch (error) {
            console.error("Error updating teacher:", error)
            toast({
                title: "Error updating teacher",
                description: "There was a problem updating the teacher information. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <BackButton href={`/admin/teachers/${teacher.teacher_id}`} label="Back to Teacher" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Teacher Information</CardTitle>
                    <CardDescription>
                        Update {teacher.first_name} {teacher.last_name}&apos;s information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="specialization">Specialization</Label>
                                <Input
                                    id="specialization"
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleChange}
                                    placeholder="e.g., Mathematics, Physics, English"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hourly_rate">Hourly Rate</Label>
                                <Input
                                    id="hourly_rate"
                                    name="hourly_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.hourly_rate}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="moderator_id">Moderator</Label>
                                <Select
                                    value={formData.moderator_id}
                                    onValueChange={(value) => handleSelectChange("moderator_id", value)}
                                >
                                    <SelectTrigger id="moderator_id">
                                        <SelectValue placeholder="Select moderator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No moderator assigned</SelectItem>
                                        {moderators.map((moderator) => (
                                            <SelectItem key={moderator.admin_id} value={moderator.admin_id}>
                                                {moderator.first_name} {moderator.last_name} ({moderator.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="class_link">Class Link</Label>
                            <Input
                                id="class_link"
                                name="class_link"
                                type="url"
                                value={formData.class_link}
                                onChange={handleChange}
                                placeholder="https://example.com/meeting-room"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                                className="resize-none"
                                placeholder="Add any additional notes about the teacher..."
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button variant="outline" asChild>
                                <Link href={`/admin/teachers/${teacher.teacher_id}`}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="gap-2" style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
} 