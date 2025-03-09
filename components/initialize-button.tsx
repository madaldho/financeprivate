"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LoadingOverlay } from "./loading-overlay"

export function InitializeButton() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const { toast } = useToast()

  const testConnection = async () => {
    try {
      setIsTestingConnection(true)
      const response = await fetch("/api/supabase-test")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Koneksi Berhasil",
          description: `Terhubung ke database Supabase.`,
        })
      } else {
        throw new Error(data.error || "Gagal terhubung ke database")
      }
    } catch (error) {
      console.error("Error testing connection:", error)
      toast({
        title: "Error",
        description: String(error) || "Gagal terhubung ke database",
        variant: "destructive",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

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
      <LoadingOverlay
        isLoading={isInitializing || isTestingConnection}
        message={isInitializing ? "Menginisialisasi data..." : "Menguji koneksi database..."}
      />
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          onClick={testConnection}
          disabled={isTestingConnection || isInitializing}
          className="shadow-lg"
        >
          Test Koneksi Supabase
        </Button>
        <Button
          variant="outline"
          onClick={handleInitialize}
          disabled={isInitializing || isTestingConnection}
          className="shadow-lg"
        >
          Reset & Initialize Data
        </Button>
      </div>
    </>
  )
}

