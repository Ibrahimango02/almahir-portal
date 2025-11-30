"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const router = useRouter()

    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-background to-muted/30">
            <div className="w-full max-w-md mx-auto">
                <div className="mb-8 flex flex-col items-center">
                    <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={200} height={200} className="object-contain mb-8" />
                </div>
                <Card className="w-full shadow-lg border-accent/20">
                    <CardHeader>
                        <CardTitle className="text-xl text-center text-destructive flex items-center justify-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Something went wrong!
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground">
                            An unexpected error occurred. Please try again or contact support if the problem persists.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-2">
                        <Button 
                            variant="outline" 
                            onClick={reset}
                            className="w-full sm:w-auto"
                        >
                            Try Again
                        </Button>
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

