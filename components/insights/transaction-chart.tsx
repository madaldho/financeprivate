"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { DateRange } from "react-day-picker"
import { getTransactions } from "@/lib/sheet-actions"
import { LoadingState } from "@/components/loading-state"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"

interface TransactionChartProps {
  dateRange: DateRange
}

export function TransactionChart({ dateRange }: TransactionChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [dateRange])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      const transactions = await getTransactions()

      // Filter transactions based on date range
      const filteredTransactions = transactions.filter((t) => {
        const date = new Date(t.tanggal)
        return date >= dateRange.from && date <= dateRange.to
      })

      // Group transactions by date
      const groupedData = filteredTransactions.reduce(
        (acc, transaction) => {
          const date = format(parseISO(transaction.tanggal), "d MMM", { locale: id })

          if (!acc[date]) {
            acc[date] = {
              date,
              pemasukan: 0,
              pengeluaran: 0,
            }
          }

          acc[date].pemasukan += Number(transaction.pemasukan) || 0
          acc[date].pengeluaran += Number(transaction.pengeluaran) || 0

          return acc
        },
        {} as Record<string, any>,
      )

      // Convert to array and sort by date
      const chartData = Object.values(groupedData).sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      setData(chartData)
    } catch (err) {
      console.error("Error loading chart data:", err)
      setError("Gagal memuat data grafik")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(value)
          }
        />
        <Line type="monotone" dataKey="pemasukan" stroke="#4ade80" strokeWidth={2} name="Pemasukan" />
        <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" />
      </LineChart>
    </ResponsiveContainer>
  )
}

