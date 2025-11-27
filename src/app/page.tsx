"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { login, checkSessionAndGetDashboard } from "../lib/auth/auth-actions"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const result = await checkSessionAndGetDashboard()
        if (result.isAuthenticated && result.dashboardUrl) {
          router.push(result.dashboardUrl)
        } else {
          setIsCheckingSession(false)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

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
                <p className="text-muted-foreground">Checking session...</p>
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
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <input type="hidden" name="rememberMe" value={rememberMe ? "true" : "false"} />
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
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="/forgot-password" className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pr-10"
                    autoComplete="current-password"
                    required
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  style={{
                    backgroundColor: rememberMe ? "#3d8f5b" : undefined,
                    borderColor: "#3d8f5b"
                  }}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer select-none">
                  Remember me for 30 days
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md transition-all duration-200"
                formAction={login}
                onClick={() => setIsSubmitting(true)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center text-sm">
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