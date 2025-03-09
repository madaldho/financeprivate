"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { WalletBalance } from "@/lib/types"
import { getWallets, updateSettings } from "@/lib/actions"

const WALLET_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Kartu" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "bank", label: "Bank" },
]

export function ManageWallets() {
  const [wallets, setWallets] = useState<WalletBalance[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadWallets()
  }, [])

  async function loadWallets() {
    try {
      const data = await getWallets()
      setWallets(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat dompet",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addWallet = () => {
    const newWallet: WalletBalance = {
      id: crypto.randomUUID(),
      name: "",
      icon: "default",
      color: "#000000",
      balance: 0,
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
      await updateSettings("wallets", wallets)
      toast({
        title: "Berhasil",
        description: "Dompet berhasil disimpan",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan dompet",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {wallets.map((wallet, index) => (
          <div key={wallet.id} className="flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-gray-400" />
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
            />
            <Select value={wallet.icon} onValueChange={(value) => updateWallet(wallet.id, { icon: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WALLET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

