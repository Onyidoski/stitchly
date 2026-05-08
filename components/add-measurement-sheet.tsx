'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Ruler, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AddMeasurementSheet({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const getOptionalValue = (formData: FormData, key: string) => {
    const value = formData.get(key)
    if (typeof value !== "string") return value

    const trimmed = value.trim()
    return trimmed === "" ? null : trimmed
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
        const { error } = await supabase.from('measurements').insert({
          tenant_id: profile.tenant_id,
          client_id: clientId,
          // Body
          round_shoulder: getOptionalValue(formData, "round_shoulder"),
          round_armhole: getOptionalValue(formData, "round_armhole"),
          round_upper_bust: getOptionalValue(formData, "round_upper_bust"),
          shoulder: getOptionalValue(formData, "shoulder"),
          bust_span: getOptionalValue(formData, "bust_span"),
          bust: getOptionalValue(formData, "bust"),
          bust_point: getOptionalValue(formData, "bust_point"),
          underbust: getOptionalValue(formData, "underbust"),
          underbust_point: getOptionalValue(formData, "underbust_point"),
          waist: getOptionalValue(formData, "waist"),
          waist_point: getOptionalValue(formData, "waist_point"),
          hip: getOptionalValue(formData, "hip"),
          back_length: getOptionalValue(formData, "back_length"),
          hip_point: getOptionalValue(formData, "hip_point"),
          knee_length: getOptionalValue(formData, "knee_length"),
          full_length: getOptionalValue(formData, "full_length"),
          blouse_length: getOptionalValue(formData, "blouse_length"),

          // Sleeves
          sleeve_length_short: getOptionalValue(formData, "sleeve_length_short"),
          round_sleeve_short: getOptionalValue(formData, "round_sleeve_short"),
          sleeve_length_elbow: getOptionalValue(formData, "sleeve_length_elbow"),
          round_sleeve_elbow: getOptionalValue(formData, "round_sleeve_elbow"),
          sleeve_length_3_4: getOptionalValue(formData, "sleeve_length_3_4"),
          round_sleeve_3_4: getOptionalValue(formData, "round_sleeve_3_4"),
          sleeve_length_full: getOptionalValue(formData, "sleeve_length_full"),
          round_sleeve_full: getOptionalValue(formData, "round_sleeve_full"),

          // Trouser
          trouser_waist: getOptionalValue(formData, "trouser_waist"),
          trouser_hips: getOptionalValue(formData, "trouser_hips"),
          trouser_hip_point: getOptionalValue(formData, "trouser_hip_point"),
          thigh: getOptionalValue(formData, "thigh"),
          round_knee: getOptionalValue(formData, "round_knee"),
          ankle: getOptionalValue(formData, "ankle"),
          trouser_length: getOptionalValue(formData, "trouser_length"),
          pallazo_length: getOptionalValue(formData, "pallazo_length"),

          notes: getOptionalValue(formData, "notes"),
        })

        if (!error) {
          toast.success("Measurements added successfully")
          setOpen(false)
          router.refresh()
        } else {
          console.error(error)
          toast.error(error.message || "Failed to add measurements")
        }
      }
    }
    setLoading(false)
  }

  const Field = ({ id, label }: { id: string, label: string }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input id={id} name={id} type="number" step="0.1" className="h-9 bg-muted/50 border-input" />
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <Ruler className="h-4 w-4" /> Add Measurements
        </Button>
      </SheetTrigger>
      {/* FIX 1: h-[100dvh] forces the sheet to respect the mobile browser height strictly.
         p-0 removes default padding that messes up full-width layouts.
      */}
      <SheetContent className="w-full sm:max-w-[600px] h-[100dvh] p-0 flex flex-col bg-background">

        {/* HEADER: Fixed at top */}
        <SheetHeader className="px-6 py-4 border-b flex-none">
          <SheetTitle>New Measurements</SheetTitle>
          <SheetDescription>
            Enter comprehensive measurement details.
          </SheetDescription>
        </SheetHeader>

        {/* FORM: Takes all remaining space */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">

          {/* FIX 2: NATIVE SCROLLING
             Replaced <ScrollArea> with a simple div using 'overflow-y-auto'.
             This is 100% reliable on mobile phones.
          */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-8 pb-4">

              {/* 1. BODY MEASUREMENTS */}
              <div>
                <h4 className="font-medium text-primary mb-4 border-b pb-1 sticky top-0 bg-background z-10 w-full">Body / Top</h4>
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

              {/* 2. SLEEVE MEASUREMENTS */}
              <div>
                <h4 className="font-medium text-primary mb-4 border-b pb-1 sticky top-0 bg-background z-10 w-full">Sleeves</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
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
                <h4 className="font-medium text-primary mb-4 border-b pb-1 sticky top-0 bg-background z-10 w-full">Trouser / Bottom</h4>
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
          </div>

          {/* FOOTER: Fixed at bottom */}
          <SheetFooter className="px-6 py-4 border-t flex-none bg-background">
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
