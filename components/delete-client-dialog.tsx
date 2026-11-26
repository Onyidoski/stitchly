'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
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
import { deleteClient } from "@/app/actions/data-management"

interface DeleteClientDialogProps {
  client: { id: string; name: string }
  /** The element that opens the confirmation (a button, menu text, etc.) */
  trigger: React.ReactNode
  /** Where to go after deleting. Leave out to stay on the page and just refresh it. */
  redirectTo?: string
}

export function DeleteClientDialog({ client, trigger, redirectTo }: DeleteClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const result = await deleteClient(client.id)

      if (result.ok) {
        toast.success(`${client.name} was deleted`)
        setOpen(false)
        if (redirectTo) router.push(redirectTo)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Error deleting client", error)
      toast.error("Failed to delete client. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {client.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. It will permanently delete this client and
            everything linked to them: all their orders (including invoices and
            receipts), payment records, expenses and measurements.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          {/* Prevent the default close so we can wait for the delete to finish */}
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Client
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
