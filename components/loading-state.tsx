"use client"

import { Loader2 } from "lucide-react"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "Memuat data..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

