"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
// Hapus fungsi recoverData karena tidak lagi diperlukan

export function DataRecovery() {
  const [isRecovering, setIsRecovering] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleRecoverData = async () => {
    try {
      setIsRecovering(true)
      setMessage(null)

      // Refresh halaman sebagai alternatif
      window.location.reload()

      setMessage("Halaman akan dimuat ulang.")
    } catch (error) {
      setMessage("Terjadi kesalahan saat memuat ulang data")
      console.error("Error refreshing data:", error)
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

