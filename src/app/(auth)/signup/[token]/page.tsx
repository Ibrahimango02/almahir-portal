"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function SignupPage({ params }: { params: Promise<{ token: string }> }) {
    const router = useRouter()
    const { token } = use(params)
    const [full_name, setFullName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isValidating, setIsValidating] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [invitationDetails, setInvitationDetails] = useState<{
        email: string
        first_name: string
        last_name: string
        role: string
    } | null>(null)

    // Validate invitation token on page load
    useEffect(() => {
        const validateInvitation = async () => {
            try {
                const response = await fetch(`/api/validate-invitation/${token}`)
                const data = await response.json()

                if (!response.ok) {
                    setError(data.error || 'Invalid or expired invitation')
                    setIsValidating(false)
                    return
                }

                setInvitationDetails(data.invitation)
                // Combine first_name and last_name into full_name, with fallback to empty string
                const fullName = `${data.invitation.first_name || ''} ${data.invitation.last_name || ''}`.trim()
                setFullName(fullName || '')
                setIsValidating(false)
            } catch {
                setError('Failed to validate invitation')
                setIsValidating(false)
            }
        }

        validateInvitation()
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Basic validation
        if (!full_name || !password || !confirmPassword) {
            setError("All fields are required")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/accept-invitation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invitationToken: token,
                    full_name: full_name.trim(),
                    password: password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create account')
            }

            // Show success message and redirect to login
            router.push("/")
        } catch (err) {
            console.error('Error creating account:', err)
            setError(err instanceof Error ? err.message : "Failed to create account. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isValidating) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-background to-muted/30">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-8 flex flex-col items-center">
                        <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={200} height={200} className="object-contain mb-8" />
                    </div>
                    <Card className="w-full shadow-lg border-accent/20">
                        <CardContent className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Validating invitation...</span>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (error && !invitationDetails) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-background to-muted/30">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-8 flex flex-col items-center">
                        <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={200} height={200} className="object-contain mb-8" />
                    </div>
                    <Card className="w-full shadow-lg border-accent/20">
                        <CardHeader>
                            <CardTitle className="text-xl text-center text-destructive flex items-center justify-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Invalid Invitation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                            <p className="text-center text-muted-foreground mt-4">
                                This invitation link may be expired or invalid. Please contact your administrator for a new invitation.
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-center">
                            <Button variant="outline" onClick={() => router.push('/login')}>
                                Go to Login
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-background to-muted/30">
            <div className="w-full max-w-md mx-auto">
                <div className="mb-8 flex flex-col items-center">
                    <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={200} height={200} className="object-contain mb-8" />
                </div>

                <div className="w-full shadow-none border-none rounded-2xl !bg-transparent bg-none backdrop-blur-none transition-all duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="p-4 bg-muted rounded-md mb-4">
                            <p className="text-sm">
                                <span className="font-medium">Email:</span> {invitationDetails?.email}
                            </p>
                            <p className="text-sm mt-1">
                                <span className="font-medium">Role:</span> {invitationDetails?.role ? invitationDetails.role.charAt(0).toUpperCase() + invitationDetails.role.slice(1) : 'User'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                placeholder="Your first name"
                                value={full_name}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={isLoading}
                                className="w-full"
                                autoComplete="given-name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Password must be at least 8 characters long
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                className="w-full"
                                autoComplete="new-password"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md transition-all duration-200"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>
                    <div className="flex flex-col space-y-4 text-center text-sm mt-6">
                        <p className="text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
} 