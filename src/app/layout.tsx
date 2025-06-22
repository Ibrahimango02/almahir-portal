import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TimezoneProvider } from "@/contexts/TimezoneContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Al-Mahir Academy",
  description: "Online academy management portal",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ThemeProvider>
          <TimezoneProvider>
            {children}
            <Toaster />
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
