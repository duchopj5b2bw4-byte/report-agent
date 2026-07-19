import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ReportAgent | AI-Powered Weekly Report Generator",
  description: "Upload screenshots and notes — AI generates structured weekly reports with data analysis.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
