import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ErrorBoundary } from "@/components/error-boundary"
import { DataRecovery } from "@/components/data-recovery"

export const metadata: Metadata = {
  title: "Manajemen Keuangan Pribadi",
  description: "Aplikasi manajemen keuangan pribadi",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <ErrorBoundary>
          <DataRecovery />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}



import './globals.css'