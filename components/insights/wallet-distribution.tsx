"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { DateRange } from "react-day-picker"

interface WalletDistributionProps {
  dateRange: DateRange
}

export function WalletDistribution({ dateRange }: WalletDistributionProps) {
  const [data, setData] = useState([
    {
      name: "Cash",
      saldo: 4000,
    },
    {
      name: "DANA",
      saldo: 3000,
    },
    {
      name: "OVO",
      saldo: 2000,
    },
    {
      name: "GoPay",
      saldo: 2780,
    },
    {
      name: "ShopeePay",
      saldo: 1890,
    },
  ])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="saldo" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}

