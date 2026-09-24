"use client"

import { notFound, useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/back-button"
import { getStudentById } from "@/lib/get/get-students"
import { updateStudent } from "@/lib/put/put-students"
import { StudentType } from "@/types"


export default function EditStudentPage() {
  const params = useParams()
  const { id } = params as { id: string }
  const { toast } = useToast()
  const router = useRouter()

  // All hooks at the top
  const [student, setStudent] = useState<StudentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    status: "",
    notes: "",
    birth_date: "",
    payment_method: "",
    billing_name: "",
    billing_email: "",
    phone: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const student = await getStudentById(id)
        setStudent(student)
        if (student) {
          setFormData({
            status: student.status,
            notes: student.notes || "",
            birth_date: student.birth_date ? new Date(student.birth_date).toISOString().split('T')[0] : "",
            payment_method: student.payment_method || "",
            billing_name: student.billing_name || "",
            billing_email: student.billing_email || "",
            phone: student.phone || "",
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
        <p>Loading student information...</p>
      </div>
    )
  }

  if (!student) {
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
      const updateData: {
        status: string
        notes: string
        birth_date: string | null
        payment_method?: string | null
        billing_name?: string | null
        billing_email?: string | null
        phone?: string | null
      } = {
        status: formData.status,
        notes: formData.notes,
        birth_date: formData.birth_date || null,
      }

      // Only include billing fields and phone for independent students
      if (student.student_type === 'independent') {
        updateData.payment_method = formData.payment_method || null
        updateData.billing_name = formData.billing_name || null
        updateData.billing_email = formData.billing_email || null
        updateData.phone = formData.phone || null
      }

      await updateStudent(student.student_id, updateData)

      toast({
        title: "Student information updated",
        description: "The student information has been successfully updated.",
      })

      // Redirect back to student details page
      router.push(`/admin/students/${student.student_id}`)
    } catch (error) {
      console.error("Error updating student:", error)
      toast({
        title: "Error updating student",
        description: "There was a problem updating the student information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/students/${student.student_id}`} label="Back to Student" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Student Information</CardTitle>
          <CardDescription>
            Update {student.first_name} {student.last_name}&apos;s information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="birth_date">Birth Date</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleChange}
                />
              </div>

              {student.student_type === 'independent' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="billing_name">Billing Name</Label>
                      <Input
                        id="billing_name"
                        name="billing_name"
                        value={formData.billing_name}
                        onChange={handleChange}
                        placeholder="Enter billing name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_email">Billing Email</Label>
                      <Input
                        id="billing_email"
                        name="billing_email"
                        type="email"
                        value={formData.billing_email}
                        onChange={handleChange}
                        placeholder="Enter billing email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_method">Payment Method</Label>
                      <Select value={formData.payment_method} onValueChange={(value) => handleSelectChange("payment_method", value)}>
                        <SelectTrigger id="payment_method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Stripe">Stripe</SelectItem>
                          <SelectItem value="PayPal">PayPal</SelectItem>
                          <SelectItem value="Bank">Bank</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="resize-none"
                  placeholder="Add any additional notes about the student..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href={`/admin/students/${student.student_id}`}>Cancel</Link>
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
