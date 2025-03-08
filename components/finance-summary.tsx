"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSummary } from "@/lib/sheet-actions"
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react"

type SummaryData = {
  totalPemasukan: number
  totalPengeluaran: number
  saldoTotal: number
  saldoPerAkun?: Record<string, number>
}

type FinanceSummaryProps = {
  onError: (error: string) => void
}

export function FinanceSummary({ onError }: FinanceSummaryProps) {
  const [summary, setSummary] = useState<SummaryData>({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoTotal: 0,
    saldoPerAkun: {},
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true)
        const data = await getSummary()
        setSummary(data)
      } catch (error) {
        console.error("Error fetching summary:", error)
        onError("Gagal memuat ringkasan keuangan")
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [onError])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-300">Memuat...</div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-300">Memuat...</div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-300">Memuat...</div>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Pemasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ArrowUpCircle className="h-5 w-5 text-green-500 mr-2" />
            <div className="text-2xl font-bold text-green-500">{formatCurrency(summary.totalPemasukan)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ArrowDownCircle className="h-5 w-5 text-red-500 mr-2" />
            <div className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalPengeluaran)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Saldo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
            <div className="text-2xl font-bold text-blue-500">{formatCurrency(summary.saldoTotal)}</div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

