'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Scissors, Loader2, Sparkles, ArrowRight } from "lucide-react"
import { ImageUploader } from "@/components/image-uploader"
import { OrderDiscountFields } from "@/components/order-discount-fields"
import { toast } from "sonner"
import type { DiscountType } from "@/lib/order-money"

export function AddOrderSheet({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const [aiLoading, setAiLoading] = useState(false)
  const [estimate, setEstimate] = useState<{
    fabric_yards: string
    price_min: number
    price_max: number
    reasoning: string
  } | null>(null)
  const [description, setDescription] = useState("")
  const [clientMeasurements, setClientMeasurements] = useState<any>(null)
  const [totalAmountPreview, setTotalAmountPreview] = useState(0)
  const [discountType, setDiscountType] = useState<DiscountType>(null)
  const [discountValue, setDiscountValue] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  const formRef = useRef<HTMLFormElement>(null)
  const DRAFT_KEY = `stitchly_order_draft_${clientId}`

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        try {
          const draft = localStorage.getItem(DRAFT_KEY)
          if (draft) {
            const data = JSON.parse(draft)
            
            if (data.description !== undefined) setDescription(data.description)
            if (data.imageUrls !== undefined) setImageUrls(data.imageUrls)
            if (data.estimate !== undefined) setEstimate(data.estimate)

            let restored = 0
            Object.entries(data).forEach(([key, value]) => {
              if (['description', 'imageUrls', 'estimate'].includes(key)) return
              const el = document.getElementById(key) as HTMLInputElement
              if (el && value) {
                el.value = String(value)
                restored++
              }
            })
            
            if (restored > 0 || data.description || (data.imageUrls && data.imageUrls.length > 0)) {
              toast.success("Unsaved draft restored automatically")
            }
          }
        } catch (e) {
          console.error("Failed to parse order draft", e)
        }
      }, 100)
    }
  }, [open, DRAFT_KEY])

  const saveDraft = (overrides?: {
    desc?: string;
    imgs?: string[];
    est?: any;
  }) => {
    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    
    const draft: Record<string, any> = {
      description: overrides?.desc !== undefined ? overrides.desc : description,
      imageUrls: overrides?.imgs !== undefined ? overrides.imgs : imageUrls,
      estimate: overrides?.est !== undefined ? overrides.est : estimate
    }

    formData.forEach((value, key) => {
      const strVal = String(value).trim()
      if (strVal && key !== 'fabric') {
        draft[key] = strVal
      }
    })
    
    // Only save if there's actual data
    if (
      Object.keys(draft).length > 3 || 
      draft.description || 
      (draft.imageUrls && draft.imageUrls.length > 0) || 
      draft.estimate
    ) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } else {
      localStorage.removeItem(DRAFT_KEY)
    }
  }

  const bustMeasurement = clientMeasurements?.bust ?? clientMeasurements?.chest
  const hipMeasurement = clientMeasurements?.hip ?? clientMeasurements?.hips
  const sleeveMeasurement = clientMeasurements?.sleeve ?? clientMeasurements?.sleeve_length_full
  const lengthMeasurement =
    clientMeasurements?.length ??
    clientMeasurements?.full_length ??
    clientMeasurements?.blouse_length

  useEffect(() => {
    async function fetchMeasurements() {
      if (!open || !clientId) return

      const { data } = await supabase
        .from('measurements')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setClientMeasurements(data ?? null)
    }

    fetchMeasurements()
  }, [open, clientId, supabase])

  const handleAiEstimate = async () => {
    if (!description || description.length < 5) {
      toast.error("Please enter a style description first")
      return
    }

    setAiLoading(true)
    setEstimate(null)

    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        body: JSON.stringify({
          description,
          measurements: clientMeasurements,
        }),
      })

      const data = await res.json()

      if (data.result) {
        setEstimate(data.result)
        setTimeout(() => saveDraft({ est: data.result }), 0)
        toast.success("Estimate generated!")
      } else {
        toast.error(data.error || "Could not generate estimate")
      }
    } catch {
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
        const typeRaw = (formData.get("discount_type") as string) || ''
        const parsedType: DiscountType =
          typeRaw === 'fixed' || typeRaw === 'percent' ? typeRaw : null
        const parsedValue = Number(formData.get("discount_value")) || 0

        const { error } = await supabase.from('orders').insert({
          tenant_id: profile.tenant_id,
          client_id: clientId,
          fabric_description: formData.get("fabric"),
          color: formData.get("color"),
          quantity: Number(formData.get("quantity")),
          total_amount: Number(formData.get("amount")),
          discount_type: parsedType,
          discount_value: parsedType ? parsedValue : 0,
          delivery_date: formData.get("delivery_date"),
          style_image_urls: imageUrls,
          status: 'cutting',
          payment_status: 'unpaid',
        })

        if (!error) {
          toast.success("New order created!")
          localStorage.removeItem(DRAFT_KEY)
          setOpen(false)
          setImageUrls([])
          setEstimate(null)
          setDescription("")
          setTotalAmountPreview(0)
          setDiscountType(null)
          setDiscountValue(0)
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
        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          onChange={() => setTimeout(() => saveDraft(), 0)}
          className="grid gap-6 py-6"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="fabric">Fabric / Style Description</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAiEstimate}
                disabled={aiLoading}
                className="h-6 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:text-indigo-200 dark:hover:bg-indigo-500/10"
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
              onChange={(e) => {
                setDescription(e.target.value)
                setTimeout(() => saveDraft({ desc: e.target.value }), 0)
              }}
            />

            {clientMeasurements ? (
              <p className="text-[10px] text-emerald-600 text-right animate-in fade-in">
                Using client measurements (Bust: {bustMeasurement || '-'}, Hip: {hipMeasurement || '-'}, Sleeve: {sleeveMeasurement || '-'}, Length: {lengthMeasurement || '-'})
              </p>
            ) : (
              <p className="text-[10px] text-amber-600 text-right animate-in fade-in flex justify-end items-center gap-1 flex-wrap">
                <span>No measurements found. Using standard sizing.</span>
                <span className="italic opacity-80">(Input client measurement for precise estimate)</span>
              </p>
            )}

            {estimate && (
              <div className="rounded-xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-background to-slate-50 p-4 text-sm shadow-sm animate-in slide-in-from-top-2 dark:border-indigo-500/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-100">AI Suggestion:</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full px-3 text-[10px] text-indigo-700 bg-white/90 border border-indigo-200 hover:bg-white dark:bg-slate-900/80 dark:border-indigo-400/30 dark:text-indigo-200 dark:hover:bg-slate-900"
                    onClick={() => {
                      const input = document.getElementById('amount') as HTMLInputElement
                      if (input) {
                        input.value = estimate.price_max.toString()
                        setTotalAmountPreview(estimate.price_max)
                        setTimeout(() => saveDraft(), 0)
                      }
                      toast.success(`Applied price: N${estimate.price_max}`)
                    }}
                  >
                    Apply Price <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="space-y-2 text-indigo-900 dark:text-indigo-100">
                  <p><span className="font-medium text-indigo-700 dark:text-indigo-300">Fabric:</span> {estimate.fabric_yards}</p>
                  <p><span className="font-medium text-indigo-700 dark:text-indigo-300">Price:</span> N{estimate.price_min.toLocaleString()} - N{estimate.price_max.toLocaleString()}</p>
                  <p className="text-xs leading-6 text-slate-700 italic dark:text-slate-300">"{estimate.reasoning}"</p>
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
              <Label htmlFor="amount">Total Amount (N)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0.00"
                required
                onChange={(e) => setTotalAmountPreview(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_date">Delivery Date</Label>
              <Input id="delivery_date" name="delivery_date" type="date" required />
            </div>
          </div>

          <OrderDiscountFields
            totalAmount={totalAmountPreview}
            type={discountType}
            value={discountValue}
            onTypeChange={setDiscountType}
            onValueChange={setDiscountValue}
            useHiddenInputs
          />

          <div className="space-y-2">
            <Label>Style References</Label>
            <div className="border rounded-md p-4 bg-muted/50">
              <ImageUploader onUploadComplete={(urls) => {
                setImageUrls(urls)
                setTimeout(() => saveDraft({ imgs: urls }), 0)
              }} />
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
