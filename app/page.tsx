"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, BarChart2 } from "lucide-react"
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
    setIsLoading(true)
    try {
      if (window.refreshFinanceSummary) {
        await window.refreshFinanceSummary()
      }
      setActiveTab((prev) => {
        const temp = prev === "semua" ? "bulan-ini" : "semua"
        setTimeout(() => setActiveTab(prev), 100)
        return temp
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4 max-w-7xl pb-24">
        <LoadingOverlay isLoading={isLoading} />

        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">Manajemen Keuangan Pribadi</h1>
            <p className="text-sm text-gray-500">Kelola keuangan Anda dengan mudah</p>
          </div>

          {/* Database Status */}
          <div className="flex items-center gap-4">
            {dbStatus === "connected" && (
              <span className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Terhubung ke Supabase
              </span>
            )}
            <div className="flex items-center gap-2">
              <Link href="/insights">
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </Link>
              <SettingsDialog />
            </div>
          </div>
        </div>

        {/* Wallet Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Saldo Dompet</h2>
          <WalletCards />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <FinanceSummary onError={setError} />
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <Tabs defaultValue="semua" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                <TabsTrigger value="semua">Semua</TabsTrigger>
                <TabsTrigger value="bulan-ini">Bulan Ini</TabsTrigger>
                <TabsTrigger value="bulan-lalu">Bulan Lalu</TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-green-500 hover:bg-green-600">
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      Pemasukan
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
                      Pengeluaran
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
                      Convert
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
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 flex gap-2">
          <InitializeButton />
        </div>
      </main>
    </div>
  )
}

