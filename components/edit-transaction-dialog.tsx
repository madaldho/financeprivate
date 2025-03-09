"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { updateTransaction, getCategories, getWallets } from "@/lib/sheet-actions"
import type { Transaction, Category, WalletBalance } from "@/lib/sheet-config"

interface EditTransactionDialogProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditTransactionDialog({ transaction, isOpen, onClose, onSuccess }: EditTransactionDialogProps) {
  const [formData, setFormData] = useState<Transaction | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [wallets, setWallets] = useState<WalletBalance[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && transaction) {
      setFormData({ ...transaction })
      loadData()
    }
  }, [isOpen, transaction])

  async function loadData() {
    try {
      const [categoriesData, walletsData] = await Promise.all([getCategories(), getWallets()])
      setCategories(categoriesData)
      setWallets(walletsData)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setLoading(true)

    try {
      await updateTransaction(formData)
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil diperbarui",
      })
      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui transaksi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!formData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Transaksi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input
              id="tanggal"
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kategori">Kategori</Label>
            <Select value={formData.kategori} onValueChange={(value) => setFormData({ ...formData, kategori: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenisTransaksi">Jenis Transaksi</Label>
            <Select
              value={formData.jenisTransaksi}
              onValueChange={(value) => setFormData({ ...formData, jenisTransaksi: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis transaksi" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.name}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wallet.color }} />
                      <span>{wallet.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pemasukan">Pemasukan</Label>
              <Input
                id="pemasukan"
                type="number"
                value={formData.pemasukan}
                onChange={(e) => setFormData({ ...formData, pemasukan: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pengeluaran">Pengeluaran</Label>
              <Input
                id="pengeluaran"
                type="number"
                value={formData.pengeluaran}
                onChange={(e) => setFormData({ ...formData, pengeluaran: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={formData.deskripsi || ""}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="belum-lunas">Belum Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

