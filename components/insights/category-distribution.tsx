"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { DateRange } from "react-day-picker"
import { getTransactions, getCategories } from "@/lib/actions"
import { LoadingState } from "@/components/loading-state"

interface CategoryDistributionProps {
  dateRange: DateRange
}

export function CategoryDistribution({ dateRange }: CategoryDistributionProps) {
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

      const [transactions, categories] = await Promise.all([getTransactions(), getCategories()])

      // Filter transactions based on date range
      const filteredTransactions = transactions.filter((t) => {
        const date = new Date(t.tanggal)
        return date >= dateRange.from && date <= dateRange.to
      })

      // Create category map for colors
      const categoryMap = categories.reduce(
        (acc, cat) => {
          acc[cat.name] = cat.color
          return acc
        },
        {} as Record<string, string>,
      )

      // Group transactions by category
      const groupedData = filteredTransactions.reduce(
        (acc, transaction) => {
          const category = transaction.kategori

          if (!acc[category]) {
            acc[category] = {
              name: category,
              value: 0,
              color: categoryMap[category] || "#666666",
            }
          }

          acc[category].value += Number(transaction.pengeluaran) || 0

          return acc
        },
        {} as Record<string, any>,
      )

      // Convert to array and sort by value
      const chartData = Object.values(groupedData)
        .sort((a, b) => b.value - a.value)
        .filter((item) => item.value > 0) // Only show categories with values

      setData(chartData)
    } catch (err) {
      console.error("Error loading chart data:", err)
      setError("Gagal memuat data kategori")
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
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(value)
          }
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

