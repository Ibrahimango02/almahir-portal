"use client"

import { useRouter } from "next/navigation"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-background to-muted/30">
            <div className="w-full max-w-md mx-auto">
                <div className="mb-8 flex flex-col items-center">
                    <Image src="/logo.png" alt="Al-Mahir Academy Logo" width={200} height={200} className="object-contain mb-8" />
                </div>
                <Card className="w-full shadow-lg border-accent/20">
                    <CardHeader>
                        <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                            <FileQuestion className="h-5 w-5" />
                            Page Not Found
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground">
                            The page you&apos;re looking for doesn&apos;t exist or has been moved.
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

