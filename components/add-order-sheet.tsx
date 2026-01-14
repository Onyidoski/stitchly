'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Scissors, Loader2, Sparkles, ArrowRight } from "lucide-react"
import { ImageUploader } from "@/components/image-uploader"
import { toast } from "sonner"

export function AddOrderSheet({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  
  // AI States
  const [aiLoading, setAiLoading] = useState(false)
  const [estimate, setEstimate] = useState<{
    fabric_yards: string;
    price_min: number;
    price_max: number;
    reasoning: string;
  } | null>(null)
  const [description, setDescription] = useState("") 

  const router = useRouter()
  const supabase = createClient()

  // AI Handler
  const handleAiEstimate = async () => {
    if (!description || description.length < 5) {
      toast.error("Please enter a style description first")
      return
    }

    setAiLoading(true)
    setEstimate(null) // Reset previous estimate

    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        body: JSON.stringify({ description })
      })
      
      const data = await res.json()
      
      if (data.result) {
        setEstimate(data.result)
        toast.success("Estimate generated!")
      } else {
        toast.error("Could not generate estimate")
      }
    } catch (e) {
      toast.error("AI service error")
    } finally {
      setAiLoading(false)
    }
  }

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
          toast.success("New order created!")
          setOpen(false)
          setImageUrls([])
          setEstimate(null) // Clear estimate
          setDescription("")
          router.refresh()
        } else {
          console.error(error)
          toast.error("Failed to create order.")
        }
      }
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <Scissors className="h-4 w-4" /> New Order
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[500px] px-6 sm:px-8 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Order</SheetTitle>
          <SheetDescription>
            Enter details and upload style references.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-6">

          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label htmlFor="fabric">Fabric / Style Description</Label>
                {/* AI Button - Dark Mode Fixed */}
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleAiEstimate}
                    disabled={aiLoading}
                    className="h-6 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                >
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    {aiLoading ? 'Analyzing...' : 'AI Estimate'}
                </Button>
            </div>
            <Textarea 
                id="fabric" 
                name="fabric" 
                placeholder="e.g. Off-shoulder Ankara gown with lace trimming..." 
                required 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            {/* Estimate Result Card - Dark Mode Fixed */}
            {estimate && (
                <div className="rounded-md bg-indigo-50 dark:bg-indigo-950/30 p-3 border border-indigo-100 dark:border-indigo-800 text-sm animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">AI Suggestion:</span>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 px-2 text-[10px] text-indigo-700 dark:text-indigo-300 bg-white dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 hover:bg-white dark:hover:bg-indigo-900"
                            onClick={() => {
                                const input = document.getElementById('amount') as HTMLInputElement
                                if(input) input.value = estimate.price_max.toString()
                                toast.success(`Applied price: ₦${estimate.price_max}`)
                            }}
                        >
                            Apply Price <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                    <div className="space-y-1 text-indigo-800 dark:text-indigo-200">
                        <p>📏 <span className="font-medium">Fabric:</span> {estimate.fabric_yards}</p>
                        <p>💰 <span className="font-medium">Price:</span> ₦{estimate.price_min.toLocaleString()} - ₦{estimate.price_max.toLocaleString()}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 italic">"{estimate.reasoning}"</p>
                    </div>
                </div>
            )}
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
            <div className="border rounded-md p-4 bg-muted/50">
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