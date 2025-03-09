"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowUpCircle, ArrowDownCircle, Plus, ArrowLeftRight, BarChart2 } from "lucide-react"
import { TransactionForm } from "@/components/transaction-form"
import { ConvertForm } from "@/components/convert-form"
import { TransactionTable } from "@/components/transaction-table"
import { FinanceSummary } from "@/components/finance-summary"
import { WalletCards } from "@/components/wallet-cards"
import { SettingsDialog } from "@/components/settings-dialog"
import { LoadingOverlay } from "@/components/loading-overlay"
import { InitializeButton } from "@/components/initialize-button"
import Link from "next/link"

export default function Home() {
  const [activeTab, setActiveTab] = useState("semua")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<"loading" | "connected" | "error">("loading")

  useEffect(() => {
    async function checkDbConnection() {
      try {
        setDbStatus("loading")
        const response = await fetch("/api/db-test")
        const data = await response.json()

        if (data.success) {
          setDbStatus("connected")
        } else {
          setDbStatus("error")
        }
      } catch (error) {
        console.error("Error checking DB connection:", error)
        setDbStatus("error")
      }
    }

    checkDbConnection()
  }, [])

  const handleTransactionSuccess = async () => {
    // Refresh data
    setIsLoading(true)
    try {
      // Refresh data without full page reload
      if (window.refreshFinanceSummary) {
        await window.refreshFinanceSummary()
      }

      // Force re-render of transaction table
      setActiveTab((prev) => {
        // Toggle and then toggle back to force re-render
        const temp = prev === "semua" ? "bulan-ini" : "semua"
        setTimeout(() => setActiveTab(prev), 100)
        return temp
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto p-4 max-w-7xl">
      <LoadingOverlay isLoading={isLoading} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Keuangan Pribadi</h1>
        {dbStatus === "loading" && (
          <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md mb-4 flex items-center">
            <span className="animate-pulse mr-2">⏳</span>
            <span>Memeriksa koneksi database...</span>
          </div>
        )}
        {dbStatus === "connected" && (
          <div className="bg-green-50 text-green-800 px-4 py-2 rounded-md mb-4 flex items-center">
            <span className="mr-2">✅</span>
            <span>Terhubung ke database Supabase</span>
          </div>
        )}
        {dbStatus === "error" && (
          <div className="bg-red-50 text-red-800 px-4 py-2 rounded-md mb-4 flex items-center">
            <span className="mr-2">❌</span>
            <span>Gagal terhubung ke database. Silakan periksa konfigurasi.</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Link href="/insights">
            <Button variant="outline" size="icon">
              <BarChart2 className="h-4 w-4" />
            </Button>
          </Link>
          <SettingsDialog />
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Saldo Dompet</h2>
        <WalletCards />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FinanceSummary onError={setError} />
      </div>

      <Tabs defaultValue="semua" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="semua">Semua</TabsTrigger>
            <TabsTrigger value="bulan-ini">Bulan Ini</TabsTrigger>
            <TabsTrigger value="bulan-lalu">Bulan Lalu</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-500 hover:bg-green-600">
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Pemasukan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Tambah Pemasukan Baru</DialogTitle>
                </DialogHeader>
                <TransactionForm type="pemasukan" onSuccess={handleTransactionSuccess} />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-red-500 hover:bg-red-600">
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  Pengeluaran
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Tambah Pengeluaran Baru</DialogTitle>
                </DialogHeader>
                <TransactionForm type="pengeluaran" onSuccess={handleTransactionSuccess} />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Convert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Convert Saldo</DialogTitle>
                </DialogHeader>
                <ConvertForm onSuccess={handleTransactionSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="semua">
          <TransactionTable filter="semua" onError={setError} />
        </TabsContent>

        <TabsContent value="bulan-ini">
          <TransactionTable filter="bulan-ini" onError={setError} />
        </TabsContent>

        <TabsContent value="bulan-lalu">
          <TransactionTable filter="bulan-lalu" onError={setError} />
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-6 right-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Transaksi Baru</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600">
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Tambah Pemasukan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pemasukan Baru</DialogTitle>
                  </DialogHeader>
                  <TransactionForm type="pemasukan" onSuccess={handleTransactionSuccess} />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-red-500 hover:bg-red-600">
                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                    Tambah Pengeluaran
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pengeluaran Baru</DialogTitle>
                  </DialogHeader>
                  <TransactionForm type="pengeluaran" onSuccess={handleTransactionSuccess} />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Convert Saldo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convert Saldo</DialogTitle>
                  </DialogHeader>
                  <ConvertForm onSuccess={handleTransactionSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <InitializeButton />
    </main>
  )
}

