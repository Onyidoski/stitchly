'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Ruler, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner" // [1] IMPORT TOAST

export function AddMeasurementSheet({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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
        const { error } = await supabase.from('measurements').insert({
          tenant_id: profile.tenant_id,
          client_id: clientId,
          // Body
          round_shoulder: formData.get("round_shoulder"),
          round_armhole: formData.get("round_armhole"),
          round_upper_bust: formData.get("round_upper_bust"),
          shoulder: formData.get("shoulder"),
          bust_span: formData.get("bust_span"),
          bust: formData.get("bust"),
          bust_point: formData.get("bust_point"),
          underbust: formData.get("underbust"),
          underbust_point: formData.get("underbust_point"),
          waist: formData.get("waist"),
          waist_point: formData.get("waist_point"),
          hip: formData.get("hip"),
          back_length: formData.get("back_length"),
          hip_point: formData.get("hip_point"),
          knee_length: formData.get("knee_length"),
          full_length: formData.get("full_length"),
          blouse_length: formData.get("blouse_length"),
          
          // Sleeves
          sleeve_length_short: formData.get("sleeve_length_short"),
          round_sleeve_short: formData.get("round_sleeve_short"),
          sleeve_length_elbow: formData.get("sleeve_length_elbow"),
          round_sleeve_elbow: formData.get("round_sleeve_elbow"),
          sleeve_length_3_4: formData.get("sleeve_length_3_4"),
          round_sleeve_3_4: formData.get("round_sleeve_3_4"),
          sleeve_length_full: formData.get("sleeve_length_full"),
          round_sleeve_full: formData.get("round_sleeve_full"),

          // Trouser
          trouser_waist: formData.get("trouser_waist"),
          trouser_hips: formData.get("trouser_hips"),
          trouser_hip_point: formData.get("trouser_hip_point"),
          thigh: formData.get("thigh"),
          round_knee: formData.get("round_knee"),
          ankle: formData.get("ankle"),
          trouser_length: formData.get("trouser_length"),
          pallazo_length: formData.get("pallazo_length"),
          
          notes: formData.get("notes"),
        })

        if (!error) {
          toast.success("Measurements added successfully") // [2] SUCCESS TOAST
          setOpen(false)
          router.refresh()
        } else {
            console.error(error)
            toast.error("Failed to add measurements") // [3] ERROR TOAST
        }
      }
    }
    setLoading(false)
  }

  // ... (Rest of component remains exactly the same) ...

  const Field = ({ id, label }: { id: string, label: string }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input id={id} name={id} type="number" step="0.1" className="h-8" />
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <Ruler className="h-4 w-4" /> Add Measurements
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[600px] sm:px-0">
        <SheetHeader className="px-6">
          <SheetTitle>New Measurements</SheetTitle>
          <SheetDescription>
            Enter comprehensive measurement details.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full pb-20">
          <ScrollArea className="flex-1 px-6 py-4 h-[calc(100vh-200px)]">
            <div className="space-y-8">
                
                {/* 1. BODY MEASUREMENTS */}
                <div>
                    <h4 className="font-medium text-primary mb-4 border-b pb-1">Body / Top</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <Field id="round_shoulder" label="Round Shoulder" />
                        <Field id="round_armhole" label="Round Armhole" />
                        <Field id="round_upper_bust" label="Round Upper Bust" />
                        <Field id="shoulder" label="Shoulder" />
                        <Field id="bust_span" label="Bust Span" />
                        <Field id="bust" label="Bust" />
                        <Field id="bust_point" label="Bust Point" />
                        <Field id="underbust" label="Underbust" />
                        <Field id="underbust_point" label="Underbust Point" />
                        <Field id="waist" label="Waist" />
                        <Field id="waist_point" label="Waist Point" />
                        <Field id="hip" label="Hips" />
                        <Field id="hip_point" label="Hip Point" />
                        <Field id="back_length" label="Back Length" />
                        <Field id="knee_length" label="Knee Length" />
                        <Field id="blouse_length" label="Blouse Length" />
                        <Field id="full_length" label="Full Length" />
                    </div>
                </div>

                {/* 2. SLEEVE MEASUREMENTS (Side by Side) */}
                <div>
                    <h4 className="font-medium text-primary mb-4 border-b pb-1">Sleeves</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {/* Header Row */}
                        <div className="text-xs font-semibold text-muted-foreground mb-[-10px]">Length</div>
                        <div className="text-xs font-semibold text-muted-foreground mb-[-10px]">Round</div>

                        <Field id="sleeve_length_short" label="Short Sleeve Length" />
                        <Field id="round_sleeve_short" label="Round Short Sleeve" />

                        <Field id="sleeve_length_elbow" label="Elbow Sleeve Length" />
                        <Field id="round_sleeve_elbow" label="Round Elbow Sleeve" />

                        <Field id="sleeve_length_3_4" label="3/4 Sleeve Length" />
                        <Field id="round_sleeve_3_4" label="Round 3/4 Sleeve" />

                        <Field id="sleeve_length_full" label="Full Sleeve Length" />
                        <Field id="round_sleeve_full" label="Round Full Sleeve" />
                    </div>
                </div>

                {/* 3. TROUSER MEASUREMENTS */}
                <div>
                    <h4 className="font-medium text-primary mb-4 border-b pb-1">Trouser / Bottom</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <Field id="trouser_waist" label="Trouser Waist" />
                        <Field id="trouser_hips" label="Trouser Hips" />
                        <Field id="trouser_hip_point" label="Hip Point (Waist-Hip)" />
                        <Field id="thigh" label="Laps / Thigh" />
                        <Field id="round_knee" label="Round Knee" />
                        <Field id="ankle" label="Ankle / Foot" />
                        <Field id="trouser_length" label="Trouser Length" />
                        <Field id="pallazo_length" label="Pallazo Length" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Input id="notes" name="notes" placeholder="Any specific requirements..." />
                </div>
            </div>
          </ScrollArea>

          {/* ADDED pb-10 here for spacing */}
          <SheetFooter className="px-6 pt-4 pb-10 border-t">
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