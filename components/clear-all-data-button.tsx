'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { clearAllData } from "@/app/actions/data-management"

const CONFIRM_WORD = "DELETE"

export function ClearAllDataButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const router = useRouter()

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD

  const handleOpenChange = (next: boolean) => {
    if (loading) return // don't allow closing mid-delete
    setOpen(next)
    if (!next) setConfirmText("")
  }

  const handleClear = async () => {
    if (!canConfirm) return
    setLoading(true)
    try {
      const result = await clearAllData()

      if (result.ok) {
        const { clients, orders } = result.deleted
        toast.success(
          `All data cleared (${clients} clients, ${orders} orders). You're starting fresh!`
        )
        setOpen(false)
        setConfirmText("")
        router.push("/")
        router.refresh()
      } else {
        toast.error(result.error)
        router.refresh()
      }
    } catch (error) {
      console.error("Error clearing data", error)
      toast.error("Failed to clear data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="h-4 w-4" />
          Clear All Data
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all data and start afresh?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>This action cannot be undone. It will permanently delete:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All clients and their measurements</li>
                <li>All orders, invoices and receipts, including payment records</li>
                <li>All expenses</li>
              </ul>
              <p>
                Your business profile, logo, bank account details and login are{" "}
                <strong className="text-foreground">not</strong> affected.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-clear">
            Type <span className="font-bold text-destructive">{CONFIRM_WORD}</span> to confirm
          </Label>
          <Input
            id="confirm-clear"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
            autoCapitalize="characters"
            disabled={loading}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleClear()
            }}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={!canConfirm || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Clear Everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
