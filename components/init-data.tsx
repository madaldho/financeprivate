"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function InitData() {
  const [isInitializing, setIsInitializing] = useState(false)
  const { toast } = useToast()

  const initializeData = async () => {
    try {
      setIsInitializing(true)
      const response = await fetch("/api/init")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Berhasil",
          description: "Data berhasil diinisialisasi",
        })
        // Reload halaman setelah inisialisasi
        window.location.reload()
      } else {
        throw new Error(data.error || "Failed to initialize data")
      }
    } catch (error) {
      console.error("Error initializing data:", error)
      toast({
        title: "Error",
        description: "Gagal menginisialisasi data",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4">
      <Button variant="outline" onClick={initializeData} disabled={isInitializing}>
        {isInitializing ? "Menginisialisasi..." : "Reset Data"}
      </Button>
    </div>
  )
}

