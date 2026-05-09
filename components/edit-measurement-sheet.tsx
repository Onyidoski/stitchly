'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Edit2, Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

const measurementFields = [
  "round_shoulder", "round_armhole", "round_upper_bust", "shoulder", "bust_span",
  "bust", "bust_point", "underbust", "underbust_point", "waist", "waist_point",
  "hip", "hip_point", "back_length", "knee_length", "full_length", "blouse_length",
  "sleeve_length_short", "round_sleeve_short", "sleeve_length_elbow", "round_sleeve_elbow",
  "sleeve_length_3_4", "round_sleeve_3_4", "sleeve_length_full", "round_sleeve_full",
  "trouser_waist", "trouser_hips", "trouser_hip_point", "thigh", "round_knee",
  "ankle", "trouser_length", "pallazo_length"
]

const getOptionalFormValue = (formData: FormData, key: string) => {
  const value = formData.get(key)
  if (typeof value !== "string") return null

  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

// [FIX] Updated styling to match the "Add" sheet (h-9 for better touch targets)
const MeasurementField = ({ id, label, measurement }: { id: string, label: string, measurement: any }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
    <Input
      id={id}
      name={id}
      type="number"
      step="0.1"
      className="h-9 bg-muted/50 border-input"
      defaultValue={measurement[id] || ''}
    />
  </div>
)

export function EditMeasurementSheet({ measurement }: { measurement: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // 1. UPDATE Logic
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Please log in again to update measurements")
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      toast.error("Business profile not found")
      setLoading(false)
      return
    }

    const updates: Record<string, string | null> = {
      tenant_id: profile.tenant_id,
      notes: getOptionalFormValue(formData, "notes"),
    }

    measurementFields.forEach(field => {
      updates[field] = getOptionalFormValue(formData, field)
    })

    const { data, error } = await supabase
      .from('measurements')
      .update(updates)
      .eq('id', measurement.id)
      .eq('tenant_id', profile.tenant_id)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error(error)
      toast.error("Failed to update measurements")
    } else if (!data) {
      toast.error("Measurement was not updated. Please refresh and try again.")
    } else {
      toast.success("Measurements updated!")
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  // 2. DELETE Logic
  const handleDelete = async () => {
    setDeleteLoading(true)
    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('id', measurement.id)
      .eq('tenant_id', measurement.tenant_id)

    if (!error) {
      toast.success("Measurement deleted")
      setOpen(false)
      router.refresh()
    } else {
      toast.error("Failed to delete measurement")
    }
    setDeleteLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>

      {/* FIX 1: Use h-[100dvh] for full mobile height and remove default padding */}
      <SheetContent className="w-full sm:max-w-[600px] h-[100dvh] p-0 flex flex-col bg-background">

        {/* HEADER: Fixed at top */}
        <SheetHeader className="px-6 py-4 border-b flex-none">
          <SheetTitle>Edit Measurements</SheetTitle>
          <SheetDescription>Update or delete this record.</SheetDescription>
        </SheetHeader>

        {/* FORM: Flex container that fills remaining space */}
        <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">

          {/* FIX 2: Native scrolling div instead of ScrollArea */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-8 pb-4">

              {/* 1. BODY MEASUREMENTS */}
              <div>
                {/* FIX 3: Sticky Header */}
                <h4 className="font-medium text-primary mb-4 border-b pb-1 sticky top-0 bg-background z-10 w-full">Body / Top</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <MeasurementField id="round_shoulder" label="Round Shoulder" measurement={measurement} />
                  <MeasurementField id="round_armhole" label="Round Armhole" measurement={measurement} />
                  <MeasurementField id="round_upper_bust" label="Round Upper Bust" measurement={measurement} />
                  <MeasurementField id="shoulder" label="Shoulder" measurement={measurement} />
                  <MeasurementField id="bust_span" label="Bust Span" measurement={measurement} />
                  <MeasurementField id="bust" label="Bust" measurement={measurement} />
                  <MeasurementField id="bust_point" label="Bust Point" measurement={measurement} />
                  <MeasurementField id="underbust" label="Underbust" measurement={measurement} />
                  <MeasurementField id="underbust_point" label="Underbust Point" measurement={measurement} />
                  <MeasurementField id="waist" label="Waist" measurement={measurement} />
                  <MeasurementField id="waist_point" label="Waist Point" measurement={measurement} />
                  <MeasurementField id="hip" label="Hips" measurement={measurement} />
                  <MeasurementField id="hip_point" label="Hip Point" measurement={measurement} />
                  <MeasurementField id="back_length" label="Back Length" measurement={measurement} />
                  <MeasurementField id="knee_length" label="Knee Length" measurement={measurement} />
                  <MeasurementField id="blouse_length" label="Blouse Length" measurement={measurement} />
                  <MeasurementField id="full_length" label="Full Length" measurement={measurement} />
                </div>
              </div>

              {/* 2. SLEEVES */}
              <div>
                {/* FIX 3: Sticky Header */}
                <h4 className="font-medium text-primary mb-4 border-b pb-1 sticky top-0 bg-background z-10 w-full">Sleeves</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-[-10px]">Length</div>
                  <div className="text-xs font-semibold text-muted-foreground mb-[-10px]">Round</div>

                  <MeasurementField id="sleeve_length_short" label="Short Sleeve Length" measurement={measurement} />
                  <MeasurementField id="round_sleeve_short" label="Round Short Sleeve" measurement={measurement} />
                  <MeasurementField id="sleeve_length_elbow" label="Elbow Sleeve Length" measurement={measurement} />
                  <MeasurementField id="round_sleeve_elbow" label="Round Elbow Sleeve" measurement={measurement} />
                  <MeasurementField id="sleeve_length_3_4" label="3/4 Sleeve Length" measurement={measurement} />
                  <MeasurementField id="round_sleeve_3_4" label="Round 3/4 Sleeve" measurement={measurement} />
                  <MeasurementField id="sleeve_length_full" label="Full Sleeve Length" measurement={measurement} />
                  <MeasurementField id="round_sleeve_full" label="Round Full Sleeve" measurement={measurement} />
                </div>
              </div>

              {/* 3. TROUSERS */}
              <div>
                {/* FIX 3: Sticky Header */}
                <h4 className="font-medium text-primary mb-4 border-b pb-1 sticky top-0 bg-background z-10 w-full">Trouser / Bottom</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <MeasurementField id="trouser_waist" label="Trouser Waist" measurement={measurement} />
                  <MeasurementField id="trouser_hips" label="Trouser Hips" measurement={measurement} />
                  <MeasurementField id="trouser_hip_point" label="Hip Point (Waist-Hip)" measurement={measurement} />
                  <MeasurementField id="thigh" label="Laps / Thigh" measurement={measurement} />
                  <MeasurementField id="round_knee" label="Round Knee" measurement={measurement} />
                  <MeasurementField id="ankle" label="Ankle / Foot" measurement={measurement} />
                  <MeasurementField id="trouser_length" label="Trouser Length" measurement={measurement} />
                  <MeasurementField id="pallazo_length" label="Pallazo Length" measurement={measurement} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Input id="notes" name="notes" defaultValue={measurement.notes || ''} className="bg-muted/50 border-input" />
              </div>
            </div>
          </div>

          {/* FOOTER: Fixed at bottom */}
          <SheetFooter className="px-6 py-4 border-t flex-none bg-background flex flex-row justify-between gap-4">

            {/* DELETE BUTTON (Left) */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="icon" disabled={loading || deleteLoading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this measurement?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This record will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* SAVE BUTTON (Right) */}
            <Button type="submit" disabled={loading || deleteLoading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
