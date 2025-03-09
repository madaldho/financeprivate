"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LoadingOverlay } from "./loading-overlay"

export function InitializeButton() {
  const [isInitializing, setIsInitializing] = useState(false)
  const { toast } = useToast()

  const handleInitialize = async () => {
    try {
      setIsInitializing(true)

      const response = await fetch("/api/init")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Berhasil",
          description: `Data berhasil diinisialisasi.`,
        })
        // Reload halaman untuk memuat data baru
        window.location.reload()
      } else {
        throw new Error(data.error || "Gagal menginisialisasi data")
      }
    } catch (error) {
      console.error("Error initializing data:", error)
      toast({
        title: "Error",
        description: String(error) || "Gagal menginisialisasi data",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <>
      <LoadingOverlay isLoading={isInitializing} message="Menginisialisasi data..." />
      <Button
        variant="outline"
        onClick={handleInitialize}
        disabled={isInitializing}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        Reset & Initialize Data
      </Button>
    </>
  )
}

