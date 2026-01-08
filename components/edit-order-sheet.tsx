'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Edit2 } from "lucide-react"

// Define the shape of the order data we need
interface EditOrderProps {
  order: {
    id: string
    status: string
    payment_status: string
    total_amount: number
    paid_amount: number
  }
}

export function EditOrderSheet({ order }: EditOrderProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Local state for immediate UI feedback
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const newStatus = formData.get("status")
    const newPaymentStatus = formData.get("payment_status")
    const newPaidAmount = Number(formData.get("paid_amount"))

    const { error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        payment_status: newPaymentStatus,
        paid_amount: newPaidAmount
      })
      .eq('id', order.id)

    if (!error) {
      setOpen(false)
      router.refresh()
    } else {
      console.error("Error updating order", error)
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit Order</span>
        </Button>
      </SheetTrigger>
      
      {/* ADDED: sm:px-8 for better side padding */}
      <SheetContent className="sm:max-w-[400px] sm:px-8">
        <SheetHeader>
          <SheetTitle>Manage Order</SheetTitle>
          <SheetDescription>
            Update progress and payments.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-6">
          
          {/* WORKFLOW STATUS */}
          <div className="space-y-2">
            <Label htmlFor="status">Production Status</Label>
            <Select name="status" defaultValue={order.status}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cutting">Cutting</SelectItem>
                <SelectItem value="sewing">Sewing</SelectItem>
                <SelectItem value="fitting">Fitting</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t my-2"></div>

          {/* PAYMENT SECTION */}
          <div className="space-y-2">
            <Label htmlFor="payment_status">Payment Status</Label>
            <Select 
                name="payment_status" 
                defaultValue={order.payment_status}
                onValueChange={setPaymentStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="deposit">Deposit Paid</SelectItem>
                <SelectItem value="paid">Fully Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Total Amount</Label>
                <Input disabled value={order.total_amount} className="bg-muted" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="paid_amount">Amount Paid</Label>
                <Input 
                    id="paid_amount" 
                    name="paid_amount" 
                    type="number" 
                    defaultValue={order.paid_amount || 0}
                    // If they select "Paid", auto-fill the total (optional UX helper)
                    key={paymentStatus} 
                />
             </div>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}