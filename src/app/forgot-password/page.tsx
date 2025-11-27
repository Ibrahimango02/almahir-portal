"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sendPasswordResetEmail } from "@/lib/auth/auth-actions"
import Image from "next/image"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("email", email)
      
      const result = await sendPasswordResetEmail(formData)
      
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ 
          type: "success", 
          text: "If an account with that email exists, we've sent you a password reset link. Please check your email." 
        })
        setEmail("")
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
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
              Enter your email address and we&apos;ll send you a link to reset your password.
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
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

