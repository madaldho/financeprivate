"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { recoverData } from "@/lib/sheet-actions"

export function DataRecovery() {
  const [isRecovering, setIsRecovering] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleRecoverData = async () => {
    try {
      setIsRecovering(true)
      setMessage(null)

      const result = await recoverData()

      if (result.success) {
        setMessage("Data berhasil dipulihkan. Halaman akan dimuat ulang.")
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage(result.message)
      }
    } catch (error) {
      setMessage("Terjadi kesalahan saat memulihkan data")
      console.error("Error recovering data:", error)
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <div className="relative">
      <div className="absolute top-0 right-0">
        <Button variant="ghost" size="sm" onClick={handleRecoverData} disabled={isRecovering}>
          {isRecovering ? "Memulihkan..." : "Refresh Data"}
        </Button>
      </div>
      {message && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-md shadow-lg border border-gray-200 z-50">
          {message}
        </div>
      )}
    </div>
  )
}

