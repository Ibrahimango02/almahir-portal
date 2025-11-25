"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/textarea"
import { CountrySelect } from "@/components/country-select"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function RegisterPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        country: "",
        whatsapp: "",
        comments: "",
    })
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit registration")
            }

            toast({
                title: "Registration Request Sent",
                description: "Thank you for your registration. We will contact you soon.",
            })

            // Reset form
            setFormData({
                name: "",
                email: "",
                country: "",
                whatsapp: "",
                comments: "",
            })
        } catch (error) {
            toast({
                title: "Registration Failed",
                description: error instanceof Error ? error.message : "Please try again later.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header Section with White Background */}
            <div className="bg-white relative overflow-hidden">
                {/* Geometric Pattern Overlay - Islamic geometric pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%233d8f5b' stroke-width='2' opacity='0.6'%3E%3Cpath d='M50 0 L60 20 L80 20 L65 35 L70 55 L50 45 L30 55 L35 35 L20 20 L40 20 Z'/%3E%3Cpath d='M0 50 L20 40 L20 20 L35 35 L55 30 L45 50 L55 70 L35 65 L20 80 L20 60 Z'/%3E%3Cpath d='M50 100 L40 80 L20 80 L35 65 L30 45 L50 55 L70 45 L65 65 L80 80 L60 80 Z'/%3E%3Cpath d='M100 50 L80 60 L80 80 L65 65 L45 70 L55 50 L45 30 L65 35 L80 20 L80 40 Z'/%3E%3C/g%3E%3Ccircle cx='50' cy='50' r='3' fill='%233d8f5b' opacity='0.4'/%3E%3C/svg%3E")`,
                        backgroundSize: '100px 100px'
                    }}
                />

                {/* Logo and Title */}
                <div className="relative z-10 flex flex-col items-center justify-center py-12 px-4">
                    <div className="relative w-32 h-32 mb-4">
                        <Image
                            src="/logo.png"
                            alt="Al-Mahir Academy Logo"
                            width={128}
                            height={128}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-[#1a4d2e] mb-2">Almahahir Quran Academy</h1>
                    <p className="text-xl text-[#3d8f5b]">أكاديمية الماهر بالقرآن</p>
                </div>
            </div>

            {/* Registration Form Section */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4">
                <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
                        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                            Registration Form
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[#3d8f5b] font-medium">
                                    *Name
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]"
                                    placeholder="Enter your full name"
                                />
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[#3d8f5b] font-medium">
                                    *Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            {/* Country Field */}
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-[#3d8f5b] font-medium">
                                    *Country
                                </Label>
                                <div className="[&_button]:bg-[#e8f5e9] [&_button]:border-[#3d8f5b] [&_button]:text-gray-900 [&_button:hover]:bg-[#d4e6d5] [&_button:hover]:border-[#2d6f4a]">
                                    <CountrySelect
                                        value={formData.country}
                                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                                        placeholder="Select a country"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* WhatsApp Field */}
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp" className="text-[#3d8f5b] font-medium">
                                    *WhatsApp
                                </Label>
                                <Input
                                    id="whatsapp"
                                    name="whatsapp"
                                    type="text"
                                    required
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]"
                                    placeholder="Enter your WhatsApp number"
                                />
                            </div>

                            {/* Comments Field */}
                            <div className="space-y-2">
                                <Label htmlFor="comments" className="text-[#3d8f5b] font-medium">
                                    Comments
                                </Label>
                                <Textarea
                                    id="comments"
                                    name="comments"
                                    value={formData.comments}
                                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                    className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b] min-h-[100px]"
                                    placeholder="Any additional comments or questions..."
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isSubmitting || !formData.name || !formData.email || !formData.country || !formData.whatsapp}
                                className="w-full bg-[#3d8f5b] hover:bg-[#2d6f4a] text-white font-semibold py-6 text-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Registration"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

