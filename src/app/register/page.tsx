"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/textarea"
import { CountrySelect } from "@/components/country-select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

export default function RegisterPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        // Personal Information
        name: "",
        gender: "",
        ageCategory: "",
        age: "",
        parentGuardianName: "",
        relationToApplicant: "",
        firstLanguage: "",
        country: "",
        // Contact Information
        email: "",
        phone: "",
        whatsapp: "",
        phoneSameAsWhatsapp: false,
        // Programs
        program: "",
        classDuration: "",
        availability: [] as string[],
        // How did you hear about us
        hearAboutUs: "",
        friendName: "",
        // Comments
        comments: "",
    })
    const { toast } = useToast()

    const handlePhoneChange = (value: string) => {
        setFormData((prev) => {
            const newData = { ...prev, phone: value }
            if (prev.phoneSameAsWhatsapp) {
                newData.whatsapp = value
            }
            return newData
        })
    }

    const handlePhoneSameAsWhatsappChange = (checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            phoneSameAsWhatsapp: checked,
            whatsapp: checked ? prev.phone : prev.whatsapp,
        }))
    }

    const handleAvailabilityChange = (day: string, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            availability: checked
                ? [...prev.availability, day]
                : prev.availability.filter((d) => d !== day),
        }))
    }

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
                gender: "",
                ageCategory: "",
                age: "",
                parentGuardianName: "",
                relationToApplicant: "",
                firstLanguage: "",
                country: "",
                email: "",
                phone: "",
                whatsapp: "",
                phoneSameAsWhatsapp: false,
                program: "",
                classDuration: "",
                availability: [],
                hearAboutUs: "",
                friendName: "",
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

    const isFormValid = () => {
        const requiredFields = [
            formData.name,
            formData.gender,
            formData.ageCategory,
            formData.age,
            formData.firstLanguage,
            formData.country,
            formData.email,
            formData.phone,
            formData.whatsapp,
            formData.program,
            formData.classDuration,
            formData.availability.length > 0,
            formData.hearAboutUs,
        ]

        // If age category is less than 18, require parent/guardian fields
        if (formData.ageCategory === "less-than-18") {
            requiredFields.push(
                formData.parentGuardianName,
                formData.relationToApplicant
            )
        }

        // If hearAboutUs is recommendation, require friend name
        if (formData.hearAboutUs === "recommendation") {
            requiredFields.push(formData.friendName)
        }

        return requiredFields.every((field) => field !== "" && field !== false)
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
                    <h1 className="text-3xl font-bold text-[#1a4d2e] mb-2">Al-Mahir Quran Academy</h1>
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

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Personal Information Section */}
                            <div className="space-y-6">
                                <h3 className="text-2xl font-semibold text-[#1a4d2e] border-b-2 border-[#3d8f5b] pb-2">
                                    Personal Information
                                </h3>

                                {/* Name */}
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

                                {/* Gender */}
                                <div className="space-y-2">
                                    <Label htmlFor="gender" className="text-[#3d8f5b] font-medium">
                                        *Gender
                                    </Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                        required
                                    >
                                        <SelectTrigger className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Age Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="ageCategory" className="text-[#3d8f5b] font-medium">
                                        *Age Category
                                    </Label>
                                    <Select
                                        value={formData.ageCategory}
                                        onValueChange={(value) => setFormData({ ...formData, ageCategory: value, age: "", parentGuardianName: "", relationToApplicant: "" })}
                                        required
                                    >
                                        <SelectTrigger className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]">
                                            <SelectValue placeholder="Select age category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="less-than-18">Less than 18 years</SelectItem>
                                            <SelectItem value="18-and-above">18 years and above</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Age Field */}
                                {formData.ageCategory && (
                                    <div className="space-y-2">
                                        <Label htmlFor="age" className="text-[#3d8f5b] font-medium">
                                            *Age
                                        </Label>
                                        <Input
                                            id="age"
                                            name="age"
                                            type="number"
                                            required
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]"
                                            placeholder="Enter your age"
                                            min="1"
                                            max="120"
                                        />
                                    </div>
                                )}

                                {/* Parent/Guardian Fields (only if less than 18) */}
                                {formData.ageCategory === "less-than-18" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="parentGuardianName" className="text-[#3d8f5b] font-medium">
                                                *Parent/Guardian Name
                                            </Label>
                                            <Input
                                                id="parentGuardianName"
                                                name="parentGuardianName"
                                                type="text"
                                                required
                                                value={formData.parentGuardianName}
                                                onChange={(e) => setFormData({ ...formData, parentGuardianName: e.target.value })}
                                                className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]"
                                                placeholder="Enter parent/guardian name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="relationToApplicant" className="text-[#3d8f5b] font-medium">
                                                *Relation to Applicant
                                            </Label>
                                            <Input
                                                id="relationToApplicant"
                                                name="relationToApplicant"
                                                type="text"
                                                required
                                                value={formData.relationToApplicant}
                                                onChange={(e) => setFormData({ ...formData, relationToApplicant: e.target.value })}
                                                className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]"
                                                placeholder="e.g., Father, Mother, Guardian"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* First Language */}
                                <div className="space-y-2">
                                    <Label htmlFor="firstLanguage" className="text-[#3d8f5b] font-medium">
                                        *First Language
                                    </Label>
                                    <Select
                                        value={formData.firstLanguage}
                                        onValueChange={(value) => setFormData({ ...formData, firstLanguage: value })}
                                        required
                                    >
                                        <SelectTrigger className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]">
                                            <SelectValue placeholder="Select first language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="english">English</SelectItem>
                                            <SelectItem value="arabic">Arabic</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Country */}
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
                            </div>

                            {/* Contact Information Section */}
                            <div className="space-y-6">
                                <h3 className="text-2xl font-semibold text-[#1a4d2e] border-b-2 border-[#3d8f5b] pb-2">
                                    Contact Information
                                </h3>

                                {/* Email */}
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

                                {/* Phone Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[#3d8f5b] font-medium">
                                        *Phone Number
                                    </Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="text"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b] flex-1"
                                            placeholder="Enter your phone number"
                                        />
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="phoneSameAsWhatsapp"
                                                checked={formData.phoneSameAsWhatsapp}
                                                onCheckedChange={(checked) => handlePhoneSameAsWhatsappChange(checked === true)}
                                                className="border-[#3d8f5b] data-[state=checked]:bg-[#3d8f5b]"
                                            />
                                            <Label
                                                htmlFor="phoneSameAsWhatsapp"
                                                className="text-sm text-gray-700 cursor-pointer"
                                            >
                                                Same as WhatsApp
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* WhatsApp Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp" className="text-[#3d8f5b] font-medium">
                                        *WhatsApp Number
                                    </Label>
                                    <Input
                                        id="whatsapp"
                                        name="whatsapp"
                                        type="text"
                                        required
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        disabled={formData.phoneSameAsWhatsapp}
                                        className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b] disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="Enter your WhatsApp number"
                                    />
                                </div>
                            </div>

                            {/* Programs Section */}
                            <div className="space-y-6">
                                <h3 className="text-2xl font-semibold text-[#1a4d2e] border-b-2 border-[#3d8f5b] pb-2">
                                    Programs
                                </h3>

                                {/* Program Select */}
                                <div className="space-y-2">
                                    <Label htmlFor="program" className="text-[#3d8f5b] font-medium">
                                        *Program
                                    </Label>
                                    <Select
                                        value={formData.program}
                                        onValueChange={(value) => setFormData({ ...formData, program: value })}
                                        required
                                    >
                                        <SelectTrigger className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]">
                                            <SelectValue placeholder="Select a program" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="quran">Quran</SelectItem>
                                            <SelectItem value="arabic">Arabic</SelectItem>
                                            <SelectItem value="islamic-studies">Islamic Studies</SelectItem>
                                            <SelectItem value="special-courses">Special Courses</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Class Duration */}
                                <div className="space-y-2">
                                    <Label htmlFor="classDuration" className="text-[#3d8f5b] font-medium">
                                        *Class Duration
                                    </Label>
                                    <Select
                                        value={formData.classDuration}
                                        onValueChange={(value) => setFormData({ ...formData, classDuration: value })}
                                        required
                                    >
                                        <SelectTrigger className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]">
                                            <SelectValue placeholder="Select class duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="30-min">30 min</SelectItem>
                                            <SelectItem value="45-min">45 min</SelectItem>
                                            <SelectItem value="1-hr">1 hr</SelectItem>
                                            <SelectItem value="1-hr-30-min">1 hr and a half</SelectItem>
                                            <SelectItem value="2-hr">2 hr</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Availability */}
                                <div className="space-y-2">
                                    <Label className="text-[#3d8f5b] font-medium">
                                        *Availability
                                    </Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {DAYS_OF_WEEK.map((day) => (
                                            <div key={day} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`availability-${day}`}
                                                    checked={formData.availability.includes(day)}
                                                    onCheckedChange={(checked) => handleAvailabilityChange(day, checked === true)}
                                                    className="border-[#3d8f5b] data-[state=checked]:bg-[#3d8f5b]"
                                                />
                                                <Label
                                                    htmlFor={`availability-${day}`}
                                                    className="text-sm text-gray-700 cursor-pointer"
                                                >
                                                    {day}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* How did you hear about us Section */}
                            <div className="space-y-6">
                                <h3 className="text-2xl font-semibold text-[#1a4d2e] border-b-2 border-[#3d8f5b] pb-2">
                                    How did you hear about us?
                                </h3>

                                <div className="space-y-2">
                                    <Select
                                        value={formData.hearAboutUs}
                                        onValueChange={(value) => setFormData({ ...formData, hearAboutUs: value, friendName: "" })}
                                        required
                                    >
                                        <SelectTrigger className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]">
                                            <SelectValue placeholder="Select an option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="google">Google</SelectItem>
                                            <SelectItem value="facebook">Facebook</SelectItem>
                                            <SelectItem value="youtube">YouTube</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                            <SelectItem value="flyers">Flyers</SelectItem>
                                            <SelectItem value="recommendation">Recommendation from a friend</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Friend Name (if recommendation selected) */}
                                {formData.hearAboutUs === "recommendation" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="friendName" className="text-[#3d8f5b] font-medium">
                                            *Friend&apos;s Name
                                        </Label>
                                        <Input
                                            id="friendName"
                                            name="friendName"
                                            type="text"
                                            required
                                            value={formData.friendName}
                                            onChange={(e) => setFormData({ ...formData, friendName: e.target.value })}
                                            className="bg-[#e8f5e9] border-[#3d8f5b] focus:border-[#2d6f4a] focus:ring-[#3d8f5b]"
                                            placeholder="Enter your friend's name"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Comments Section */}
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
                                disabled={isSubmitting || !isFormValid()}
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

