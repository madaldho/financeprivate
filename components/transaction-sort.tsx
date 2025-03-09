"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Filter } from "lucide-react"

interface TransactionSortProps {
  onSort: (sortBy: string, order: "asc" | "desc") => void
  currentSort: {
    by: string
    order: "asc" | "desc"
  }
}

export function TransactionSort({ onSort, currentSort }: TransactionSortProps) {
  const [sortBy, setSortBy] = useState(currentSort.by)
  const [order, setOrder] = useState<"asc" | "desc">(currentSort.order)

  const handleApply = () => {
    onSort(sortBy, order)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>Filter & Urutkan</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter & Urutkan</SheetTitle>
          <SheetDescription>Atur urutan dan filter transaksi</SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Urutkan berdasarkan</h3>
            <RadioGroup value={sortBy} onValueChange={setSortBy} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tanggal" id="tanggal" />
                <Label htmlFor="tanggal">Tanggal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nominal" id="nominal" />
                <Label htmlFor="nominal">Nominal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="kategori" id="kategori" />
                <Label htmlFor="kategori">Kategori</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jenisTransaksi" id="jenisTransaksi" />
                <Label htmlFor="jenisTransaksi">Jenis Transaksi</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Urutan</h3>
            <RadioGroup value={order} onValueChange={(value: "asc" | "desc") => setOrder(value)} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="desc" id="desc" />
                <Label htmlFor="desc">Terbaru dulu</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="asc" id="asc" />
                <Label htmlFor="asc">Terlama dulu</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button onClick={handleApply} className="w-full">
              Terapkan
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

