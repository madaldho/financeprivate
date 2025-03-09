"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { DateRange } from "react-day-picker"

interface WeeklyTrendsProps {
  dateRange: DateRange
}

export function WeeklyTrends({ dateRange }: WeeklyTrendsProps) {
  const [data, setData] = useState([
    {
      name: "Minggu 1",
      pemasukan: 4000,
      pengeluaran: 2400,
    },
    {
      name: "Minggu 2",
      pemasukan: 3000,
      pengeluaran: 1398,
    },
    {
      name: "Minggu 3",
      pemasukan: 2000,
      pengeluaran: 9800,
    },
    {
      name: "Minggu 4",
      pemasukan: 2780,
      pengeluaran: 3908,
    },
  ])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pemasukan" stroke="#4ade80" />
        <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" />
      </LineChart>
    </ResponsiveContainer>
  )
}

