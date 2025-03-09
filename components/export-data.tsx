"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon, Download } from "lucide-react"
import { exportTransactionsToExcel } from "@/lib/export"

export function ExportData() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Format tanggal untuk API
      const formattedStartDate = startDate ? format(startDate, "yyyy-MM-dd") : undefined
      const formattedEndDate = endDate ? format(endDate, "yyyy-MM-dd") : undefined

      // Panggil API ekspor
      const response = await exportTransactionsToExcel(formattedStartDate, formattedEndDate)

      // Buat blob dan download
      const blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `transaksi_${formattedStartDate || "semua"}_${formattedEndDate || "semua"}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting data:", error)
      alert("Gagal mengekspor data. Silakan coba lagi.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ekspor Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tanggal Mulai</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tanggal Akhir</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button onClick={handleExport} disabled={isExporting} className="w-full">
          {isExporting ? "Mengekspor..." : "Ekspor ke Excel"}
          <Download className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-muted-foreground">
          {!startDate && !endDate
            ? "Semua transaksi akan diekspor jika tidak ada tanggal yang dipilih."
            : `Transaksi dari ${startDate ? format(startDate, "dd MMMM yyyy", { locale: id }) : "awal"} hingga ${endDate ? format(endDate, "dd MMMM yyyy", { locale: id }) : "akhir"} akan diekspor.`}
        </p>
      </CardContent>
    </Card>
  )
}

