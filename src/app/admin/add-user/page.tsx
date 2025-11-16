"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

export default function AddUserPage() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: '',
        phone: '',
        gender: '',
        country: '',
        language: '',
        status: 'active',
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate required fields
        if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.role) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create user')
            }

            toast({
                title: "Success",
                description: `User ${data.user.email} created successfully!`,
            })

            // Reset form
            setFormData({
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                role: '',
                phone: '',
                gender: '',
                country: '',
                language: '',
                status: 'active',
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create user'
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Add User (Temporary)</h1>
                <p className="text-muted-foreground mt-2">
                    Manually add users to the database. This is a temporary page for administrative purposes.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Information</CardTitle>
                    <CardDescription>
                        Enter the user details below. Fields marked with * are required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="text"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    required
                                />
                            </div>

                            {/* First Name */}
                            <div className="space-y-2">
                                <Label htmlFor="first_name">
                                    First Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="first_name"
                                    type="text"
                                    placeholder="John"
                                    value={formData.first_name}
                                    onChange={(e) => handleChange('first_name', e.target.value)}
                                    required
                                />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <Label htmlFor="last_name">
                                    Last Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    placeholder="Doe"
                                    value={formData.last_name}
                                    onChange={(e) => handleChange('last_name', e.target.value)}
                                    required
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role">
                                    Role <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => handleChange('role', value)}
                                    required
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="moderator">Moderator</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="parent">Parent</SelectItem>
                                        <SelectItem value="student">Student</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleChange('status', value)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+1234567890"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                />
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => handleChange('gender', value)}
                                >
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Country */}
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    type="text"
                                    placeholder="United States"
                                    value={formData.country}
                                    onChange={(e) => handleChange('country', e.target.value)}
                                />
                            </div>

                            {/* Language */}
                            <div className="space-y-2">
                                <Label htmlFor="language">Language</Label>
                                <Input
                                    id="language"
                                    type="text"
                                    placeholder="English"
                                    value={formData.language}
                                    onChange={(e) => handleChange('language', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFormData({
                                        email: '',
                                        password: '',
                                        first_name: '',
                                        last_name: '',
                                        role: '',
                                        phone: '',
                                        gender: '',
                                        country: '',
                                        language: '',
                                        status: 'active',
                                    })
                                }}
                                disabled={loading}
                            >
                                Reset
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Creating...' : 'Create User'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

