"use client"

import type React from "react"

import { useEffect } from "react"

export function ErrorBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Caught error:", event.error)
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  return <>{children}</>
}

