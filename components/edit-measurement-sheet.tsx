'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Edit2, Loader2, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { toast } from "sonner" // [1] IMPORT TOAST

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
    
    const updates: any = {
      notes: formData.get("notes"),
    }
    
    const fields = [
      "round_shoulder", "round_armhole", "round_upper_bust", "shoulder", "bust_span", 
      "bust", "bust_point", "underbust", "underbust_point", "waist", "waist_point", 
      "hip", "hip_point", "back_length", "knee_length", "full_length", "blouse_length",
      "sleeve_length_short", "round_sleeve_short", "sleeve_length_elbow", "round_sleeve_elbow",
      "sleeve_length_3_4", "round_sleeve_3_4", "sleeve_length_full", "round_sleeve_full",
      "trouser_waist", "trouser_hips", "trouser_hip_point", "thigh", "round_knee", 
      "ankle", "trouser_length", "pallazo_length"
    ]

    fields.forEach(field => {
        const val = formData.get(field)
        if (val) updates[field] = val
    })

    const { error } = await supabase
      .from('measurements')
      .update(updates)
      .eq('id', measurement.id)

    if (!error) {
      toast.success("Measurements updated!") // [2] SUCCESS TOAST
      setOpen(false)
      router.refresh()
    } else {
      console.error(error)
      toast.error("Failed to update measurements") // [3] ERROR TOAST
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

    if (!error) {
        toast.success("Measurement deleted") // [4] SUCCESS TOAST
        setOpen(false)
        router.refresh()
    } else {
        toast.error("Failed to delete measurement") // [5] ERROR TOAST
    }
    setDeleteLoading(false)
  }

  // ... (Rest of the JSX remains exactly the same) ...

  const Field = ({ id, label }: { id: string, label: string }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input 
        id={id} 
        name={id} 
        type="number" 
        step="0.1" 
        className="h-8" 
        defaultValue={measurement[id] || ''} 
      />
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      
      <SheetContent className="sm:max-w-[600px] sm:px-0">
        <SheetHeader className="px-6">
          <SheetTitle>Edit Measurements</SheetTitle>
          <SheetDescription>Update or delete this record.</SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleUpdate} className="flex flex-col h-full pb-20">
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

                {/* 2. SLEEVES */}
                <div>
                    <h4 className="font-medium text-primary mb-4 border-b pb-1">Sleeves</h4>
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

                {/* 3. TROUSERS */}
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
                    <Input id="notes" name="notes" defaultValue={measurement.notes || ''} />
                </div>
            </div>
          </ScrollArea>

          {/* ADDED pb-10 here */}
          <SheetFooter className="px-6 pt-4 pb-10 border-t flex flex-row justify-between gap-4">
            
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