"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { TransactionChart } from "@/components/insights/transaction-chart"
import { CategoryDistribution } from "@/components/insights/category-distribution"
import { WalletDistribution } from "@/components/insights/wallet-distribution"
import { MonthlyComparison } from "@/components/insights/monthly-comparison"
import { WeeklyTrends } from "@/components/insights/weekly-trends"
import { TopTransactions } from "@/components/insights/top-transactions"
import { SpendingPatterns } from "@/components/insights/spending-patterns"
import { Activity, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { LoadingState } from "@/components/loading-state"
import { getTransactions, getSummary } from "@/lib/sheet-actions"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default function InsightsPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [view, setView] = useState<"overview" | "detailed">("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{
    totalPemasukan: number
    totalPengeluaran: number
    saldoTotal: number
  }>({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoTotal: 0,
  })

  useEffect(() => {
    loadData()
  }, [dateRange])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      // Get summary data
      const summaryData = await getSummary()
      setSummary(summaryData)

      // Get transactions for the selected date range
      const transactions = await getTransactions()

      // Filter transactions based on date range
      const filteredTransactions = transactions.filter((t) => {
        const date = new Date(t.tanggal)
        return date >= dateRange.from && date <= dateRange.to
      })

      // Calculate period comparison
      const previousPeriodStart = new Date(dateRange.from)
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 30)
      const previousPeriodEnd = new Date(dateRange.to)
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 30)

      const previousTransactions = transactions.filter((t) => {
        const date = new Date(t.tanggal)
        return date >= previousPeriodStart && date <= previousPeriodEnd
      })

      // Calculate percentage changes
      const currentPemasukan = filteredTransactions.reduce((sum, t) => sum + Number(t.pemasukan), 0)
      const previousPemasukan = previousTransactions.reduce((sum, t) => sum + Number(t.pemasukan), 0)
      const pemasukanChange = previousPemasukan ? ((currentPemasukan - previousPemasukan) / previousPemasukan) * 100 : 0

      const currentPengeluaran = filteredTransactions.reduce((sum, t) => sum + Number(t.pengeluaran), 0)
      const previousPengeluaran = previousTransactions.reduce((sum, t) => sum + Number(t.pengeluaran), 0)
      const pengeluaranChange = previousPengeluaran
        ? ((currentPengeluaran - previousPengeluaran) / previousPengeluaran) * 100
        : 0

      setSummary((prev) => ({
        ...prev,
        periodComparison: {
          pemasukanChange,
          pengeluaranChange,
        },
      }))
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Gagal memuat data. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{error}</p>
          <button onClick={loadData} className="mt-2 text-sm underline hover:no-underline">
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingState message="Memuat data analisis..." />
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analisis Keuangan</h1>
          <p className="text-muted-foreground">
            {format(dateRange.from, "d MMMM yyyy", { locale: id })} -{" "}
            {format(dateRange.to, "d MMMM yyyy", { locale: id })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          <Select value={view} onValueChange={(v: "overview" | "detailed") => setView(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih tampilan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Ringkasan</SelectItem>
              <SelectItem value="detailed">Detail</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(summary.totalPemasukan)}
            </div>
            {summary.periodComparison?.pemasukanChange && (
              <p className="text-xs text-muted-foreground">
                {summary.periodComparison.pemasukanChange > 0 ? "+" : ""}
                {summary.periodComparison.pemasukanChange.toFixed(1)}% dari periode sebelumnya
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(summary.totalPengeluaran)}
            </div>
            {summary.periodComparison?.pengeluaranChange && (
              <p className="text-xs text-muted-foreground">
                {summary.periodComparison.pengeluaranChange > 0 ? "+" : ""}
                {summary.periodComparison.pengeluaranChange.toFixed(1)}% dari periode sebelumnya
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bersih</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(summary.saldoTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tren Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <TransactionChart dateRange={dateRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribusi Kategori</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <CategoryDistribution dateRange={dateRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribusi Wallet</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <WalletDistribution dateRange={dateRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Perbandingan Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <MonthlyComparison />
          </CardContent>
        </Card>
      </div>

      {view === "detailed" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Tren Mingguan</CardTitle>
              </CardHeader>
              <CardContent>
                <WeeklyTrends dateRange={dateRange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Pola Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent>
                <SpendingPatterns dateRange={dateRange} />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Transaksi Terbesar</CardTitle>
            </CardHeader>
            <CardContent>
              <TopTransactions dateRange={dateRange} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

