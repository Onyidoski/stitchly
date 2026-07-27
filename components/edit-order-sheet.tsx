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
import { WhatsAppMessageButton } from "@/components/whatsapp-message-button"
import { OrderDiscountFields } from "@/components/order-discount-fields"
import {
    getOrderNet,
    type DiscountType,
} from "@/lib/order-money"
import type { WhatsAppMessageContext } from "@/lib/whatsapp"

interface EditOrderProps {
    order: {
        id: string
        status: string
        payment_status: string
        total_amount: number
        paid_amount: number
        delivery_date: string
        fabric_description?: string | null
        discount_type?: DiscountType | string | null
        discount_value?: number | null
    }
    clientName: string
    clientPhone: string | null
    businessName: string
}

export function EditOrderSheet({ order, clientName, clientPhone, businessName }: EditOrderProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [status, setStatus] = useState(order.status)
    const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
    const [discountType, setDiscountType] = useState<DiscountType>(
        (order.discount_type as DiscountType) || null
    )
    const [discountValue, setDiscountValue] = useState(Number(order.discount_value) || 0)

    const netAmount = getOrderNet({
        total_amount: order.total_amount,
        discount_type: discountType,
        discount_value: discountValue,
    })

    const messageContext: WhatsAppMessageContext = {
        clientName,
        businessName,
        orderName: order.fabric_description || 'Custom Order',
        status,
        deliveryDate: order.delivery_date,
        totalAmount: order.total_amount,
        paidAmount: order.paid_amount,
        discountType,
        discountValue,
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const newPaidAmount = Number(formData.get("paid_amount"))
        const newDeliveryDate = formData.get("delivery_date") as string

        const { error } = await supabase
            .from('orders')
            .update({
                status: status,
                payment_status: paymentStatus,
                paid_amount: newPaidAmount,
                delivery_date: newDeliveryDate,
                discount_type: discountType,
                discount_value: discountType ? discountValue : 0,
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
        if (paymentStatus === 'paid') return netAmount
        if (paymentStatus === 'unpaid') return 0
        return order.paid_amount || 0
    }

    const formattedDate = order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : ''

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit Order</span>
                </Button>
            </SheetTrigger>

            <SheetContent className="sm:max-w-[400px] sm:px-8 px-6 overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Manage Order</SheetTitle>
                    <SheetDescription>
                        Update progress, dates, discounts, and payments.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-6">

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

                    <OrderDiscountFields
                        totalAmount={order.total_amount}
                        type={discountType}
                        value={discountValue}
                        onTypeChange={setDiscountType}
                        onValueChange={setDiscountValue}
                    />

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
                            <Label className="text-muted-foreground text-xs">Net Amount</Label>
                            <Input disabled value={Math.round(netAmount)} className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paid_amount">Amount Paid</Label>
                            <Input
                                id="paid_amount"
                                name="paid_amount"
                                type="number"
                                defaultValue={getAmountDefaultValue()}
                                key={`${paymentStatus}-${netAmount}`}
                            />
                        </div>
                    </div>

                    <SheetFooter className="flex-col gap-2 sm:flex-col">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                        <WhatsAppMessageButton
                            phone={clientPhone}
                            context={messageContext}
                            label="Notify client on WhatsApp"
                            variant="secondary"
                            className="w-full"
                        />
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
