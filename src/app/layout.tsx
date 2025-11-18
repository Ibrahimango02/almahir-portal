import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TimezoneProvider } from "@/contexts/TimezoneContext"
import { DevelopmentBanner } from "@/components/development-banner"
//import { ChatClientWrapper } from "@/components/chat-client-wrapper"

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: "Al-Mahir Academy",
  description: "Online academy management portal"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ThemeProvider>
          <TimezoneProvider>
            <DevelopmentBanner />
            {children}
            {/* <ChatClientWrapper /> */}
            <Toaster />
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
