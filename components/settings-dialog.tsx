"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
import { WalletSettings } from "./wallet-settings"
import { CategorySettings } from "./category-settings"

export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pengaturan</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="wallets">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wallets">Dompet</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
          </TabsList>
          <TabsContent value="wallets">
            <WalletSettings />
          </TabsContent>
          <TabsContent value="categories">
            <CategorySettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

