"use client"

import { useState } from "react"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from "recharts"
import type { DateRange } from "react-day-picker"

interface SpendingPatternsProps {
  dateRange: DateRange
}

export function SpendingPatterns({ dateRange }: SpendingPatternsProps) {
  const [data, setData] = useState([
    {
      subject: "Makanan",
      thisMonth: 120,
      lastMonth: 110,
    },
    {
      subject: "Transport",
      thisMonth: 98,
      lastMonth: 130,
    },
    {
      subject: "Hiburan",
      thisMonth: 86,
      lastMonth: 130,
    },
    {
      subject: "Belanja",
      thisMonth: 99,
      lastMonth: 100,
    },
    {
      subject: "Lainnya",
      thisMonth: 85,
      lastMonth: 90,
    },
  ])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        <Radar name="Bulan Ini" dataKey="thisMonth" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        <Radar name="Bulan Lalu" dataKey="lastMonth" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}

