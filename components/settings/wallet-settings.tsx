"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { WalletBalance } from "@/lib/types"
import { DEFAULT_WALLETS } from "@/lib/default-data"
import { getWallets, updateSettings } from "@/lib/actions"

const WALLET_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "other", label: "Lainnya" },
]

export function WalletSettings() {
  const [wallets, setWallets] = useState<WalletBalance[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadWallets()
  }, [])

  async function loadWallets() {
    try {
      setLoading(true)
      const data = await getWallets()
      setWallets(data.length > 0 ? data : DEFAULT_WALLETS)
    } catch (error) {
      console.error("Error loading wallets:", error)
      toast({
        title: "Error",
        description: "Gagal memuat dompet",
        variant: "destructive",
      })
      setWallets(DEFAULT_WALLETS)
    } finally {
      setLoading(false)
    }
  }

  const addWallet = () => {
    const newWallet: WalletBalance = {
      id: crypto.randomUUID(),
      name: "",
      icon: "💳",
      color: "#000000",
      balance: 0,
      type: "other",
      description: "",
    }
    setWallets([...wallets, newWallet])
  }

  const updateWallet = (id: string, updates: Partial<WalletBalance>) => {
    setWallets(wallets.map((wallet) => (wallet.id === id ? { ...wallet, ...updates } : wallet)))
  }

  const deleteWallet = (id: string) => {
    setWallets(wallets.filter((wallet) => wallet.id !== id))
  }

  const saveChanges = async () => {
    try {
      setLoading(true)
      // Validasi data sebelum menyimpan
      const validWallets = wallets.filter((wallet) => wallet.name.trim() !== "")

      await updateSettings("wallets", validWallets)
      toast({
        title: "Berhasil",
        description: "Dompet berhasil disimpan",
      })
      await loadWallets() // Reload data after saving
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan dompet",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Memuat data...</div>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="flex items-center gap-2 p-2 border rounded-md">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            <Input
              type="color"
              value={wallet.color}
              className="w-12"
              onChange={(e) => updateWallet(wallet.id, { color: e.target.value })}
            />
            <Input
              placeholder="Nama dompet"
              value={wallet.name}
              onChange={(e) => updateWallet(wallet.id, { name: e.target.value })}
              className="flex-1"
            />
            <Select value={wallet.type} onValueChange={(value) => updateWallet(wallet.id, { type: value })}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                {WALLET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Saldo"
              value={wallet.balance}
              onChange={(e) => updateWallet(wallet.id, { balance: Number(e.target.value) })}
              className="w-32"
            />
            <Button variant="ghost" size="icon" onClick={() => deleteWallet(wallet.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={addWallet} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Tambah Dompet
      </Button>
      <Button onClick={saveChanges} className="w-full">
        Simpan Perubahan
      </Button>
    </div>
  )
}

