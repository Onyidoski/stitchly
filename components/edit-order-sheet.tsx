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

    // Local state for controlled inputs (Safe way to ensure values exist)
    const [status, setStatus] = useState(order.status)
    const [paymentStatus, setPaymentStatus] = useState(order.payment_status)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        // We can still use FormData for simple inputs like paid_amount
        const formData = new FormData(e.currentTarget)
        const newPaidAmount = Number(formData.get("paid_amount"))

        const { error } = await supabase
            .from('orders')
            .update({
                status: status, // Use state directly
                payment_status: paymentStatus, // Use state directly
                paid_amount: newPaidAmount
            })
            .eq('id', order.id)

        if (!error) {
            setOpen(false)
            router.refresh()
        } else {
            console.error("Error updating order", error)
            alert("Error updating order")
        }
        setLoading(false)
    }

    // Helper to determine the default value for the amount input
    const getAmountDefaultValue = () => {
        if (paymentStatus === 'paid') return order.total_amount
        if (paymentStatus === 'unpaid') return 0
        return order.paid_amount || 0
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit Order</span>
                </Button>
            </SheetTrigger>

            <SheetContent className="sm:max-w-[400px] sm:px-8 px-6">
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
                        <Select
                            name="status"
                            value={status}
                            onValueChange={setStatus}
                        >
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
                            value={paymentStatus}
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
                                // This logic handles the auto-update
                                defaultValue={getAmountDefaultValue()}
                                // Key forces the input to re-render when status changes
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