"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { DateRange } from "react-day-picker"

interface TopTransactionsProps {
  dateRange: DateRange
}

export function TopTransactions({ dateRange }: TopTransactionsProps) {
  const [transactions, setTransactions] = useState([
    {
      id: "1",
      tanggal: "2024-03-01",
      kategori: "Makanan",
      deskripsi: "Makan Siang",
      nominal: 150000,
      type: "pengeluaran",
    },
    {
      id: "2",
      tanggal: "2024-03-02",
      kategori: "Transport",
      deskripsi: "Bensin",
      nominal: 200000,
      type: "pengeluaran",
    },
    {
      id: "3",
      tanggal: "2024-03-03",
      kategori: "Gaji",
      deskripsi: "Gaji Bulanan",
      nominal: 5000000,
      type: "pemasukan",
    },
  ])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Deskripsi</TableHead>
          <TableHead className="text-right">Nominal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{new Date(transaction.tanggal).toLocaleDateString("id-ID")}</TableCell>
            <TableCell>{transaction.kategori}</TableCell>
            <TableCell>{transaction.deskripsi}</TableCell>
            <TableCell className={`text-right ${transaction.type === "pemasukan" ? "text-green-500" : "text-red-500"}`}>
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(transaction.nominal)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

