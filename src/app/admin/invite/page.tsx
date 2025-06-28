"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Mail, User } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function InviteUserPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        role: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, role: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/send-invitation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim().toLowerCase(),
                    role: formData.role
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation')
            }

            // Show success message
            toast({
                title: "Invitation sent successfully!",
                description: `An invitation has been sent to ${formData.fullName}`,
            })

            // Reset form
            setFormData({ fullName: "", email: "", role: "" })

            // Redirect back to admins list after a short delay
            setTimeout(() => {
                router.push("/admin/admins")
            }, 2000)
        } catch (error) {
            console.error('Error sending invitation:', error)
            toast({
                title: "Error sending invitation",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 min-h-screen py-12 px-4 bg-background">

            <h1 className="text-4xl font-bold tracking-tight text-center mb-8">Invite User</h1>

            <Card className="max-w-4xl mx-auto w-full shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Invite a New User
                    </CardTitle>
                    <CardDescription>
                        Send an invitation email to a new user to join the Al-Mahir Academy Portal.
                        They will receive an email with instructions and an invitation code.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Full Name
                            </Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="Enter user's full name"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter user's email address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                An invitation email will be sent to this address with a secure invitation code.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={formData.role} onValueChange={handleSelectChange} disabled={isSubmitting}>
                                <SelectTrigger id="role" className="w-full">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="parent">Parent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                        <Button
                            className="cursor-pointer"
                            variant="outline"
                            type="button"
                            onClick={() => router.push("/admin/dashboard")}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="cursor-pointer"
                            type="submit"
                            disabled={isSubmitting}
                            style={{ backgroundColor: "#3d8f5b", color: "white" }}
                        >
                            {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}