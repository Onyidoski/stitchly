'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Scissors, Loader2 } from "lucide-react"
import { ImageUploader } from "@/components/image-uploader"
import { toast } from "sonner" // [1] IMPORT TOAST

export function AddOrderSheet({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (profile?.tenant_id) {
        const { error } = await supabase.from('orders').insert({
          tenant_id: profile.tenant_id,
          client_id: clientId,
          fabric_description: formData.get("fabric"),
          color: formData.get("color"),
          quantity: Number(formData.get("quantity")),
          total_amount: Number(formData.get("amount")),
          delivery_date: formData.get("delivery_date"),
          style_image_urls: imageUrls,
          status: 'cutting',
          payment_status: 'unpaid'
        })

        if (!error) {
          toast.success("New order created!") // [2] SUCCESS TOAST
          setOpen(false)
          setImageUrls([])
          router.refresh()
        } else {
            console.error(error)
            toast.error("Failed to create order.") // [3] ERROR TOAST (replaced alert)
        }
      }
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* ... rest of the JSX remains exactly the same ... */}
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2 bg-slate-800">
          <Scissors className="h-4 w-4" /> New Order
        </Button>
      </SheetTrigger>
      {/* FIX: Added 'w-full px-6' to ensure padding and full width on mobile */}
      <SheetContent className="w-full sm:max-w-[500px] px-6 sm:px-8 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Order</SheetTitle>
          <SheetDescription>
            Enter details and upload style references.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-6">
          
          <div className="space-y-2">
            <Label htmlFor="fabric">Fabric / Style Description</Label>
            <Textarea id="fabric" name="fabric" placeholder="e.g. Ankara fabric, long gown..." required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" placeholder="Blue/Gold" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" defaultValue="1" min="1" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="amount">Total Amount (₦)</Label>
                <Input id="amount" name="amount" type="number" placeholder="0.00" required />
             </div>
             <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input id="delivery_date" name="delivery_date" type="date" required />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Style References</Label>
             <div className="border rounded-md p-4 bg-slate-50">
                <ImageUploader onUploadComplete={(urls) => setImageUrls(urls)} />
             </div>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Order
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}