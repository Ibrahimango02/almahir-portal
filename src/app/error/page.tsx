"use client"

import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function ErrorPage() {
    const router = useRouter()

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
                            Access Denied
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground">
                            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button 
                            variant="outline" 
                            onClick={() => router.push('/')}
                            className="w-full sm:w-auto"
                        >
                            Go to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

