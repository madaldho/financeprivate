"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSummary } from "@/lib/actions"
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react"
import { motion } from "framer-motion"

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
  const [retryCount, setRetryCount] = useState(0)

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const data = await getSummary()
      setSummary(data)
    } catch (error) {
      console.error("Error fetching summary:", error)
      if (retryCount < 3) {
        // Retry with exponential backoff
        setTimeout(() => {
          setRetryCount((prev) => prev + 1)
          fetchSummary()
        }, Math.pow(2, retryCount) * 1000)
      } else {
        onError("Gagal memuat ringkasan keuangan")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [onError])

  // Expose refresh method to parent components
  useEffect(() => {
    // @ts-ignore - Add to window for debugging
    window.refreshFinanceSummary = fetchSummary
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowUpCircle className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold text-green-500">
                {loading ? (
                  <div className="h-8 w-32 animate-pulse bg-gray-200 rounded" />
                ) : (
                  formatCurrency(summary.totalPemasukan)
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowDownCircle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold text-red-500">
                {loading ? (
                  <div className="h-8 w-32 animate-pulse bg-gray-200 rounded" />
                ) : (
                  formatCurrency(summary.totalPengeluaran)
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold text-blue-500">
                {loading ? (
                  <div className="h-8 w-32 animate-pulse bg-gray-200 rounded" />
                ) : (
                  formatCurrency(summary.saldoTotal)
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

