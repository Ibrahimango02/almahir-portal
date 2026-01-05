"use client"

import { notFound, useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/back-button"
import { getModeratorById } from "@/lib/get/get-profiles"
import { updateModerator } from "@/lib/put/put-moderators"
import { ProfileType } from "@/types"

export default function EditModeratorPage() {
  const params = useParams()
  const { id } = params as { id: string }
  const { toast } = useToast()
  const router = useRouter()

  // All hooks at the top
  const [moderator, setModerator] = useState<ProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    status: "",
    phone: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const moderatorData = await getModeratorById(id)
        setModerator(moderatorData)
        if (moderatorData) {
          setFormData({
            status: moderatorData.status || "",
            phone: moderatorData.phone || "",
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
        <p>Loading moderator information...</p>
      </div>
    )
  }

  if (!moderator) {
    notFound()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await updateModerator(moderator.id, {
        status: formData.status,
        phone: formData.phone || null,
      })

      toast({
        title: "Moderator information updated",
        description: "The moderator information has been successfully updated.",
      })

      // Redirect back to moderator details page
      router.push(`/admin/moderators/${moderator.id}`)
    } catch (error) {
      console.error("Error updating moderator:", error)
      toast({
        title: "Error updating moderator",
        description: error instanceof Error ? error.message : "There was a problem updating the moderator information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/moderators/${moderator.id}`} label="Back to Moderator" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Moderator Information</CardTitle>
          <CardDescription>Update {moderator.first_name} {moderator.last_name}&apos;s information</CardDescription>
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
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href={`/admin/moderators/${moderator.id}`}>Cancel</Link>
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

