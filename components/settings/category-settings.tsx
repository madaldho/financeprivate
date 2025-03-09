"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { Category } from "@/lib/sheet-config"
import { DEFAULT_CATEGORIES } from "@/lib/sheet-config"
import { getCategories, updateSettings } from "@/lib/sheet-actions"

export function CategorySettings() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoading(true)
      const data = await getCategories()
      setCategories(data.length > 0 ? data : DEFAULT_CATEGORIES)
    } catch (error) {
      console.error("Error loading categories:", error)
      toast({
        title: "Error",
        description: "Gagal memuat kategori",
        variant: "destructive",
      })
      setCategories(DEFAULT_CATEGORIES)
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
      icon: "📦",
      description: "",
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
      setLoading(true)
      // Validasi data sebelum menyimpan
      const validCategories = categories.filter((cat) => cat.name.trim() !== "")

      await updateSettings("categories", validCategories)
      toast({
        title: "Berhasil",
        description: "Kategori berhasil disimpan",
      })
      await loadCategories() // Reload data after saving
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan kategori",
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
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-2 p-2 border rounded-md">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
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
              className="flex-1"
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
                <SelectItem value="convert">Convert</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Icon (emoji)"
              value={category.icon}
              onChange={(e) => updateCategory(category.id, { icon: e.target.value })}
              className="w-20"
            />
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

