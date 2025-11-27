"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { resetPassword } from "@/lib/auth/auth-actions"
import { createClient } from "@/utils/supabase/client"
import Image from "next/image"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  // Check if user has a valid session (from Supabase password reset callback)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          setMessage({ 
            type: "error", 
            text: "Invalid or expired reset link. Please request a new password reset link." 
          })
        }
      } catch {
        setMessage({ 
          type: "error", 
          text: "An error occurred while verifying your reset link. Please try again." 
        })
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    // Validation
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long" })
      setIsSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" })
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("password", password)
      formData.append("confirmPassword", confirmPassword)
      
      const result = await resetPassword(formData)
      
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setIsSuccess(true)
        setMessage({ 
          type: "success", 
          text: "Password reset successfully! Redirecting to login..." 
        })
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-app-overlay">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 flex flex-col items-center">
            <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={200} height={200} className="object-contain mb-8" />
          </div>
          <Card className="w-full shadow-2xl border-none rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-app-overlay">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 flex flex-col items-center">
            <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={200} height={200} className="object-contain mb-8" />
          </div>

          <Card className="w-full shadow-2xl border-none rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
                <h2 className="text-2xl font-bold">Password Reset Successful!</h2>
                <p className="text-muted-foreground">
                  Your password has been reset successfully. You will be redirected to the login page shortly.
                </p>
                <Link href="/">
                  <Button className="mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-app-overlay">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={200} height={200} className="object-contain mb-8" />
        </div>

        <Card className="w-full shadow-2xl border-none rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200" : ""}>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pr-10"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pr-10"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center text-sm">
            <Link href="/" className="text-primary hover:underline hover:text-primary/80 transition-colors">
              Back to login
            </Link>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center text-xs text-muted-foreground/70">
          <p>
            Need help? Contact support at {" "}
            <span className="font-medium underline underline-offset-2">almahir.info@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}

