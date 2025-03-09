"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { Category } from "@/lib/types"
import { getCategories, updateSettings } from "@/lib/actions"

export function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat kategori",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addCategory = () => {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: "",
      color: "#000000",
      type: "pengeluaran",
    }
    setCategories([...categories, newCategory])
  }

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map((category) => (category.id === id ? { ...category, ...updates } : category)))
  }

  const deleteCategory = (id: string) => {
    setCategories(categories.filter((category) => category.id !== id))
  }

  const saveChanges = async () => {
    try {
      await updateSettings("categories", categories)
      toast({
        title: "Berhasil",
        description: "Kategori berhasil disimpan",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan kategori",
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
        {categories.map((category, index) => (
          <div key={category.id} className="flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-gray-400" />
            <Input
              type="color"
              value={category.color}
              className="w-12"
              onChange={(e) => updateCategory(category.id, { color: e.target.value })}
            />
            <Input
              placeholder="Nama kategori"
              value={category.name}
              onChange={(e) => updateCategory(category.id, { name: e.target.value })}
            />
            <Select
              value={category.type}
              onValueChange={(value: Category["type"]) => updateCategory(category.id, { type: value })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pemasukan">Pemasukan</SelectItem>
                <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => deleteCategory(category.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={addCategory} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Tambah Kategori
      </Button>
      <Button onClick={saveChanges} className="w-full">
        Simpan Perubahan
      </Button>
    </div>
  )
}

