'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Ruler, Loader2 } from "lucide-react"

export function AddMeasurementSheet({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    // 1. Get current user & tenant
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (profile?.tenant_id) {
        // 2. Insert Measurement
        const { error } = await supabase.from('measurements').insert({
          tenant_id: profile.tenant_id,
          client_id: clientId,
          chest: formData.get("chest"),
          waist: formData.get("waist"),
          hip: formData.get("hip"),
          shoulder: formData.get("shoulder"),
          sleeve: formData.get("sleeve"),
          length: formData.get("length"),
          notes: formData.get("notes"),
        })

        if (!error) {
          setOpen(false)
          router.refresh()
        }
      }
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <Ruler className="h-4 w-4" /> Add Measurements
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[500px] sm:px-8">
        <SheetHeader>
          <SheetTitle>New Measurements</SheetTitle>
          <SheetDescription>
            Add a new set of body measurements for this client.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="chest">Chest</Label>
                <Input id="chest" name="chest" type="number" step="0.1" placeholder="0.0" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="waist">Waist</Label>
                <Input id="waist" name="waist" type="number" step="0.1" placeholder="0.0" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="hip">Hip</Label>
                <Input id="hip" name="hip" type="number" step="0.1" placeholder="0.0" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="shoulder">Shoulder</Label>
                <Input id="shoulder" name="shoulder" type="number" step="0.1" placeholder="0.0" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="sleeve">Sleeve</Label>
                <Input id="sleeve" name="sleeve" type="number" step="0.1" placeholder="0.0" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="length">Total Length</Label>
                <Input id="length" name="length" type="number" step="0.1" placeholder="0.0" />
             </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="e.g. Loose fit requested" />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Measurements
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}