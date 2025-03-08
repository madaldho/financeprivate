"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowUpCircle, ArrowDownCircle, Check } from "lucide-react"
import { TransactionForm } from "@/components/transaction-form"
import { TransactionTable } from "@/components/transaction-table"
import { FinanceSummary } from "@/components/finance-summary"

export function MainContent() {
  const [activeTab, setActiveTab] = useState("semua")
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <main className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">Manajemen Keuangan Pribadi</h1>

      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FinanceSummary onError={setError} />
      </div>

      <Tabs defaultValue="semua" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="semua">Semua</TabsTrigger>
          <TabsTrigger value="bulan-ini">Bulan Ini</TabsTrigger>
          <TabsTrigger value="bulan-lalu">Bulan Lalu</TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center mb-4">
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
                <TransactionForm
                  type="pemasukan"
                  onSuccess={() => {
                    setShowSuccess(true)
                    setTimeout(() => setShowSuccess(false), 2000)
                  }}
                />
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
                <TransactionForm
                  type="pengeluaran"
                  onSuccess={() => {
                    setShowSuccess(true)
                    setTimeout(() => setShowSuccess(false), 2000)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Select defaultValue="tanggal-terbaru">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tanggal-terbaru">Tanggal Terbaru</SelectItem>
              <SelectItem value="tanggal-terlama">Tanggal Terlama</SelectItem>
              <SelectItem value="nominal-terbesar">Nominal Terbesar</SelectItem>
              <SelectItem value="nominal-terkecil">Nominal Terkecil</SelectItem>
            </SelectContent>
          </Select>
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

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-4">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-500 mb-2">Transaksi berhasil dicatat</h2>
          </div>
        </div>
      )}
    </main>
  )
}

