"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function MonthlyComparison() {
  const [data, setData] = useState([
    {
      name: "Jan",
      pemasukan: 4000,
      pengeluaran: 2400,
    },
    {
      name: "Feb",
      pemasukan: 3000,
      pengeluaran: 1398,
    },
    {
      name: "Mar",
      pemasukan: 2000,
      pengeluaran: 9800,
    },
    {
      name: "Apr",
      pemasukan: 2780,
      pengeluaran: 3908,
    },
    {
      name: "May",
      pemasukan: 1890,
      pengeluaran: 4800,
    },
    {
      name: "Jun",
      pemasukan: 2390,
      pengeluaran: 3800,
    },
  ])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="pemasukan" fill="#4ade80" />
        <Bar dataKey="pengeluaran" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}

