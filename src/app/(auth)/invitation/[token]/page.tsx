"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function InvitationPage({ params }: { params: { token: string } }) {
    const router = useRouter()
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [invitationDetails, setInvitationDetails] = useState({
        email: "invited.user@example.com",
        role: "Teacher",
        invitedBy: "Admin User",
    })

    // In a real app, you would validate the token and fetch invitation details
    // useEffect(() => {
    //   const validateToken = async () => {
    //     try {
    //       const response = await fetch(`/api/invitations/${params.token}`);
    //       if (!response.ok) {
    //         setError("Invalid or expired invitation token");
    //         return;
    //       }
    //       const data = await response.json();
    //       setInvitationDetails(data);
    //     } catch (err) {
    //       setError("Failed to validate invitation");
    //     }
    //   };
    //   validateToken();
    // }, [params.token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Basic validation
        if (!name || !password || !confirmPassword) {
            setError("All fields are required")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        // Simulate account creation process
        setIsLoading(true)

        try {
            // This would be replaced with actual account creation logic
            await new Promise((resolve) => setTimeout(resolve, 1500))

            // Redirect to login page
            router.push("/login")
        } catch (err) {
            setError("Failed to create account. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-background to-muted/30">
            <div className="w-full max-w-md mx-auto">
                <div className="mb-8 flex flex-col items-center">
                    <Logo className="mb-6" />
                    <h1 className="text-2xl font-bold text-center">Al-Mahir Academy Portal</h1>
                    <p className="text-center text-muted-foreground mt-2">Complete your account setup</p>
                </div>

                <Card className="w-full shadow-lg border-accent/20">
                    <CardHeader>
                        <CardTitle className="text-xl text-center">Accept Invitation</CardTitle>
                        <CardDescription className="text-center">
                            You've been invited to join Al-Mahir Academy as a {invitationDetails.role}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="p-4 bg-muted rounded-md mb-4">
                                    <p className="text-sm">
                                        <span className="font-medium">Email:</span> {invitationDetails.email}
                                    </p>
                                    <p className="text-sm mt-1">
                                        <span className="font-medium">Invited by:</span> {invitationDetails.invitedBy}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full"
                                        autoComplete="name"
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

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        "Accept Invitation"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 text-center text-sm">
                        <p className="text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
