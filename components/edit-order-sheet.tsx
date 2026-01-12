'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Edit2, CalendarIcon } from "lucide-react"
import { toast } from "sonner"

interface EditOrderProps {
    order: {
        id: string
        status: string
        payment_status: string
        total_amount: number
        paid_amount: number
        delivery_date: string // [1] Added this
    }
}

export function EditOrderSheet({ order }: EditOrderProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [status, setStatus] = useState(order.status)
    const [paymentStatus, setPaymentStatus] = useState(order.payment_status)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const newPaidAmount = Number(formData.get("paid_amount"))
        const newDeliveryDate = formData.get("delivery_date") as string // [2] Get date

        const { error } = await supabase
            .from('orders')
            .update({
                status: status,
                payment_status: paymentStatus,
                paid_amount: newPaidAmount,
                delivery_date: newDeliveryDate // [3] Update in DB
            })
            .eq('id', order.id)

        if (!error) {
            toast.success("Order updated successfully")
            setOpen(false)
            router.refresh()
        } else {
            console.error("Error updating order", error)
            toast.error("Failed to update order")
        }
        setLoading(false)
    }

    const getAmountDefaultValue = () => {
        if (paymentStatus === 'paid') return order.total_amount
        if (paymentStatus === 'unpaid') return 0
        return order.paid_amount || 0
    }

    // Helper to format date for Input type="date" (YYYY-MM-DD)
    const formattedDate = order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : ''

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
                        Update progress, dates, and payments.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-6">

                    {/* [4] DELIVERY DATE FIELD */}
                    <div className="space-y-2">
                        <Label htmlFor="delivery_date">Delivery Date</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="delivery_date" 
                                name="delivery_date" 
                                type="date" 
                                className="pl-9"
                                defaultValue={formattedDate} 
                                required
                            />
                        </div>
                    </div>

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
                                defaultValue={getAmountDefaultValue()}
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