import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Job Matcher - Find Your Perfect Career Match",
  description:
    "AI-powered job matching platform that analyzes your resume and finds the best job opportunities tailored to your skills and experience.",
  keywords: "job search, AI matching, career, resume analysis, job recommendations",
  authors: [{ name: "AI Job Matcher" }],
  openGraph: {
    title: "AI Job Matcher - Find Your Perfect Career Match",
    description: "AI-powered job matching platform that analyzes your resume and finds the best job opportunities.",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
