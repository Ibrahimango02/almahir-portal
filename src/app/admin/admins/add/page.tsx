"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AddAdminPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        invitationCode: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Show success message
            toast({
                title: "Invitation sent",
                description: `An invitation has been sent to ${formData.email}`,
            })

            // Redirect back to admins list
            router.push("/admin/admins")
        } catch (error) {
            toast({
                title: "Error",
                description: "There was a problem sending the invitation. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <Link
                    href="/admin/admins"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Administrators
                </Link>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">Add Administrator</h1>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Invite a New Administrator</CardTitle>
                    <CardDescription>Send an invitation to an administrator to join the Al-Mahir Academy Portal.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="Enter administrator's full name"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter administrator's email address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invitationCode">Invitation Code</Label>
                            <Input
                                id="invitationCode"
                                name="invitationCode"
                                placeholder="Enter invitation code"
                                value={formData.invitationCode}
                                onChange={handleChange}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                The invitation code will be included in the email sent to the administrator.
                            </p>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" onClick={() => router.push("/admin/admins")}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                            {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
